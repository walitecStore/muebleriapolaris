-- Mueblería Polaris — Etapa 5: tarifas autoritativas según ubicación.
-- Migración aditiva e idempotente. Ejecutar manualmente en Supabase.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_department TEXT,
  ADD COLUMN IF NOT EXISTS shipping_province TEXT,
  ADD COLUMN IF NOT EXISTS shipping_district TEXT,
  ADD COLUMN IF NOT EXISTS shipping_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS shipping_type TEXT,
  ADD COLUMN IF NOT EXISTS shipping_quote_status TEXT,
  ADD COLUMN IF NOT EXISTS shipping_route_provider TEXT;

CREATE TABLE IF NOT EXISTS public.shipping_distance_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_distance_km NUMERIC(10,2) NOT NULL,
  max_distance_km NUMERIC(10,2),
  base_cost NUMERIC(12,2) NOT NULL CHECK (base_cost >= 0),
  cost_per_extra_km NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_per_extra_km >= 0),
  minimum_cost NUMERIC(12,2) NOT NULL DEFAULT 70 CHECK (minimum_cost >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (max_distance_km IS NULL OR max_distance_km > min_distance_km)
);

CREATE TABLE IF NOT EXISTS public.shipping_zone_adjustments (
  district TEXT PRIMARY KEY,
  adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  surcharge_percent NUMERIC(7,2) NOT NULL DEFAULT 0,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_distance_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zone_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shipping_distance_bands_admin ON public.shipping_distance_bands;
CREATE POLICY shipping_distance_bands_admin ON public.shipping_distance_bands FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS shipping_zone_adjustments_admin ON public.shipping_zone_adjustments;
CREATE POLICY shipping_zone_adjustments_admin ON public.shipping_zone_adjustments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Parámetros iniciales del negocio. No constituyen una tabla exhaustiva por distrito.
INSERT INTO public.shipping_distance_bands(min_distance_km,max_distance_km,base_cost,cost_per_extra_km,minimum_cost,priority)
SELECT * FROM (VALUES
  (0::numeric, 8::numeric, 70::numeric, 0::numeric, 70::numeric, 10),
  (8::numeric, 15::numeric, 120::numeric, 0::numeric, 70::numeric, 10),
  (15::numeric, 25::numeric, 180::numeric, 0::numeric, 70::numeric, 10),
  (25::numeric, 40::numeric, 240::numeric, 3::numeric, 70::numeric, 10),
  (40::numeric, NULL::numeric, 285::numeric, 4::numeric, 70::numeric, 10)
) AS seed(min_km,max_km,base,per_km,minimum,priority)
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_distance_bands);

INSERT INTO public.shipping_zone_adjustments(district,adjustment,surcharge_percent,reason) VALUES
  ('COMAS', -50, 0, 'Referencia comercial inicial: aproximadamente S/ 70'),
  ('LA VICTORIA', 20, 0, 'Referencia comercial inicial: aproximadamente S/ 200')
ON CONFLICT (district) DO NOTHING;

CREATE OR REPLACE FUNCTION public.calculate_location_shipping(
  p_category_codes TEXT[], p_distance_km NUMERIC, p_district TEXT
) RETURNS NUMERIC LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_band public.shipping_distance_bands%ROWTYPE;
  v_adjustment NUMERIC := 0;
  v_percent NUMERIC := 0;
  v_category_surcharge NUMERIC := 0;
  v_cost NUMERIC;
BEGIN
  IF p_distance_km IS NULL OR p_distance_km < 0 OR p_distance_km > 500 THEN
    RAISE EXCEPTION 'Invalid route distance';
  END IF;
  SELECT * INTO v_band FROM public.shipping_distance_bands
   WHERE is_active AND p_distance_km >= min_distance_km
     AND (max_distance_km IS NULL OR p_distance_km < max_distance_km)
   ORDER BY priority DESC, min_distance_km DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'No active shipping band'; END IF;

  SELECT adjustment, surcharge_percent INTO v_adjustment, v_percent
    FROM public.shipping_zone_adjustments
   WHERE is_active AND upper(district) = upper(COALESCE(p_district,''));

  -- Conserva ajustes logísticos de categoría ya configurados en Etapa 2, una sola
  -- vez (el mayor), evitando sumar una tarifa completa por cada categoría.
  SELECT COALESCE(MAX(public.calculate_shipping_cost(code, p_distance_km)), 0)
    INTO v_category_surcharge FROM unnest(COALESCE(p_category_codes, ARRAY[]::TEXT[])) code;
  v_category_surcharge := LEAST(v_category_surcharge, 100);

  v_cost := v_band.base_cost
    + GREATEST(p_distance_km - v_band.min_distance_km, 0) * v_band.cost_per_extra_km
    + COALESCE(v_adjustment, 0) + v_category_surcharge;
  v_cost := v_cost * (1 + COALESCE(v_percent, 0) / 100);
  RETURN ROUND(GREATEST(v_band.minimum_cost, v_cost), 2);
END; $$;
REVOKE ALL ON FUNCTION public.calculate_location_shipping(TEXT[],NUMERIC,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_location_shipping(TEXT[],NUMERIC,TEXT) TO authenticated, anon;

-- Reemplaza la RPC de Etapa 4 manteniendo la firma y recalculando productos,
-- cantidades, precios, envío y total dentro de la misma transacción.
CREATE OR REPLACE FUNCTION public.create_validated_order(p_items JSONB,p_payment_method TEXT,p_shipping JSONB)
RETURNS TABLE(order_id UUID, order_number TEXT, payment_status TEXT, total NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user UUID := auth.uid(); v_order UUID; v_subtotal NUMERIC(12,2) := 0; v_shipping NUMERIC(12,2);
  v_item JSONB; v_product public.products%ROWTYPE; v_variant public.product_variants%ROWTYPE;
  v_quantity INTEGER; v_unit NUMERIC(12,2); v_categories TEXT[] := '{}'; v_category TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_payment_method NOT IN ('yape','plin','card','mercado_pago','bank_transfer') THEN RAISE EXCEPTION 'Unsupported payment method'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 50 THEN RAISE EXCEPTION 'Invalid cart'; END IF;
  IF (p_shipping->>'shippingType') <> 'lima_delivery' OR (p_shipping->>'quoteStatus') <> 'calculated' THEN RAISE EXCEPTION 'Shipping quote required'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_variant := NULL; v_quantity := (v_item->>'quantity')::INTEGER;
    IF v_quantity < 1 OR v_quantity > 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    SELECT * INTO v_product FROM public.products WHERE id=(v_item->>'productId')::UUID AND is_active FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product is unavailable'; END IF;
    v_unit := COALESCE(v_product.sale_price,v_product.price);
    IF NULLIF(v_item->>'variantId','') IS NOT NULL THEN
      SELECT * INTO v_variant FROM public.product_variants WHERE id=(v_item->>'variantId')::UUID AND product_id=v_product.id AND is_active FOR SHARE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Variant is unavailable'; END IF;
      v_unit := v_unit + COALESCE(v_variant.price_adjustment,0) + COALESCE(v_variant.additional_price,0);
    END IF;
    v_subtotal := v_subtotal + v_unit*v_quantity;
    v_category := COALESCE(v_product.shipping_category,'EUROPEO');
    IF NOT v_category=ANY(v_categories) THEN v_categories:=array_append(v_categories,v_category); END IF;
  END LOOP;
  v_shipping := public.calculate_location_shipping(v_categories,(p_shipping->>'distanceKm')::NUMERIC,p_shipping->>'district');
  INSERT INTO public.orders(user_id,status,subtotal,shipping_cost,total,payment_method,payment_status,payment_provider,
    shipping_latitude,shipping_longitude,shipping_address,shipping_reference,shipping_distance_km,
    shipping_department,shipping_province,shipping_district,shipping_duration_minutes,shipping_type,shipping_quote_status,shipping_route_provider,notes)
  VALUES(v_user,'confirmado',v_subtotal,v_shipping,v_subtotal+v_shipping,p_payment_method,'pending',
    CASE WHEN p_payment_method IN ('yape','plin','bank_transfer') THEN 'manual' END,
    (p_shipping->>'latitude')::NUMERIC,(p_shipping->>'longitude')::NUMERIC,NULLIF(p_shipping->>'address',''),NULLIF(p_shipping->>'reference',''),
    (p_shipping->>'distanceKm')::NUMERIC,NULLIF(p_shipping->>'department',''),NULLIF(p_shipping->>'province',''),NULLIF(p_shipping->>'district',''),
    NULLIF(p_shipping->>'durationMinutes','')::INTEGER,p_shipping->>'shippingType',p_shipping->>'quoteStatus',p_shipping->>'routeProvider',
    jsonb_build_object('checkout_created_at',now())::TEXT) RETURNING id INTO v_order;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_variant:=NULL; v_quantity:=(v_item->>'quantity')::INTEGER;
    SELECT * INTO v_product FROM public.products WHERE id=(v_item->>'productId')::UUID;
    v_unit:=COALESCE(v_product.sale_price,v_product.price);
    IF NULLIF(v_item->>'variantId','') IS NOT NULL THEN SELECT * INTO v_variant FROM public.product_variants WHERE id=(v_item->>'variantId')::UUID; v_unit:=v_unit+COALESCE(v_variant.price_adjustment,0)+COALESCE(v_variant.additional_price,0); END IF;
    INSERT INTO public.order_items(order_id,product_id,variant_id,quantity,unit_price,product_name,product_sku,product_image_url,product_snapshot,variant_name,variant_snapshot)
    VALUES(v_order,v_product.id,NULLIF(v_item->>'variantId','')::UUID,v_quantity,v_unit,v_product.name,v_product.sku,v_product.image_url,
      jsonb_build_object('id',v_product.id,'name',v_product.name,'sku',v_product.sku,'image_url',v_product.image_url,'price',v_unit),v_variant.name,
      CASE WHEN v_variant.id IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('id',v_variant.id,'name',v_variant.name,'sku',v_variant.sku,'attributes',v_variant.attributes) END);
  END LOOP;
  RETURN QUERY SELECT o.id,o.order_number,o.payment_status,o.total FROM public.orders o WHERE o.id=v_order;
END; $$;
REVOKE ALL ON FUNCTION public.create_validated_order(JSONB,TEXT,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_validated_order(JSONB,TEXT,JSONB) TO authenticated;
