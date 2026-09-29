-- Mueblería Polaris — corrección aditiva de envíos, pagos y devoluciones.
-- Ejecutar manualmente. No contiene coordenadas, distancias, cuentas ni credenciales inventadas.

CREATE TABLE IF NOT EXISTS public.shipping_district_centers (
  district TEXT PRIMARY KEY,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  province TEXT NOT NULL,
  department TEXT NOT NULL,
  center_lat NUMERIC(10,7),
  center_lng NUMERIC(10,7),
  center_reference_name TEXT NOT NULL,
  center_route_distance_km NUMERIC(10,2),
  base_shipping_price NUMERIC(12,2),
  before_center_adjustment NUMERIC(12,2) NOT NULL DEFAULT -5,
  after_center_adjustment NUMERIC(12,2) NOT NULL DEFAULT 10,
  center_tolerance_km NUMERIC(10,2) NOT NULL DEFAULT 1.5,
  minimum_shipping_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  maximum_shipping_price NUMERIC(12,2),
  automatic_shipping BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (center_route_distance_km IS NULL OR center_route_distance_km >= 0),
  CHECK (base_shipping_price IS NULL OR base_shipping_price >= 0),
  CHECK (minimum_shipping_price >= 0),
  CHECK (maximum_shipping_price IS NULL OR maximum_shipping_price >= minimum_shipping_price),
  CHECK (center_tolerance_km >= 0),
  CHECK ((center_lat IS NULL) = (center_lng IS NULL))
);
ALTER TABLE public.shipping_district_centers
  ADD COLUMN IF NOT EXISTS maximum_shipping_price NUMERIC(12,2);
ALTER TABLE public.shipping_district_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shipping_district_centers_public_read ON public.shipping_district_centers;
CREATE POLICY shipping_district_centers_public_read ON public.shipping_district_centers
  FOR SELECT USING (active);
DROP POLICY IF EXISTS shipping_district_centers_admin_all ON public.shipping_district_centers;
CREATE POLICY shipping_district_centers_admin_all ON public.shipping_district_centers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Los 43 distritos de la Provincia de Lima. Las coordenadas y distancias quedan NULL
-- hasta ser verificadas por el motor de rutas o configuradas por administración.
INSERT INTO public.shipping_district_centers
  (district,aliases,province,department,center_reference_name,base_shipping_price,
   minimum_shipping_price,maximum_shipping_price,automatic_shipping)
VALUES
 ('Ancón','{}','Lima','Lima','Municipalidad Distrital de Ancón',NULL,0,NULL,TRUE),
 ('Ate',ARRAY['Ate Vitarte','Vitarte'],'Lima','Lima','Municipalidad Distrital de Ate',NULL,0,NULL,TRUE),
 ('Barranco','{}','Lima','Lima','Municipalidad Distrital de Barranco',NULL,0,NULL,TRUE),
 ('Breña','{}','Lima','Lima','Municipalidad Distrital de Breña',NULL,0,NULL,TRUE),
 ('Carabayllo','{}','Lima','Lima','Municipalidad Distrital de Carabayllo',NULL,0,NULL,TRUE),
 ('Chaclacayo','{}','Lima','Lima','Municipalidad Distrital de Chaclacayo',NULL,0,NULL,TRUE),
 ('Chorrillos','{}','Lima','Lima','Municipalidad Distrital de Chorrillos',160,0,NULL,TRUE),
 ('Cieneguilla','{}','Lima','Lima','Municipalidad Distrital de Cieneguilla',NULL,0,NULL,TRUE),
 ('Comas','{}','Lima','Lima','Municipalidad Distrital de Comas',70,0,NULL,TRUE),
 ('El Agustino','{}','Lima','Lima','Municipalidad Distrital de El Agustino',NULL,0,NULL,TRUE),
 ('Independencia','{}','Lima','Lima','Municipalidad Distrital de Independencia',NULL,0,NULL,TRUE),
 ('Jesús María','{}','Lima','Lima','Municipalidad Distrital de Jesús María',NULL,0,NULL,TRUE),
 ('La Molina','{}','Lima','Lima','Municipalidad Distrital de La Molina',NULL,0,NULL,TRUE),
 ('La Victoria','{}','Lima','Lima','Municipalidad Distrital de La Victoria',200,0,NULL,TRUE),
 ('Lima',ARRAY['Cercado de Lima'],'Lima','Lima','Municipalidad Metropolitana de Lima',NULL,0,NULL,TRUE),
 ('Lince','{}','Lima','Lima','Municipalidad Distrital de Lince',NULL,0,NULL,TRUE),
 ('Los Olivos','{}','Lima','Lima','Municipalidad Distrital de Los Olivos',50,0,NULL,TRUE),
 ('Lurigancho-Chosica',ARRAY['Chosica','Lurigancho'],'Lima','Lima','Municipalidad Distrital de Lurigancho-Chosica',290,0,NULL,TRUE),
 ('Lurín','{}','Lima','Lima','Municipalidad Distrital de Lurín',NULL,0,NULL,TRUE),
 ('Magdalena del Mar',ARRAY['Magdalena'],'Lima','Lima','Municipalidad Distrital de Magdalena del Mar',NULL,0,NULL,TRUE),
 ('Miraflores','{}','Lima','Lima','Municipalidad Distrital de Miraflores',NULL,0,NULL,TRUE),
 ('Pachacámac','{}','Lima','Lima','Municipalidad Distrital de Pachacámac',NULL,0,NULL,TRUE),
 ('Pucusana','{}','Lima','Lima','Municipalidad Distrital de Pucusana',NULL,0,NULL,TRUE),
 ('Pueblo Libre',ARRAY['Magdalena Vieja'],'Lima','Lima','Municipalidad Distrital de Pueblo Libre',NULL,0,NULL,TRUE),
 ('Puente Piedra','{}','Lima','Lima','Municipalidad Distrital de Puente Piedra',NULL,80,115,TRUE),
 ('Punta Hermosa','{}','Lima','Lima','Municipalidad Distrital de Punta Hermosa',NULL,0,NULL,TRUE),
 ('Punta Negra','{}','Lima','Lima','Municipalidad Distrital de Punta Negra',NULL,0,NULL,TRUE),
 ('Rímac','{}','Lima','Lima','Municipalidad Distrital del Rímac',NULL,0,NULL,TRUE),
 ('San Bartolo','{}','Lima','Lima','Municipalidad Distrital de San Bartolo',NULL,0,NULL,TRUE),
 ('San Borja','{}','Lima','Lima','Municipalidad Distrital de San Borja',NULL,0,NULL,TRUE),
 ('San Isidro','{}','Lima','Lima','Municipalidad Distrital de San Isidro',NULL,0,NULL,TRUE),
 ('San Juan de Lurigancho','{}','Lima','Lima','Municipalidad Distrital de San Juan de Lurigancho',NULL,0,NULL,TRUE),
 ('San Juan de Miraflores','{}','Lima','Lima','Municipalidad Distrital de San Juan de Miraflores',NULL,0,NULL,TRUE),
 ('San Luis','{}','Lima','Lima','Municipalidad Distrital de San Luis',NULL,0,NULL,TRUE),
 ('San Martín de Porres',ARRAY['San Martin de Porres'],'Lima','Lima','Municipalidad Distrital de San Martín de Porres',NULL,0,NULL,FALSE),
 ('San Miguel','{}','Lima','Lima','Municipalidad Distrital de San Miguel',NULL,0,NULL,TRUE),
 ('Santa Anita','{}','Lima','Lima','Municipalidad Distrital de Santa Anita',NULL,0,NULL,TRUE),
 ('Santa María del Mar','{}','Lima','Lima','Municipalidad Distrital de Santa María del Mar',NULL,0,NULL,TRUE),
 ('Santa Rosa','{}','Lima','Lima','Municipalidad Distrital de Santa Rosa',NULL,0,NULL,TRUE),
 ('Santiago de Surco',ARRAY['Surco'],'Lima','Lima','Municipalidad Distrital de Santiago de Surco',NULL,0,NULL,TRUE),
 ('Surquillo','{}','Lima','Lima','Municipalidad Distrital de Surquillo',NULL,0,NULL,TRUE),
 ('Villa El Salvador','{}','Lima','Lima','Municipalidad Distrital de Villa El Salvador',NULL,0,NULL,TRUE),
 ('Villa María del Triunfo','{}','Lima','Lima','Municipalidad Distrital de Villa María del Triunfo',NULL,0,NULL,TRUE),
 -- Callao es cobertura adicional explícita y queda desactivada hasta contar con tarifa comercial.
 ('La Perla','{}','Provincia Constitucional del Callao','Callao','Municipalidad Distrital de La Perla',NULL,0,NULL,FALSE)
ON CONFLICT (district) DO UPDATE SET
 aliases=EXCLUDED.aliases, province=EXCLUDED.province, department=EXCLUDED.department,
 center_reference_name=EXCLUDED.center_reference_name,
 base_shipping_price=EXCLUDED.base_shipping_price,
 minimum_shipping_price=EXCLUDED.minimum_shipping_price,
 maximum_shipping_price=EXCLUDED.maximum_shipping_price,
 automatic_shipping=EXCLUDED.automatic_shipping;

ALTER TABLE public.orders
 ADD COLUMN IF NOT EXISTS shipping_center_distance_km NUMERIC(10,2),
 ADD COLUMN IF NOT EXISTS shipping_center_delta_km NUMERIC(10,2),
 ADD COLUMN IF NOT EXISTS shipping_base_price NUMERIC(12,2),
 ADD COLUMN IF NOT EXISTS shipping_adjustment NUMERIC(12,2),
 ADD COLUMN IF NOT EXISTS shipping_product_factor NUMERIC(10,4),
 ADD COLUMN IF NOT EXISTS shipping_pricing_version TEXT;

CREATE TABLE IF NOT EXISTS public.return_requests (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
 order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
 user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 request_type TEXT NOT NULL CHECK (request_type IN ('return_and_refund','refund_only')),
 quantity INTEGER NOT NULL CHECK(quantity>0),
 reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 120),
 description TEXT CHECK (description IS NULL OR char_length(description) <= 1000),
 status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','under_review','approved','rejected','refunded','cancelled')),
 refund_amount NUMERIC(12,2) NOT NULL CHECK(refund_amount>=0),
 refund_shipping BOOLEAN NOT NULL DEFAULT FALSE,
 provider_refund_id TEXT,
 admin_note TEXT,
 metadata JSONB NOT NULL DEFAULT '{}',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS return_requests_order_idx ON public.return_requests(order_id,created_at DESC);
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS return_requests_own_read ON public.return_requests;
CREATE POLICY return_requests_own_read ON public.return_requests FOR SELECT TO authenticated
 USING(user_id=auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS return_requests_admin_all ON public.return_requests;
CREATE POLICY return_requests_admin_all ON public.return_requests FOR ALL TO authenticated
 USING(public.is_admin()) WITH CHECK(public.is_admin());

CREATE OR REPLACE FUNCTION public.request_return(
 p_order_item_id UUID,p_quantity INTEGER,p_request_type TEXT,p_reason TEXT,p_description TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_item public.order_items%ROWTYPE; v_order public.orders%ROWTYPE; v_used INTEGER; v_id UUID;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_request_type NOT IN ('return_and_refund','refund_only') OR p_quantity<1
    OR char_length(trim(COALESCE(p_reason,''))) NOT BETWEEN 3 AND 120
    OR char_length(COALESCE(p_description,''))>1000 THEN RAISE EXCEPTION 'Invalid request'; END IF;
 -- Serializa todas las solicitudes del mismo item, incluso cuando todavía no existe una fila en return_requests.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_order_item_id::text,0));
 SELECT * INTO v_item FROM public.order_items WHERE id=p_order_item_id FOR UPDATE;
 SELECT * INTO v_order FROM public.orders WHERE id=v_item.order_id AND user_id=auth.uid() FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Order item not found'; END IF;
 IF v_order.status NOT IN ('entregado','confirmado','preparando','empaquetando','preparando_envio','camino') THEN
   RAISE EXCEPTION 'Order is not eligible';
 END IF;
 SELECT COALESCE(sum(quantity),0) INTO v_used FROM public.return_requests
  WHERE order_item_id=v_item.id AND status NOT IN ('rejected','cancelled');
 IF p_quantity+v_used>v_item.quantity THEN RAISE EXCEPTION 'Requested quantity exceeds purchased quantity'; END IF;
 INSERT INTO public.return_requests(order_id,order_item_id,user_id,request_type,quantity,reason,description,refund_amount)
 VALUES(v_order.id,v_item.id,auth.uid(),p_request_type,p_quantity,trim(p_reason),
   NULLIF(trim(COALESCE(p_description,'')),''),round(v_item.unit_price*p_quantity,2)) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.request_return(UUID,INTEGER,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_return(UUID,INTEGER,TEXT,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_return_request(
 p_request_id UUID,p_status TEXT,p_admin_note TEXT DEFAULT NULL,p_provider_refund_id TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF p_status NOT IN ('under_review','approved','rejected','refunded','cancelled') THEN RAISE EXCEPTION 'Invalid status'; END IF;
 IF p_status='refunded' AND COALESCE(trim(p_provider_refund_id),'')='' THEN RAISE EXCEPTION 'Refund confirmation reference required'; END IF;
 UPDATE public.return_requests SET status=p_status,admin_note=NULLIF(trim(COALESCE(p_admin_note,'')),''),
  provider_refund_id=CASE WHEN p_status='refunded' THEN trim(p_provider_refund_id) ELSE provider_refund_id END,
  updated_at=now() WHERE id=p_request_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_return_request(UUID,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_return_request(UUID,TEXT,TEXT,TEXT) TO authenticated;

-- La firma antigua deja de ser accesible desde clientes. Solo la ruta de servidor,
-- autenticada con service_role, puede crear pedidos con una cotización vial verificada.
REVOKE ALL ON FUNCTION public.create_validated_order(JSONB,TEXT,JSONB) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.create_server_validated_order(
 p_user_id UUID,p_items JSONB,p_payment_method TEXT,p_shipping JSONB
) RETURNS TABLE(order_id UUID,order_number TEXT,payment_status TEXT,total NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_order UUID; v_subtotal NUMERIC(12,2):=0; v_shipping NUMERIC(12,2); v_expected NUMERIC(12,2);
 v_item JSONB; v_product public.products%ROWTYPE; v_variant public.product_variants%ROWTYPE;
 v_quantity INTEGER; v_unit NUMERIC(12,2); v_factor NUMERIC(10,4):=1;
 v_center public.shipping_district_centers%ROWTYPE; v_base NUMERIC(12,2); v_adjustment NUMERIC(12,2):=0;
BEGIN
 IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'Server role required'; END IF;
 IF p_user_id IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id) THEN RAISE EXCEPTION 'Invalid user'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.payment_methods WHERE code=p_payment_method AND is_active) THEN RAISE EXCEPTION 'Unsupported payment method'; END IF;
 IF jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items)=0 OR jsonb_array_length(p_items)>50 THEN RAISE EXCEPTION 'Invalid cart'; END IF;
 IF p_shipping->>'shippingType'<>'lima_delivery' OR p_shipping->>'quoteStatus'<>'calculated' THEN RAISE EXCEPTION 'Shipping quote required'; END IF;
 IF NULLIF(p_shipping->>'distanceKm','') IS NULL OR (p_shipping->>'distanceKm')::NUMERIC<0
    OR NULLIF(p_shipping->>'centerDistanceKm','') IS NULL OR (p_shipping->>'centerDistanceKm')::NUMERIC<0 THEN
   RAISE EXCEPTION 'Invalid route distance';
 END IF;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
   v_variant:=NULL; v_quantity:=(v_item->>'quantity')::INTEGER;
   IF v_quantity<1 OR v_quantity>99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
   SELECT * INTO v_product FROM public.products WHERE id=(v_item->>'productId')::UUID AND is_active FOR SHARE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Product is unavailable'; END IF;
   v_unit:=COALESCE(v_product.sale_price,v_product.price);
   IF NULLIF(v_item->>'variantId','') IS NOT NULL THEN
     SELECT * INTO v_variant FROM public.product_variants WHERE id=(v_item->>'variantId')::UUID
       AND product_id=v_product.id AND is_active FOR SHARE;
     IF NOT FOUND THEN RAISE EXCEPTION 'Variant is unavailable'; END IF;
     v_unit:=v_unit+COALESCE(v_variant.price_adjustment,0)+COALESCE(v_variant.additional_price,0);
   END IF;
   v_subtotal:=v_subtotal+v_unit*v_quantity;
   v_factor:=GREATEST(v_factor,COALESCE(v_product.shipping_factor,1));
 END LOOP;
 SELECT * INTO v_center FROM public.shipping_district_centers
  WHERE active AND automatic_shipping AND
   (upper(district)=upper(p_shipping->>'district') OR upper(p_shipping->>'district')=ANY(SELECT upper(x) FROM unnest(aliases)x));
 IF NOT FOUND THEN RAISE EXCEPTION 'Destination is not covered'; END IF;
 v_base:=COALESCE(v_center.base_shipping_price,NULLIF(p_shipping->>'basePrice','')::NUMERIC);
 IF v_base IS NULL OR v_base<0 THEN RAISE EXCEPTION 'Invalid base price'; END IF;
 IF (p_shipping->>'centerDeltaKm')::NUMERIC < -v_center.center_tolerance_km THEN v_adjustment:=v_center.before_center_adjustment;
 ELSIF (p_shipping->>'centerDeltaKm')::NUMERIC > v_center.center_tolerance_km THEN v_adjustment:=v_center.after_center_adjustment;
 END IF;
 v_expected:=GREATEST(v_center.minimum_shipping_price,v_base*v_factor+v_adjustment);
 IF v_center.maximum_shipping_price IS NOT NULL THEN v_expected:=LEAST(v_expected,v_center.maximum_shipping_price); END IF;
 v_expected:=round(v_expected/5)*5;
 v_shipping:=NULLIF(p_shipping->>'shippingAmount','')::NUMERIC;
 IF v_shipping IS NULL OR v_shipping<0 OR abs(v_shipping-v_expected)>0.01 THEN RAISE EXCEPTION 'Shipping quote validation failed'; END IF;
 INSERT INTO public.orders(user_id,status,subtotal,shipping_cost,total,payment_method,payment_status,payment_provider,
  shipping_latitude,shipping_longitude,shipping_address,shipping_reference,shipping_distance_km,
  shipping_department,shipping_province,shipping_district,shipping_duration_minutes,shipping_type,
  shipping_quote_status,shipping_route_provider,shipping_center_distance_km,shipping_center_delta_km,
  shipping_base_price,shipping_adjustment,shipping_product_factor,shipping_pricing_version,notes)
 VALUES(p_user_id,'confirmado',v_subtotal,v_shipping,v_subtotal+v_shipping,p_payment_method,'pending',
  CASE WHEN p_payment_method IN('yape','plin','bank_transfer') THEN 'manual' END,
  (p_shipping->>'latitude')::NUMERIC,(p_shipping->>'longitude')::NUMERIC,NULLIF(p_shipping->>'address',''),
  NULLIF(p_shipping->>'reference',''),(p_shipping->>'distanceKm')::NUMERIC,NULLIF(p_shipping->>'department',''),
  NULLIF(p_shipping->>'province',''),NULLIF(p_shipping->>'district',''),NULLIF(p_shipping->>'durationMinutes','')::INTEGER,
  p_shipping->>'shippingType',p_shipping->>'quoteStatus',p_shipping->>'routeProvider',
  (p_shipping->>'centerDistanceKm')::NUMERIC,(p_shipping->>'centerDeltaKm')::NUMERIC,v_base,v_adjustment,v_factor,
  p_shipping->>'pricingVersion',jsonb_build_object('checkout_created_at',now())::TEXT) RETURNING id INTO v_order;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
   v_variant:=NULL; v_quantity:=(v_item->>'quantity')::INTEGER;
   SELECT * INTO v_product FROM public.products WHERE id=(v_item->>'productId')::UUID;
   v_unit:=COALESCE(v_product.sale_price,v_product.price);
   IF NULLIF(v_item->>'variantId','') IS NOT NULL THEN
     SELECT * INTO v_variant FROM public.product_variants WHERE id=(v_item->>'variantId')::UUID;
     v_unit:=v_unit+COALESCE(v_variant.price_adjustment,0)+COALESCE(v_variant.additional_price,0);
   END IF;
   INSERT INTO public.order_items(order_id,product_id,variant_id,quantity,unit_price,product_name,product_sku,
    product_image_url,product_snapshot,variant_name,variant_snapshot)
   VALUES(v_order,v_product.id,NULLIF(v_item->>'variantId','')::UUID,v_quantity,v_unit,v_product.name,v_product.sku,
    v_product.image_url,jsonb_build_object('id',v_product.id,'name',v_product.name,'sku',v_product.sku,
    'image_url',v_product.image_url,'price',v_unit),v_variant.name,CASE WHEN v_variant.id IS NULL THEN '{}'::jsonb
    ELSE jsonb_build_object('id',v_variant.id,'name',v_variant.name,'sku',v_variant.sku,'attributes',v_variant.attributes) END);
 END LOOP;
 RETURN QUERY SELECT o.id,o.order_number,o.payment_status,o.total FROM public.orders o WHERE o.id=v_order;
END $$;
REVOKE ALL ON FUNCTION public.create_server_validated_order(UUID,JSONB,TEXT,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_server_validated_order(UUID,JSONB,TEXT,JSONB) TO service_role;
