BEGIN;
UPDATE public.store_settings SET name='Polaris' WHERE name IN ('Mueblería Polaris','Muebleria Polaris');
ALTER TABLE public.store_settings ADD COLUMN membership_yape_phone text NOT NULL DEFAULT '916832791';
ALTER TABLE public.store_settings ADD COLUMN membership_qr_url text NOT NULL DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN membership_payee text NOT NULL DEFAULT '';
CREATE TABLE public.seller_profiles(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 display_name text NOT NULL CHECK(char_length(trim(display_name)) BETWEEN 2 AND 100),
 bio text NOT NULL DEFAULT '' CHECK(char_length(bio)<=1500),
 avatar_url text NOT NULL DEFAULT '',phone text NOT NULL CHECK(phone ~ '^[0-9+ ()-]{9,20}$'),
 delivery_vehicle text NOT NULL DEFAULT 'motorcycle' CHECK(delivery_vehicle IN ('motorcycle','truck')),
 delivery_partner text NOT NULL DEFAULT 'polaris' CHECK(delivery_partner IN ('polaris','independent')),
 delivery_notes text NOT NULL DEFAULT '' CHECK(char_length(delivery_notes)<=1000),
 approved_until timestamptz, suspended boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seller_profiles FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.seller_profiles TO authenticated;
GRANT INSERT(user_id,display_name,bio,avatar_url,phone,delivery_vehicle,delivery_partner,delivery_notes) ON public.seller_profiles TO authenticated;
GRANT UPDATE(display_name,bio,avatar_url,phone,delivery_vehicle,delivery_partner,delivery_notes) ON public.seller_profiles TO authenticated;
CREATE POLICY seller_self_read ON public.seller_profiles FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY seller_self_insert ON public.seller_profiles FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()));
CREATE POLICY seller_self_update ON public.seller_profiles FOR UPDATE TO authenticated USING(user_id=(SELECT auth.uid())) WITH CHECK(user_id=(SELECT auth.uid()));
CREATE TRIGGER seller_updated BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE FUNCTION public.seller_is_active(p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.seller_profiles WHERE user_id=p_user AND approved_until>now() AND NOT suspended)
$$;
REVOKE ALL ON FUNCTION public.seller_is_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seller_is_active(uuid) TO anon,authenticated,service_role;
CREATE TABLE public.seller_membership_payments(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.seller_profiles(user_id),
 amount numeric(12,2) NOT NULL DEFAULT 50 CHECK(amount=50),reference text NOT NULL CHECK(char_length(trim(reference)) BETWEEN 4 AND 100),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 review_note text NOT NULL DEFAULT '',reviewed_by uuid REFERENCES auth.users(id),reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX membership_reference_unique ON public.seller_membership_payments(lower(trim(reference))) WHERE status IN ('pending','approved');
CREATE UNIQUE INDEX membership_one_pending ON public.seller_membership_payments(user_id) WHERE status='pending';
ALTER TABLE public.seller_membership_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seller_membership_payments FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.seller_membership_payments TO authenticated;
GRANT INSERT(user_id,reference) ON public.seller_membership_payments TO authenticated;
CREATE POLICY membership_read ON public.seller_membership_payments FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY membership_submit ON public.seller_membership_payments FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()));
CREATE FUNCTION public.review_seller_membership(p_id uuid,p_approve boolean,p_note text DEFAULT '') RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE payment public.seller_membership_payments%ROWTYPE;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required'; END IF;
 SELECT * INTO payment FROM public.seller_membership_payments WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
 IF payment.status<>'pending' THEN RAISE EXCEPTION 'Payment already reviewed'; END IF;
 UPDATE public.seller_membership_payments SET status=CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
 review_note=left(p_note,1000),reviewed_by=auth.uid(),reviewed_at=now() WHERE id=p_id;
 IF p_approve THEN UPDATE public.seller_profiles SET approved_until=greatest(coalesce(approved_until,now()),now())+interval '1 month' WHERE user_id=payment.user_id; END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_seller_membership(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_seller_membership(uuid,boolean,text) TO authenticated;
CREATE FUNCTION public.set_seller_suspension(p_user uuid,p_suspend boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required'; END IF;
 UPDATE public.seller_profiles SET suspended=p_suspend WHERE user_id=p_user;
END $$;
REVOKE ALL ON FUNCTION public.set_seller_suspension(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_seller_suspension(uuid,boolean) TO authenticated;
ALTER TABLE public.products ADD COLUMN seller_id uuid REFERENCES public.seller_profiles(user_id);
ALTER TABLE public.products ADD COLUMN delivery_vehicle text NOT NULL DEFAULT 'truck' CHECK(delivery_vehicle IN ('motorcycle','truck'));
ALTER TABLE public.products ADD COLUMN delivery_partner text NOT NULL DEFAULT 'polaris' CHECK(delivery_partner IN ('polaris','independent'));
ALTER TABLE public.products ADD COLUMN promotion_eligible boolean NOT NULL DEFAULT true;
CREATE INDEX products_seller_idx ON public.products(seller_id);
DROP POLICY IF EXISTS products_public_read ON public.products;
CREATE POLICY products_public_read ON public.products FOR SELECT TO anon,authenticated USING(is_active AND (seller_id IS NULL OR public.seller_is_active(seller_id)));
CREATE POLICY products_seller_read ON public.products FOR SELECT TO authenticated USING(seller_id=(SELECT auth.uid()));
CREATE POLICY products_seller_insert ON public.products FOR INSERT TO authenticated WITH CHECK(seller_id=(SELECT auth.uid()) AND public.seller_is_active(seller_id));
CREATE POLICY products_seller_update ON public.products FOR UPDATE TO authenticated USING(seller_id=(SELECT auth.uid()) AND public.seller_is_active(seller_id)) WITH CHECK(seller_id=(SELECT auth.uid()) AND public.seller_is_active(seller_id));
GRANT INSERT,UPDATE ON public.products TO authenticated;
DO $$ DECLARE cols text; BEGIN
 SELECT string_agg(quote_ident(column_name),',') INTO cols FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name<>'cost_price';
 EXECUTE 'GRANT SELECT ('||cols||') ON public.products TO anon,authenticated';
END $$;
CREATE FUNCTION public.guard_seller_product() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF current_user IN ('postgres','supabase_admin','service_role') OR public.is_admin() THEN RETURN NEW; END IF;
 IF NEW.seller_id IS DISTINCT FROM auth.uid() OR NOT public.seller_is_active(auth.uid()) THEN RAISE EXCEPTION 'Active membership required'; END IF;
 IF TG_OP='UPDATE' AND (OLD.seller_id IS DISTINCT FROM NEW.seller_id OR NEW.is_featured IS DISTINCT FROM OLD.is_featured OR NEW.cost_price IS DISTINCT FROM OLD.cost_price) THEN RAISE EXCEPTION 'Owner fields cannot be changed'; END IF;
 IF TG_OP='INSERT' AND (NEW.is_featured OR coalesce(NEW.cost_price,0)<>0) THEN RAISE EXCEPTION 'Owner fields cannot be assigned'; END IF;
 IF NEW.price<=0 OR NEW.stock<0 OR (NEW.sale_price IS NOT NULL AND (NEW.sale_price<=0 OR NEW.sale_price>NEW.price)) THEN RAISE EXCEPTION 'Invalid price or stock'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_seller_product BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_seller_product();
REVOKE ALL ON FUNCTION public.guard_seller_product() FROM PUBLIC;
-- Product ownership is snapshotted: future product edits cannot expose another seller's orders.
ALTER TABLE public.order_items ADD COLUMN seller_id uuid REFERENCES public.seller_profiles(user_id);
ALTER TABLE public.order_items ADD COLUMN promotion_eligible boolean NOT NULL DEFAULT false;
ALTER TABLE public.order_items ADD COLUMN allocated_discount numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN delivery_vehicle text;
ALTER TABLE public.order_items ADD COLUMN delivery_partner text;
CREATE FUNCTION public.snapshot_seller_item() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 SELECT seller_id,delivery_vehicle,delivery_partner,promotion_eligible INTO NEW.seller_id,NEW.delivery_vehicle,NEW.delivery_partner,NEW.promotion_eligible FROM public.products WHERE id=NEW.product_id;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.snapshot_seller_item() FROM PUBLIC;
CREATE TRIGGER snapshot_seller_item BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.snapshot_seller_item();
CREATE FUNCTION public.seller_orders() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (
 SELECT i.id,i.order_id,i.product_name,i.quantity,i.unit_price,i.delivery_vehicle,i.delivery_partner,
 o.order_number,o.created_at,o.status,o.payment_status,o.shipping_district,
 CASE WHEN o.payment_status IN ('approved','aprobado') THEN o.shipping_address END shipping_address,
 CASE WHEN o.payment_status IN ('approved','aprobado') THEN o.shipping_reference END shipping_reference
 FROM public.order_items i JOIN public.orders o ON o.id=i.order_id WHERE i.seller_id=auth.uid() ORDER BY o.created_at DESC LIMIT 200
 )t),'[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.seller_orders() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.seller_orders() TO authenticated;
-- One real coupon per account and Lima calendar day. Claiming does not approve payment.
CREATE TABLE public.promotion_coupons(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id),
 claim_day date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Lima')::date,
 amount numeric(12,2) NOT NULL CHECK(amount IN (5,10,15)),minimum_subtotal numeric(12,2) NOT NULL DEFAULT 150,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours',used_order_id uuid REFERENCES public.orders(id),
 UNIQUE(user_id,claim_day)
);
ALTER TABLE public.promotion_coupons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.promotion_coupons FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.promotion_coupons TO authenticated;
CREATE POLICY coupons_own_read ON public.promotion_coupons FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE FUNCTION public.claim_daily_coupon() RETURNS public.promotion_coupons LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE coupon public.promotion_coupons%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text||'daily-coupon',0));
 SELECT * INTO coupon FROM public.promotion_coupons WHERE user_id=auth.uid() AND claim_day=(now() AT TIME ZONE 'America/Lima')::date;
 IF FOUND THEN RETURN coupon; END IF;
 INSERT INTO public.promotion_coupons(user_id,amount) VALUES(auth.uid(),(floor(random()*3)::integer+1)*5) RETURNING * INTO coupon;
 RETURN coupon;
END $$;
REVOKE ALL ON FUNCTION public.claim_daily_coupon() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_coupon() TO authenticated;
ALTER TABLE public.orders ADD COLUMN discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK(discount_amount>=0);
ALTER TABLE public.orders ADD COLUMN promotion_subtotal numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN promotion_coupon_id uuid REFERENCES public.promotion_coupons(id);
CREATE OR REPLACE FUNCTION public.create_priced_order_internal(
 p_user_id UUID,p_items JSONB,p_payment_method TEXT,p_shipping JSONB
) RETURNS TABLE(order_id UUID,order_number TEXT,payment_status TEXT,total NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_discount numeric:=0; v_eligible numeric:=0; v_coupon public.promotion_coupons%ROWTYPE;
 v_order UUID; v_subtotal NUMERIC(12,2):=0; v_shipping NUMERIC(12,2); v_expected NUMERIC(12,2);
 v_item JSONB; v_product public.products%ROWTYPE; v_variant public.product_variants%ROWTYPE;
 v_quantity INTEGER; v_unit NUMERIC(12,2); v_factor NUMERIC(10,4):=1;
 v_band public.shipping_distance_bands%ROWTYPE; v_center public.shipping_district_centers%ROWTYPE; v_base NUMERIC(12,2); v_adjustment NUMERIC(12,2):=0;
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
   IF NOT FOUND OR (v_product.seller_id IS NOT NULL AND NOT public.seller_is_active(v_product.seller_id)) THEN RAISE EXCEPTION 'Product is unavailable'; END IF;
   v_unit:=COALESCE(v_product.sale_price,v_product.price);
   IF NULLIF(v_item->>'variantId','') IS NOT NULL THEN
     SELECT * INTO v_variant FROM public.product_variants WHERE id=(v_item->>'variantId')::UUID
       AND product_id=v_product.id AND is_active FOR SHARE;
     IF NOT FOUND THEN RAISE EXCEPTION 'Variant is unavailable'; END IF;
     v_unit:=v_unit+COALESCE(v_variant.price_adjustment,0)+COALESCE(v_variant.additional_price,0);
   END IF;
   v_subtotal:=v_subtotal+v_unit*v_quantity;
   IF v_product.promotion_eligible AND v_unit<=60 THEN v_eligible:=v_eligible+v_unit*v_quantity; END IF;
   v_factor:=GREATEST(v_factor,COALESCE(v_product.shipping_factor,1));
 END LOOP;
 SELECT * INTO v_center FROM public.shipping_district_centers
  WHERE active AND automatic_shipping AND
   (upper(district)=upper(p_shipping->>'district') OR upper(p_shipping->>'district')=ANY(SELECT upper(x) FROM unnest(aliases)x));
 IF NOT FOUND THEN RAISE EXCEPTION 'Destination is not covered'; END IF;
 v_base:=v_center.base_shipping_price;
 IF v_base IS NULL THEN
  SELECT * INTO v_band FROM public.shipping_distance_bands WHERE is_active AND (p_shipping->>'distanceKm')::numeric>=min_distance_km AND (max_distance_km IS NULL OR (p_shipping->>'distanceKm')::numeric<max_distance_km) ORDER BY priority DESC,min_distance_km DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'No distance tariff'; END IF;
  v_base:=greatest(v_band.minimum_cost,v_band.base_cost+greatest(0,(p_shipping->>'distanceKm')::numeric-v_band.min_distance_km)*v_band.cost_per_extra_km);
 END IF;
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
 v_discount:=floor(v_eligible/150)*10;
 IF NULLIF(p_shipping->>'couponId','') IS NOT NULL THEN
  SELECT * INTO v_coupon FROM public.promotion_coupons WHERE id=(p_shipping->>'couponId')::uuid AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR v_coupon.used_order_id IS NOT NULL OR v_coupon.expires_at<=now() OR v_eligible<v_coupon.minimum_subtotal THEN RAISE EXCEPTION 'Coupon unavailable or minimum not reached'; END IF;
  IF v_coupon.amount>v_discount THEN v_discount:=v_coupon.amount; ELSE v_coupon:=NULL; END IF;
 END IF;
 v_discount:=least(v_discount,v_eligible);
 INSERT INTO public.orders(discount_amount,promotion_subtotal,promotion_coupon_id,user_id,status,subtotal,shipping_cost,total,payment_method,payment_status,payment_provider,
  shipping_latitude,shipping_longitude,shipping_address,shipping_reference,shipping_distance_km,
  shipping_department,shipping_province,shipping_district,shipping_duration_minutes,shipping_type,
  shipping_quote_status,shipping_route_provider,shipping_center_distance_km,shipping_center_delta_km,
  shipping_base_price,shipping_adjustment,shipping_product_factor,shipping_pricing_version,notes)
 VALUES(v_discount,v_eligible,v_coupon.id,p_user_id,'confirmado',v_subtotal,v_shipping,v_subtotal+v_shipping-v_discount,p_payment_method,'pending',
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
 IF v_discount>0 THEN
  UPDATE public.order_items i SET allocated_discount=round(v_discount*(i.quantity*i.unit_price)/v_eligible,2) WHERE i.order_id=v_order AND i.promotion_eligible AND i.unit_price<=60;
  UPDATE public.order_items i SET allocated_discount=i.allocated_discount+(v_discount-(SELECT sum(x.allocated_discount) FROM public.order_items x WHERE x.order_id=v_order)) WHERE i.id=(SELECT x.id FROM public.order_items x WHERE x.order_id=v_order AND x.promotion_eligible AND x.unit_price<=60 ORDER BY x.id LIMIT 1);
 END IF;
 IF v_coupon.id IS NOT NULL THEN UPDATE public.promotion_coupons SET used_order_id=v_order WHERE id=v_coupon.id; END IF;
 RETURN QUERY SELECT o.id,o.order_number,o.payment_status,o.total FROM public.orders o WHERE o.id=v_order;
END $$;
CREATE OR REPLACE FUNCTION public.create_server_validated_order(
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
  'couponId',p_shipping->'couponId','latitude',p_shipping->'latitude','longitude',p_shipping->'longitude','reference',p_shipping->'reference');
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
CREATE OR REPLACE FUNCTION public.guard_return_transition() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE paid public.orders%ROWTYPE; refunded numeric; line public.order_items%ROWTYPE; refunded_line numeric;
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
  IF NEW.refund_amount<=0 OR refunded+NEW.refund_amount>paid.subtotal-paid.discount_amount THEN RAISE EXCEPTION 'Refund exceeds paid merchandise'; END IF;
  SELECT * INTO line FROM public.order_items WHERE id=NEW.order_item_id;
  SELECT coalesce(sum(refund_amount),0) INTO refunded_line FROM public.return_requests WHERE order_item_id=NEW.order_item_id AND status='refunded' AND id<>NEW.id;
  IF refunded_line+NEW.refund_amount>line.quantity*line.unit_price-line.allocated_discount THEN RAISE EXCEPTION 'Refund exceeds paid line amount'; END IF;
  NEW.refunded_at:=now();
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_return_transition() FROM PUBLIC;

-- Seller images are confined to a per-user folder; existing owner policies remain intact.
DO $$ BEGIN
 IF to_regclass('storage.objects') IS NOT NULL THEN
 EXECUTE 'CREATE POLICY polaris_seller_image_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id=''product-images'' AND split_part(name,''/'',1)=auth.uid()::text AND public.seller_is_active(auth.uid()))';
 EXECUTE 'CREATE POLICY polaris_seller_image_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id=''product-images'' AND split_part(name,''/'',1)=auth.uid()::text)';
 END IF;
END $$;
-- Shipping bands contain only public tariffs; no addresses or credentials.
GRANT SELECT ON public.shipping_distance_bands TO anon,authenticated;
CREATE POLICY shipping_bands_public_read ON public.shipping_distance_bands FOR SELECT TO anon,authenticated USING(is_active);
UPDATE public.shipping_district_centers SET automatic_shipping=true WHERE district='San Martín de Porres';

CREATE FUNCTION public.seller_sales_report(p_start timestamptz,p_end timestamptz) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_start IS NULL OR p_end IS NULL OR p_end<=p_start OR p_end>p_start+interval '367 days' THEN RAISE EXCEPTION 'Invalid reporting range'; END IF;
 WITH lines AS (
 SELECT i.*,o.paid_at FROM public.order_items i JOIN public.orders o ON o.id=i.order_id WHERE i.seller_id=auth.uid() AND o.payment_status IN ('approved','aprobado') AND o.paid_at>=p_start AND o.paid_at<p_end
 ), refunds AS (
 SELECT coalesce(sum(r.refund_amount),0) amount FROM public.return_requests r JOIN public.order_items i ON i.id=r.order_item_id WHERE i.seller_id=auth.uid() AND r.status='refunded' AND r.refunded_at>=p_start AND r.refunded_at<p_end
 ) SELECT jsonb_build_object('gross',coalesce(sum(quantity*unit_price),0),'discount',coalesce(sum(allocated_discount),0),'refunds',(SELECT amount FROM refunds),'net',coalesce(sum(quantity*unit_price-allocated_discount),0)-(SELECT amount FROM refunds),'orders',count(DISTINCT order_id),'units',coalesce(sum(quantity),0)) INTO result FROM lines;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.seller_sales_report(timestamptz,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.seller_sales_report(timestamptz,timestamptz) TO authenticated;
CREATE FUNCTION public.admin_membership_report() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required'; END IF;
 RETURN jsonb_build_object('active',(SELECT count(*) FROM public.seller_profiles WHERE approved_until>now() AND NOT suspended),'pending',(SELECT count(*) FROM public.seller_membership_payments WHERE status='pending'),'collected',(SELECT coalesce(sum(amount),0) FROM public.seller_membership_payments WHERE status='approved'));
END $$;
REVOKE ALL ON FUNCTION public.admin_membership_report() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_membership_report() TO authenticated;
CREATE FUNCTION public.seller_public_profile(p_user uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('id',user_id,'name',display_name,'bio',bio,'avatar_url',avatar_url,'delivery_vehicle',delivery_vehicle,'delivery_partner',delivery_partner) FROM public.seller_profiles WHERE user_id=p_user AND approved_until>now() AND NOT suspended
$$;
REVOKE ALL ON FUNCTION public.seller_public_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seller_public_profile(uuid) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.request_return(
 p_order_item_id UUID,p_quantity INTEGER,p_request_type TEXT,p_reason TEXT,p_description TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_item public.order_items%ROWTYPE; v_order public.orders%ROWTYPE; v_used INTEGER; v_id UUID;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_request_type NOT IN ('return_and_refund','refund_only') OR p_quantity IS NULL OR p_quantity<1
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
   NULLIF(trim(COALESCE(p_description,'')),''),round((v_item.unit_price*v_item.quantity-v_item.allocated_discount)*(v_used+p_quantity)/v_item.quantity,2)-round((v_item.unit_price*v_item.quantity-v_item.allocated_discount)*v_used/v_item.quantity,2)) RETURNING id INTO v_id;
 RETURN v_id;
END $$;

COMMIT;
