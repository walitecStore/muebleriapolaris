-- Mueblería Polaris — Etapa 4: checkout y pagos seguros.
-- Aditiva, idempotente y preparada para ejecutarse manualmente en Supabase.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS checkout_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique ON public.orders(order_number);
CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_token_unique ON public.orders(checkout_token);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders(payment_status);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  provider TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.payment_methods(code,label,provider,sort_order) VALUES
  ('yape','Yape','manual',10), ('plin','Plin','manual',20),
  ('card','Tarjeta de crédito/débito',NULL,30),
  ('mercado_pago','Mercado Pago',NULL,40),
  ('bank_transfer','Transferencia bancaria','manual',50)
ON CONFLICT (code) DO NOTHING;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_methods_public_read ON public.payment_methods;
CREATE POLICY payment_methods_public_read ON public.payment_methods FOR SELECT TO public USING (is_active);
DROP POLICY IF EXISTS payment_methods_admin_write ON public.payment_methods;
CREATE POLICY payment_methods_admin_write ON public.payment_methods FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- La creación directa permitía que el navegador eligiera totales y estado.
-- Desde esta etapa los pedidos e items solo se crean mediante la RPC validada.
DROP POLICY IF EXISTS orders_own_insert ON public.orders;
DROP POLICY IF EXISTS order_items_own_insert ON public.order_items;

UPDATE public.orders
SET order_number = 'POL-' || upper(substr(replace(id::text, '-', ''), 1, 8))
WHERE order_number IS NULL;

ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT
  ('POL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)));

DO $$ BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_valid
    CHECK (payment_status IN ('pending','approved','rejected','cancelled','failed','pendiente','aprobado','rechazado','cancelado','fallido')) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.create_validated_order(
  p_items JSONB,
  p_payment_method TEXT,
  p_shipping JSONB
) RETURNS TABLE(order_id UUID, order_number TEXT, payment_status TEXT, total NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user UUID := auth.uid();
  v_order UUID;
  v_subtotal NUMERIC(12,2) := 0;
  v_shipping NUMERIC(12,2) := 0;
  v_item JSONB;
  v_product public.products%ROWTYPE;
  v_variant public.product_variants%ROWTYPE;
  v_quantity INTEGER;
  v_unit NUMERIC(12,2);
  v_categories TEXT[] := '{}';
  v_category TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_payment_method NOT IN ('yape','plin','card','mercado_pago','bank_transfer') THEN
    RAISE EXCEPTION 'Unsupported payment method';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;
  IF jsonb_array_length(p_items) > 50 THEN RAISE EXCEPTION 'Too many cart items'; END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_variant := NULL;
    v_quantity := (v_item->>'quantity')::INTEGER;
    IF v_quantity < 1 OR v_quantity > 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    SELECT * INTO v_product FROM public.products
      WHERE id = (v_item->>'productId')::UUID AND is_active = TRUE FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product is unavailable'; END IF;
    v_unit := COALESCE(v_product.sale_price, v_product.price);
    IF NULLIF(v_item->>'variantId','') IS NOT NULL THEN
      SELECT * INTO v_variant FROM public.product_variants
        WHERE id = (v_item->>'variantId')::UUID AND product_id = v_product.id AND is_active = TRUE FOR SHARE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Variant is unavailable'; END IF;
      v_unit := v_unit + COALESCE(v_variant.price_adjustment, 0) + COALESCE(v_variant.additional_price, 0);
    END IF;
    v_subtotal := v_subtotal + (v_unit * v_quantity);
    v_category := COALESCE(v_product.shipping_category, 'EUROPEO');
    IF NOT v_category = ANY(v_categories) THEN v_categories := array_append(v_categories, v_category); END IF;
  END LOOP;

  FOREACH v_category IN ARRAY v_categories LOOP
    v_shipping := v_shipping + public.calculate_shipping_cost(v_category, (p_shipping->>'distanceKm')::NUMERIC);
  END LOOP;

  INSERT INTO public.orders(user_id, status, subtotal, shipping_cost, total, payment_method,
    payment_status, payment_provider, shipping_latitude, shipping_longitude,
    shipping_address, shipping_reference, shipping_distance_km, notes)
  VALUES (v_user, 'confirmado', v_subtotal, v_shipping, v_subtotal + v_shipping, p_payment_method,
    'pending', CASE WHEN p_payment_method IN ('yape','plin','bank_transfer') THEN 'manual' ELSE NULL END,
    (p_shipping->>'latitude')::NUMERIC, (p_shipping->>'longitude')::NUMERIC,
    NULLIF(p_shipping->>'address',''), NULLIF(p_shipping->>'address',''),
    (p_shipping->>'distanceKm')::NUMERIC, jsonb_build_object('checkout_created_at', now())::TEXT)
  RETURNING id INTO v_order;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_variant := NULL;
    v_quantity := (v_item->>'quantity')::INTEGER;
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'productId')::UUID;
    v_unit := COALESCE(v_product.sale_price, v_product.price);
    IF NULLIF(v_item->>'variantId','') IS NOT NULL THEN
      SELECT * INTO v_variant FROM public.product_variants WHERE id = (v_item->>'variantId')::UUID;
      v_unit := v_unit + COALESCE(v_variant.price_adjustment, 0) + COALESCE(v_variant.additional_price, 0);
    END IF;
    INSERT INTO public.order_items(order_id, product_id, variant_id, quantity, unit_price,
      product_name, product_sku, product_image_url, product_snapshot, variant_name, variant_snapshot)
    VALUES (v_order, v_product.id, NULLIF(v_item->>'variantId','')::UUID, v_quantity, v_unit,
      v_product.name, v_product.sku, v_product.image_url,
      jsonb_build_object('id',v_product.id,'name',v_product.name,'sku',v_product.sku,'image_url',v_product.image_url,'price',v_unit),
      v_variant.name, CASE WHEN v_variant.id IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('id',v_variant.id,'name',v_variant.name,'sku',v_variant.sku,'attributes',v_variant.attributes) END);
  END LOOP;

  RETURN QUERY SELECT o.id, o.order_number, o.payment_status, o.total FROM public.orders o WHERE o.id = v_order;
END; $$;

REVOKE ALL ON FUNCTION public.create_validated_order(JSONB,TEXT,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_validated_order(JSONB,TEXT,JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_cart_item(p_product_id UUID, p_variant_id UUID, p_quantity INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_cart UUID;
BEGIN
  IF auth.uid() IS NULL OR p_quantity < 1 THEN RAISE EXCEPTION 'Invalid cart item'; END IF;
  INSERT INTO public.shopping_carts(user_id) VALUES (auth.uid())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = now() RETURNING id INTO v_cart;
  UPDATE public.cart_items SET quantity = GREATEST(quantity, p_quantity), updated_at = now()
    WHERE cart_id = v_cart AND product_id = p_product_id AND variant_id IS NOT DISTINCT FROM p_variant_id;
  IF NOT FOUND THEN
    INSERT INTO public.cart_items(cart_id, product_id, variant_id, quantity)
    VALUES(v_cart, p_product_id, p_variant_id, p_quantity);
  END IF;
END; $$;
REVOKE ALL ON FUNCTION public.sync_cart_item(UUID,UUID,INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_cart_item(UUID,UUID,INTEGER) TO authenticated;

-- La aprobación queda deliberadamente fuera del cliente. Integrar el webhook del
-- proveedor con service_role y actualizar payment_status/payment_id/paid_at desde backend.
