-- Alinea la validación transaccional con el motor autoritativo v3.
-- Migración aditiva; no altera los datos comerciales existentes.

CREATE TABLE IF NOT EXISTS public.shipping_price_calibrations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 location_name TEXT NOT NULL,
 normalized_name TEXT NOT NULL UNIQUE,
 location_type TEXT NOT NULL CHECK(location_type IN ('DISTRICT','PROVINCE','LOCALITY')),
 department TEXT,
 province TEXT,
 district TEXT,
 aliases TEXT[] NOT NULL DEFAULT '{}',
 center_lat NUMERIC(10,7),
 center_lng NUMERIC(10,7),
 center_reference_name TEXT,
 center_route_distance_km NUMERIC(10,2),
 reference_price NUMERIC(12,2),
 center_tolerance_km NUMERIC(10,2) NOT NULL DEFAULT 1,
 before_center_adjustment NUMERIC(12,2) NOT NULL DEFAULT -5,
 after_center_adjustment NUMERIC(12,2) NOT NULL DEFAULT 10,
 pricing_corridor TEXT NOT NULL CHECK(pricing_corridor IN ('NORTH','EAST','SOUTH','CENTRAL','CALLAO')),
 coverage_type TEXT NOT NULL CHECK(coverage_type IN ('METROPOLITAN','NEAR_LIMA','MANUAL_QUOTE','OUT_OF_COVERAGE')),
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK ((center_lat IS NULL) = (center_lng IS NULL)),
 CHECK (center_route_distance_km IS NULL OR center_route_distance_km > 0),
 CHECK (reference_price IS NULL OR reference_price > 0),
 CHECK (center_tolerance_km >= 0)
);

CREATE TABLE IF NOT EXISTS public.shipping_pricing_rules (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 rule_name TEXT NOT NULL UNIQUE,
 minimum_extrapolation_rate NUMERIC(12,4),
 maximum_extrapolation_rate NUMERIC(12,4),
 rounding_increment NUMERIC(12,2) NOT NULL DEFAULT 5,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (minimum_extrapolation_rate IS NULL OR maximum_extrapolation_rate IS NULL OR maximum_extrapolation_rate >= minimum_extrapolation_rate),
 CHECK (rounding_increment > 0)
);

ALTER TABLE public.shipping_price_calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_pricing_rules ENABLE ROW LEVEL SECURITY;

-- Las distancias quedan NULL hasta medirse; el runtime geocodifica la referencia y ruta Polaris→centro.
INSERT INTO public.shipping_price_calibrations
 (location_name,normalized_name,location_type,department,province,district,aliases,
  center_reference_name,reference_price,pricing_corridor,coverage_type)
VALUES
 ('Los Olivos','los olivos','DISTRICT','Lima','Lima','Los Olivos','{}','Municipalidad Distrital de Los Olivos, Lima, Perú',50,'NORTH','METROPOLITAN'),
 ('Comas','comas','DISTRICT','Lima','Lima','Comas','{}','Municipalidad Distrital de Comas, Lima, Perú',70,'NORTH','METROPOLITAN'),
 ('Puente Piedra','puente piedra','DISTRICT','Lima','Lima','Puente Piedra','{}','Municipalidad Distrital de Puente Piedra, Lima, Perú',80,'NORTH','METROPOLITAN'),
 ('La Victoria','la victoria','DISTRICT','Lima','Lima','La Victoria','{}','Municipalidad Distrital de La Victoria, Lima, Perú',200,'CENTRAL','METROPOLITAN'),
 ('Chorrillos','chorrillos','DISTRICT','Lima','Lima','Chorrillos','{}','Municipalidad Distrital de Chorrillos, Lima, Perú',160,'SOUTH','METROPOLITAN'),
 ('Lurigancho-Chosica','lurigancho-chosica','DISTRICT','Lima','Lima','Lurigancho-Chosica',ARRAY['Chosica','Lurigancho'],'Municipalidad Distrital de Lurigancho-Chosica, Lima, Perú',290,'EAST','NEAR_LIMA'),
 ('Callao','callao','PROVINCE','Callao','Provincia Constitucional del Callao',NULL,ARRAY['Provincia Constitucional del Callao'],'Municipalidad Provincial del Callao, Callao, Perú',NULL,'CALLAO','METROPOLITAN'),
 ('Huaral','huaral','LOCALITY','Lima','Huaral',NULL,'{}','Municipalidad Provincial de Huaral, Lima, Perú',NULL,'NORTH','NEAR_LIMA'),
 ('Chancay','chancay','LOCALITY','Lima','Huaral',NULL,'{}','Municipalidad Distrital de Chancay, Huaral, Lima, Perú',NULL,'NORTH','NEAR_LIMA'),
 ('Huacho','huacho','LOCALITY','Lima','Huaura',NULL,'{}','Municipalidad Provincial de Huaura, Huacho, Lima, Perú',NULL,'NORTH','NEAR_LIMA'),
 ('Barranca','barranca','LOCALITY','Lima','Barranca',NULL,'{}','Municipalidad Provincial de Barranca, Lima, Perú',NULL,'NORTH','NEAR_LIMA')
ON CONFLICT(normalized_name) DO UPDATE SET
 location_name=EXCLUDED.location_name,location_type=EXCLUDED.location_type,
 department=EXCLUDED.department,province=EXCLUDED.province,district=EXCLUDED.district,
 aliases=EXCLUDED.aliases,reference_price=EXCLUDED.reference_price,
 center_reference_name=EXCLUDED.center_reference_name,pricing_corridor=EXCLUDED.pricing_corridor,
 coverage_type=EXCLUDED.coverage_type,active=TRUE,updated_at=now();

-- Copia los demás destinos metropolitanos como cobertura configurable sin inventar precios.
INSERT INTO public.shipping_price_calibrations
 (location_name,normalized_name,location_type,department,province,district,aliases,
  center_reference_name,pricing_corridor,coverage_type)
SELECT district,lower(translate(trim(district),'ÁÉÍÓÚÜÑáéíóúüñ','AEIOUUNaeiouun')),
 'DISTRICT',department,province,district,aliases,
 center_reference_name||', '||province||', '||department||', Perú',
 CASE
  WHEN department='Callao' OR province ILIKE '%Callao%' THEN 'CALLAO'
  WHEN district IN ('Ancón','Carabayllo','Comas','Los Olivos','Puente Piedra','Santa Rosa') THEN 'NORTH'
  WHEN district IN ('Ate','Chaclacayo','El Agustino','Lurigancho-Chosica','San Juan de Lurigancho','Santa Anita') THEN 'EAST'
  WHEN district IN ('Chorrillos','Lurín','Pachacámac','Pucusana','Punta Hermosa','Punta Negra','San Bartolo','Santa María del Mar','Villa El Salvador','Villa María del Triunfo') THEN 'SOUTH'
  ELSE 'CENTRAL'
 END,'METROPOLITAN'
FROM public.shipping_district_centers WHERE active
ON CONFLICT(normalized_name) DO NOTHING;

INSERT INTO public.shipping_pricing_rules
 (rule_name,minimum_extrapolation_rate,maximum_extrapolation_rate,rounding_increment)
VALUES ('DEFAULT',NULL,NULL,5)
ON CONFLICT(rule_name) DO NOTHING;

REVOKE ALL ON TABLE public.shipping_price_calibrations FROM PUBLIC,anon,authenticated;
REVOKE ALL ON TABLE public.shipping_pricing_rules FROM PUBLIC,anon,authenticated;
GRANT ALL ON TABLE public.shipping_price_calibrations TO service_role;
GRANT ALL ON TABLE public.shipping_pricing_rules TO service_role;

CREATE OR REPLACE FUNCTION public.create_server_validated_order(
 p_user_id UUID,p_items JSONB,p_payment_method TEXT,p_shipping JSONB
) RETURNS TABLE(order_id UUID,order_number TEXT,payment_status TEXT,total NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_order UUID; v_subtotal NUMERIC(12,2):=0; v_shipping NUMERIC(12,2); v_expected NUMERIC(12,2);
 v_item JSONB; v_product public.products%ROWTYPE; v_variant public.product_variants%ROWTYPE;
 v_quantity INTEGER; v_unit NUMERIC(12,2); v_factor NUMERIC(10,4):=1;
 v_calibration public.shipping_price_calibrations%ROWTYPE; v_commercial NUMERIC(12,2); v_adjustment NUMERIC(12,2):=0;
 v_rounding NUMERIC(12,2);
BEGIN
 IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'Server role required'; END IF;
 IF p_user_id IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id) THEN RAISE EXCEPTION 'Invalid user'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.payment_methods WHERE code=p_payment_method AND is_active) THEN RAISE EXCEPTION 'Unsupported payment method'; END IF;
 IF jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items)=0 OR jsonb_array_length(p_items)>50 THEN RAISE EXCEPTION 'Invalid cart'; END IF;
 IF p_shipping->>'shippingType'<>'lima_delivery' OR p_shipping->>'quoteStatus'<>'calculated' THEN RAISE EXCEPTION 'Shipping quote required'; END IF;
 IF NULLIF(p_shipping->>'distanceKm','') IS NULL OR (p_shipping->>'distanceKm')::NUMERIC<0
    OR (NULLIF(p_shipping->>'centerDistanceKm','') IS NOT NULL AND (p_shipping->>'centerDistanceKm')::NUMERIC<0) THEN
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
 SELECT * INTO v_calibration FROM public.shipping_price_calibrations
  WHERE active AND normalized_name=p_shipping->>'calibrationName';
 IF NOT FOUND THEN RAISE EXCEPTION 'Destination is not covered'; END IF;
 IF p_shipping->>'pricingMode'='MANUAL_QUOTE' THEN RAISE EXCEPTION 'Shipping quote required'; END IF;
 v_commercial:=NULLIF(p_shipping->>'commercialRoutePrice','')::NUMERIC;
 IF v_calibration.reference_price IS NOT NULL THEN
   v_commercial:=v_calibration.reference_price;
 END IF;
 IF v_commercial IS NULL OR v_commercial<0 THEN RAISE EXCEPTION 'Invalid commercial route price'; END IF;
 -- El factor se recalcula desde productos y se aplica exactamente una vez.
 v_adjustment:=COALESCE(NULLIF(p_shipping->>'adjustment','')::NUMERIC,0);
 SELECT rounding_increment INTO v_rounding FROM public.shipping_pricing_rules
  WHERE active ORDER BY updated_at DESC LIMIT 1;
 IF v_rounding IS NULL OR v_rounding<=0 THEN RAISE EXCEPTION 'Invalid shipping rounding rule'; END IF;
 v_expected:=round(((v_commercial+v_adjustment)*v_factor)/v_rounding)*v_rounding;
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
  NULLIF(p_shipping->>'centerDistanceKm','')::NUMERIC,NULLIF(p_shipping->>'centerDeltaKm','')::NUMERIC,v_commercial,v_adjustment,v_factor,
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
