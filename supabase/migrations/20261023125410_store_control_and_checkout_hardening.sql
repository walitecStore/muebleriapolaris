BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material text NOT NULL DEFAULT '';


REVOKE SELECT ON public.products FROM PUBLIC,anon,authenticated;
DO $$ DECLARE cols text; BEGIN
 SELECT string_agg(quote_ident(column_name),',') INTO cols FROM information_schema.columns
 WHERE table_schema='public' AND table_name='products' AND column_name<>'cost_price';
 EXECUTE 'GRANT SELECT ('||cols||') ON public.products TO anon,authenticated';
END $$;

-- Own profiles are editable, never insertable/deletable or able to assign roles.
DROP POLICY IF EXISTS profiles_own_access ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_access ON public.profiles;
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated
 USING (id=(SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY profiles_edit_own ON public.profiles FOR UPDATE TO authenticated
 USING (id=(SELECT auth.uid())) WITH CHECK (id=(SELECT auth.uid()));
REVOKE INSERT,DELETE,UPDATE ON public.profiles FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE(full_name,avatar_url,phone) ON public.profiles TO authenticated;
CREATE OR REPLACE FUNCTION public.protect_profile_role() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.role IS DISTINCT FROM OLD.role AND current_user NOT IN ('postgres','supabase_admin') THEN
  RAISE EXCEPTION 'Profile roles must be assigned by an authorized database administrator';
 END IF;
 RETURN NEW;
END $$;

-- Public business information only. Never put API keys or customer data here.
CREATE TABLE public.store_settings (
 id integer PRIMARY KEY DEFAULT 1 CHECK(id=1),
 name text NOT NULL DEFAULT 'Mueblería Polaris' CHECK(char_length(name) BETWEEN 1 AND 100),
 description text NOT NULL DEFAULT '', logo_url text NOT NULL DEFAULT '',
 phone text NOT NULL DEFAULT '', whatsapp text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '',
 address text NOT NULL DEFAULT '', city text NOT NULL DEFAULT '', tax_id text NOT NULL DEFAULT '',
 hours text NOT NULL DEFAULT '', site_url text NOT NULL DEFAULT '',
 instagram_url text NOT NULL DEFAULT '', facebook_url text NOT NULL DEFAULT '',
 privacy_text text NOT NULL DEFAULT '', terms_text text NOT NULL DEFAULT '',
 shipping_text text NOT NULL DEFAULT '', returns_text text NOT NULL DEFAULT '',
 complaints_url text NOT NULL DEFAULT '',
 origin_lat numeric(10,7) NOT NULL DEFAULT -11.993057 CHECK(origin_lat BETWEEN -18.5 AND -3),
 origin_lng numeric(10,7) NOT NULL DEFAULT -77.071283 CHECK(origin_lng BETWEEN -82 AND -68),
 origin_address text NOT NULL DEFAULT 'Av. 12 de Octubre 1805, San Martín de Porres, Lima',
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.store_settings(id) VALUES(1);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_settings FROM anon,authenticated;
GRANT SELECT ON public.store_settings TO anon,authenticated;
GRANT UPDATE ON public.store_settings TO authenticated;
CREATE POLICY store_public_read ON public.store_settings FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY store_admin_update ON public.store_settings FOR UPDATE TO authenticated
 USING((SELECT public.is_admin())) WITH CHECK((SELECT public.is_admin()));
CREATE TRIGGER store_updated_at BEFORE UPDATE ON public.store_settings
 FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders ADD COLUMN inventory_reserved boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN reservation_expires_at timestamptz;
CREATE INDEX orders_unpaid_reservations ON public.orders(reservation_expires_at)
 WHERE inventory_reserved AND payment_status IN ('pending','rejected','failed');
CREATE INDEX orders_paid_reporting ON public.orders(paid_at) WHERE payment_status IN ('approved','aprobado');
CREATE TABLE public.checkout_requests (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 request_key uuid NOT NULL, request_body jsonb NOT NULL,
 order_id uuid NOT NULL REFERENCES public.orders(id),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,request_key)
);
ALTER TABLE public.checkout_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_requests FROM PUBLIC,anon,authenticated,service_role;

-- Keep the audited pricing engine private; the public server entry additionally
-- serializes retries and locks inventory in deterministic product/variant order.
ALTER FUNCTION public.create_server_validated_order(uuid,jsonb,text,jsonb) RENAME TO create_priced_order_internal;
REVOKE ALL ON FUNCTION public.create_priced_order_internal(uuid,jsonb,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.create_priced_order_internal(
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
 v_expected:=GREATEST(v_center.minimum_shipping_price,round(v_expected/5)*5);
 IF v_center.maximum_shipping_price IS NOT NULL THEN v_expected:=LEAST(v_expected,v_center.maximum_shipping_price); END IF;
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

CREATE FUNCTION public.create_server_validated_order(
 p_user_id uuid,p_items jsonb,p_payment_method text,p_shipping jsonb,p_checkout_key uuid
) RETURNS TABLE(order_id uuid,order_number text,payment_status text,total numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE existing public.checkout_requests%ROWTYPE; body jsonb; new_order uuid; row record;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' OR p_user_id IS NULL OR p_checkout_key IS NULL THEN
  RAISE EXCEPTION 'Authenticated checkout server required';
 END IF;
 IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 THEN
  RAISE EXCEPTION 'Invalid cart';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) item
  WHERE jsonb_typeof(item) IS DISTINCT FROM 'object' OR COALESCE(item->>'quantity','') !~ '^[1-9][0-9]?$'
  OR COALESCE(item->>'productId','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
  RAISE EXCEPTION 'Invalid cart item';
 END IF;
 body:=jsonb_build_object('items',p_items,'method',p_payment_method,
  'latitude',p_shipping->'latitude','longitude',p_shipping->'longitude','reference',p_shipping->'reference');
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text||p_checkout_key::text,0));
 SELECT * INTO existing FROM public.checkout_requests WHERE user_id=p_user_id AND request_key=p_checkout_key;
 IF FOUND THEN
  IF existing.request_body<>body THEN RAISE EXCEPTION 'Checkout key already used for a different cart'; END IF;
  RETURN QUERY SELECT o.id,o.order_number,o.payment_status,o.total FROM public.orders o WHERE o.id=existing.order_id;
  RETURN;
 END IF;
 PERFORM id FROM public.products WHERE id IN
  (SELECT (item->>'productId')::uuid FROM jsonb_array_elements(p_items)item) ORDER BY id FOR UPDATE;
 PERFORM id FROM public.product_variants WHERE id IN
  (SELECT NULLIF(item->>'variantId','')::uuid FROM jsonb_array_elements(p_items)item) ORDER BY id FOR UPDATE;
 FOR row IN SELECT (item->>'productId')::uuid AS id,sum((item->>'quantity')::integer) AS qty
  FROM jsonb_array_elements(p_items)item GROUP BY 1 LOOP
  IF NOT EXISTS(SELECT 1 FROM public.products WHERE id=row.id AND is_active AND stock>=row.qty) THEN
   RAISE EXCEPTION 'Stock insuficiente o producto no disponible';
  END IF;
 END LOOP;
 FOR row IN SELECT NULLIF(item->>'variantId','')::uuid AS id,sum((item->>'quantity')::integer) AS qty
  FROM jsonb_array_elements(p_items)item WHERE NULLIF(item->>'variantId','') IS NOT NULL GROUP BY 1 LOOP
  IF NOT EXISTS(SELECT 1 FROM public.product_variants WHERE id=row.id AND is_active AND stock>=row.qty) THEN
   RAISE EXCEPTION 'Stock insuficiente para la variante';
  END IF;
 END LOOP;
 SELECT priced.order_id INTO new_order FROM public.create_priced_order_internal(p_user_id,p_items,p_payment_method,p_shipping) priced;
 UPDATE public.products p SET stock=p.stock-q.qty FROM
  (SELECT (item->>'productId')::uuid AS id,sum((item->>'quantity')::integer)::integer AS qty FROM jsonb_array_elements(p_items)item GROUP BY 1) q
  WHERE p.id=q.id;
 UPDATE public.product_variants v SET stock=v.stock-q.qty FROM
  (SELECT NULLIF(item->>'variantId','')::uuid AS id,sum((item->>'quantity')::integer)::integer AS qty FROM jsonb_array_elements(p_items)item
   WHERE NULLIF(item->>'variantId','') IS NOT NULL GROUP BY 1) q WHERE v.id=q.id;
 UPDATE public.orders SET inventory_reserved=true,reservation_expires_at=now()+interval '24 hours' WHERE id=new_order;
 INSERT INTO public.checkout_requests(user_id,request_key,request_body,order_id) VALUES(p_user_id,p_checkout_key,body,new_order);
 RETURN QUERY SELECT o.id,o.order_number,o.payment_status,o.total FROM public.orders o WHERE o.id=new_order;
END $$;
REVOKE ALL ON FUNCTION public.create_server_validated_order(uuid,jsonb,text,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_server_validated_order(uuid,jsonb,text,jsonb,uuid) TO service_role;

CREATE FUNCTION public.release_cancelled_inventory() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF OLD.status='cancelado' AND (NEW.status<>'cancelado' OR NEW.payment_status IN ('approved','aprobado') AND OLD.payment_status NOT IN ('approved','aprobado')) THEN
  RAISE EXCEPTION 'A cancelled order cannot be reopened or paid';
 END IF;
 IF OLD.status='entregado' AND NEW.status='cancelado' THEN RAISE EXCEPTION 'Use the returns workflow for delivered orders'; END IF;
 IF NEW.status='cancelado' AND OLD.inventory_reserved THEN
  PERFORM id FROM public.products WHERE id IN (SELECT product_id FROM public.order_items WHERE order_id=OLD.id) ORDER BY id FOR UPDATE;
  PERFORM id FROM public.product_variants WHERE id IN (SELECT variant_id FROM public.order_items WHERE order_id=OLD.id) ORDER BY id FOR UPDATE;
  UPDATE public.products p SET stock=p.stock+q.qty FROM
   (SELECT product_id,sum(quantity)::integer qty FROM public.order_items WHERE order_id=OLD.id GROUP BY product_id)q WHERE p.id=q.product_id;
  UPDATE public.product_variants v SET stock=v.stock+q.qty FROM
   (SELECT variant_id,sum(quantity)::integer qty FROM public.order_items WHERE order_id=OLD.id GROUP BY variant_id)q WHERE v.id=q.variant_id;
  NEW.inventory_reserved:=false;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.release_cancelled_inventory() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER release_order_inventory BEFORE UPDATE OF status,payment_status ON public.orders
 FOR EACH ROW EXECUTE FUNCTION public.release_cancelled_inventory();
CREATE FUNCTION public.expire_unpaid_reservations() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE affected integer;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required'; END IF;
 UPDATE public.orders SET status='cancelado',payment_status='cancelled'
  WHERE inventory_reserved AND status='confirmado' AND payment_status IN ('pending','rejected','failed') AND reservation_expires_at<now();
 GET DIAGNOSTICS affected=ROW_COUNT; RETURN affected;
END $$;
REVOKE ALL ON FUNCTION public.expire_unpaid_reservations() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.expire_unpaid_reservations() TO authenticated;

ALTER TABLE public.return_requests ADD COLUMN refunded_at timestamptz;
UPDATE public.return_requests SET refunded_at=updated_at WHERE status='refunded';
CREATE INDEX return_requests_refunded_reporting ON public.return_requests(refunded_at) WHERE status='refunded';
CREATE FUNCTION public.guard_return_transition() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE paid public.orders%ROWTYPE; refunded numeric;
BEGIN
 IF NEW.status=OLD.status THEN RETURN NEW; END IF;
 IF OLD.status IN ('refunded','rejected','cancelled') OR
   (OLD.status='approved' AND NEW.status NOT IN ('refunded','cancelled')) OR
   (OLD.status IN ('requested','under_review') AND NEW.status NOT IN ('under_review','approved','rejected','cancelled')) THEN
  RAISE EXCEPTION 'Invalid return status transition';
 END IF;
 IF NEW.status='refunded' THEN
  SELECT * INTO paid FROM public.orders WHERE id=NEW.order_id FOR UPDATE;
  IF paid.payment_status NOT IN ('approved','aprobado') OR NULLIF(trim(NEW.provider_refund_id),'') IS NULL THEN
   RAISE EXCEPTION 'An approved payment and actual refund reference are required';
  END IF;
  SELECT COALESCE(sum(refund_amount),0) INTO refunded FROM public.return_requests WHERE order_id=NEW.order_id AND status='refunded' AND id<>NEW.id;
  IF NEW.refund_amount<=0 OR refunded+NEW.refund_amount>paid.subtotal THEN RAISE EXCEPTION 'Refund exceeds paid merchandise'; END IF;
  NEW.refunded_at:=now();
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_return_transition() FROM PUBLIC;
CREATE TRIGGER guard_return_transition BEFORE UPDATE ON public.return_requests FOR EACH ROW EXECUTE FUNCTION public.guard_return_transition();


-- Do not advertise payment methods that cannot actually be used.
CREATE FUNCTION public.manual_method_ready(p_code text,p_metadata jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT CASE WHEN p_code='bank_transfer' THEN
  NULLIF(trim(p_metadata->>'bank'),'') IS NOT NULL AND NULLIF(trim(p_metadata->>'account_holder'),'') IS NOT NULL AND NULLIF(trim(p_metadata->>'account_number'),'') IS NOT NULL
 WHEN p_code IN ('yape','plin') THEN COALESCE(p_metadata->>'qr_url','') ~ '^https://' AND NULLIF(trim(p_metadata->>'account_holder'),'') IS NOT NULL AND NULLIF(trim(p_metadata->>'phone'),'') IS NOT NULL
 ELSE false END
$$;
REVOKE ALL ON FUNCTION public.manual_method_ready(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manual_method_ready(text,jsonb) TO authenticated,service_role;
UPDATE public.payment_methods SET is_active=false WHERE NOT public.manual_method_ready(code,metadata);
CREATE FUNCTION public.guard_manual_payment_configuration() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.is_active AND NOT public.manual_method_ready(NEW.code,NEW.metadata) THEN
  RAISE EXCEPTION 'Configure an operational manual payment method before enabling it';
 END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_manual_payment_configuration() FROM PUBLIC;
CREATE TRIGGER guard_manual_payment_configuration BEFORE INSERT OR UPDATE ON public.payment_methods
 FOR EACH ROW EXECUTE FUNCTION public.guard_manual_payment_configuration();
CREATE FUNCTION public.guard_payment_attempt_order() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.orders WHERE id=NEW.order_id AND status<>'cancelado' AND payment_status NOT IN ('approved','aprobado')) THEN
  RAISE EXCEPTION 'This order cannot start a new payment';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_payment_attempt_order() FROM PUBLIC;
CREATE TRIGGER guard_payment_attempt_order BEFORE INSERT ON public.payment_attempts
 FOR EACH ROW EXECUTE FUNCTION public.guard_payment_attempt_order();
CREATE OR REPLACE FUNCTION public.review_manual_payment(p_order_id uuid,p_status text,p_reference text DEFAULT NULL,p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o public.orders%ROWTYPE;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF p_status NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.status='cancelado' OR o.payment_method NOT IN ('yape','plin','bank_transfer') THEN RAISE EXCEPTION 'Order cannot be reviewed'; END IF;
 IF o.payment_status IN ('approved','aprobado') THEN
  IF p_status='approved' THEN RETURN; ELSE RAISE EXCEPTION 'Use a refund to reverse an approved payment'; END IF;
 END IF;
 IF p_status='approved' AND NULLIF(trim(p_reference),'') IS NULL THEN RAISE EXCEPTION 'Actual payment reference required'; END IF;
 UPDATE public.orders SET payment_status=p_status,paid_at=CASE WHEN p_status='approved' THEN COALESCE(paid_at,now()) ELSE NULL END,
  provider_reference=NULLIF(trim(p_reference),''),payment_metadata=payment_metadata||jsonb_build_object('reviewed_by',auth.uid(),'manual_review_note',p_note,'reviewed_at',now()) WHERE id=p_order_id;
 UPDATE public.payment_attempts SET status=p_status,provider_reference=NULLIF(trim(p_reference),''),updated_at=now() WHERE order_id=p_order_id AND status='pending';
END $$;

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
 IF v_order.payment_status NOT IN ('approved','aprobado') THEN RAISE EXCEPTION 'Only paid orders are eligible for refunds'; END IF;
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

CREATE OR REPLACE FUNCTION public.manage_payment_attempt(p_order_id UUID,p_action TEXT,p_method TEXT DEFAULT NULL)
RETURNS TABLE(attempt_id UUID,order_id UUID,order_number TEXT,method TEXT,status TEXT,amount NUMERIC,provider TEXT,provider_reference TEXT,expires_at TIMESTAMPTZ,method_metadata JSONB)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_order public.orders%ROWTYPE; v_method public.payment_methods%ROWTYPE; v_attempt public.payment_attempts%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id=p_order_id AND user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status='cancelado' THEN RAISE EXCEPTION 'Cancelled orders cannot be paid'; END IF;
  IF v_order.payment_status IN ('approved','aprobado','cancelled','cancelado') THEN RAISE EXCEPTION 'Payment cannot be changed'; END IF;
  IF p_action NOT IN ('continue','retry','change','start') THEN RAISE EXCEPTION 'Invalid action'; END IF;
  SELECT * INTO v_attempt FROM public.payment_attempts WHERE payment_attempts.order_id=p_order_id AND payment_attempts.status='pending' LIMIT 1 FOR UPDATE;
  -- start/continue/retry son idempotentes mientras exista un intento pendiente del
  -- mismo método. Solo change hacia otro método invalida y reemplaza el intento.
  IF FOUND AND (p_action IN ('continue','start','retry') OR COALESCE(p_method,v_attempt.method)=v_attempt.method) THEN
    SELECT * INTO v_method FROM public.payment_methods WHERE code=v_attempt.method;
    IF v_attempt.method='bank_transfer' AND NOT (
      COALESCE(v_method.metadata->>'bank','')<>'' AND
      COALESCE(v_method.metadata->>'account_holder','')<>'' AND
      COALESCE(v_method.metadata->>'account_number','')<>''
    ) THEN RAISE EXCEPTION 'Bank transfer is not configured'; END IF;
  ELSE
    SELECT * INTO v_method FROM public.payment_methods WHERE code=COALESCE(p_method,v_order.payment_method) AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'Payment method unavailable'; END IF;
    IF v_method.code='bank_transfer' AND NOT (
      COALESCE(v_method.metadata->>'bank','')<>'' AND
      COALESCE(v_method.metadata->>'account_holder','')<>'' AND
      COALESCE(v_method.metadata->>'account_number','')<>''
    ) THEN RAISE EXCEPTION 'Bank transfer is not configured'; END IF;
    UPDATE public.payment_attempts SET status='cancelled',updated_at=now() WHERE payment_attempts.order_id=p_order_id AND payment_attempts.status='pending';
    INSERT INTO public.payment_attempts(order_id,user_id,method,provider,status,amount)
      VALUES(p_order_id,auth.uid(),v_method.code,v_method.provider,'pending',v_order.total) RETURNING * INTO v_attempt;
    UPDATE public.orders SET payment_method=v_method.code,payment_provider=v_method.provider,payment_status='pending' WHERE id=p_order_id;
  END IF;
  RETURN QUERY SELECT v_attempt.id,v_order.id,v_order.order_number,v_attempt.method,v_attempt.status,v_order.total,
    v_attempt.provider,v_attempt.provider_reference,v_attempt.expires_at,COALESCE(v_method.metadata,'{}'::jsonb);
END $$;

CREATE FUNCTION public.invalidate_origin_distances() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.origin_lat IS DISTINCT FROM OLD.origin_lat OR NEW.origin_lng IS DISTINCT FROM OLD.origin_lng THEN
  UPDATE public.shipping_district_centers SET center_route_distance_km=NULL;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.invalidate_origin_distances() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER invalidate_origin_distances AFTER UPDATE OF origin_lat,origin_lng ON public.store_settings
 FOR EACH ROW EXECUTE FUNCTION public.invalidate_origin_distances();

-- Reports aggregate in Postgres, avoiding the API's row cap and accidental client data exposure.
CREATE FUNCTION public.admin_sales_report(p_start timestamptz,p_end timestamptz) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF p_start IS NULL OR p_end IS NULL OR p_end<=p_start OR p_end>p_start+interval '367 days' THEN RAISE EXCEPTION 'Invalid reporting interval'; END IF;
 WITH paid AS (
  SELECT id,total,paid_at FROM public.orders WHERE payment_status IN ('approved','aprobado') AND paid_at>=p_start AND paid_at<p_end
 ), refunds AS (
  SELECT COALESCE(sum(refund_amount),0) amount FROM public.return_requests WHERE status='refunded' AND refunded_at>=p_start AND refunded_at<p_end
 ), buckets AS (
  SELECT generate_series(p_start AT TIME ZONE 'America/Lima',
   (p_end-interval '1 second') AT TIME ZONE 'America/Lima',
   CASE WHEN p_end-p_start<=interval '1 day' THEN interval '1 hour' WHEN p_end-p_start>interval '32 days' THEN interval '1 month' ELSE interval '1 day' END) point
 ), series AS (
  SELECT b.point,COALESCE(sum(p.total),0) amount,count(p.id) orders FROM buckets b LEFT JOIN paid p
   ON date_trunc(CASE WHEN p_end-p_start<=interval '1 day' THEN 'hour' WHEN p_end-p_start>interval '32 days' THEN 'month' ELSE 'day' END,p.paid_at AT TIME ZONE 'America/Lima')=b.point
  GROUP BY b.point
 ), top_products AS (
  SELECT i.product_id,max(i.product_name) name,sum(i.quantity) quantity,sum(i.quantity*i.unit_price) amount
   FROM public.order_items i JOIN paid p ON p.id=i.order_id GROUP BY i.product_id ORDER BY amount DESC LIMIT 10
 )
 SELECT jsonb_build_object(
  'gross',COALESCE((SELECT sum(total) FROM paid),0),'refunds',(SELECT amount FROM refunds),
  'net',COALESCE((SELECT sum(total) FROM paid),0)-(SELECT amount FROM refunds),
  'paidOrders',(SELECT count(*) FROM paid),'average',COALESCE((SELECT avg(total) FROM paid),0),
  'pendingOrders',(SELECT count(*) FROM public.orders WHERE payment_status='pending' AND status<>'cancelado'),
  'expiredReservations',(SELECT count(*) FROM public.orders WHERE inventory_reserved AND payment_status IN ('pending','rejected','failed') AND reservation_expires_at<now()),
  'activeProducts',(SELECT count(*) FROM public.products WHERE is_active),
  'lowStock',(SELECT count(*) FROM public.products WHERE is_active AND stock<=5),
  'customers',(SELECT count(*) FROM public.profiles WHERE role='user'),
  'series',COALESCE((SELECT jsonb_agg(jsonb_build_object('date',to_char(point,'YYYY-MM-DD HH24:MI'),'amount',amount,'orders',orders) ORDER BY point) FROM series),'[]'::jsonb),
  'topProducts',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM top_products t),'[]'::jsonb)
 ) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.admin_sales_report(timestamptz,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_sales_report(timestamptz,timestamptz) TO authenticated;

DO $$ BEGIN
 IF to_regclass('storage.buckets') IS NOT NULL THEN
  INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
   VALUES('product-images','product-images',true,8388608,ARRAY['image/jpeg','image/png','image/webp','image/avif'])
   ON CONFLICT(id) DO NOTHING;
  EXECUTE 'CREATE POLICY polaris_images_read ON storage.objects FOR SELECT TO anon,authenticated USING (bucket_id=''product-images'')';
  EXECUTE 'CREATE POLICY polaris_images_admin_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id=''product-images'' AND public.is_admin())';
  EXECUTE 'CREATE POLICY polaris_images_admin_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id=''product-images'' AND public.is_admin()) WITH CHECK (bucket_id=''product-images'' AND public.is_admin())';
  EXECUTE 'CREATE POLICY polaris_images_admin_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id=''product-images'' AND public.is_admin())';
 END IF;
END $$;
COMMIT;
