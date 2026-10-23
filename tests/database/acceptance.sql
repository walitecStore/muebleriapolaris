-- Synthetic fixtures in the disposable test container only.
INSERT INTO auth.users(id,email) VALUES
 ('11111111-1111-4111-8111-111111111111','admin@example.test'),
 ('22222222-2222-4222-8222-222222222222','buyer@example.test'),
 ('33333333-3333-4333-8333-333333333333','other@example.test');
UPDATE public.profiles SET role='admin' WHERE id='11111111-1111-4111-8111-111111111111';
UPDATE public.payment_methods SET metadata='{"qr_url":"https://example.test/qr.png","account_holder":"TEST ONLY","phone":"51999999999"}',is_active=true WHERE code='yape';
INSERT INTO public.products(id,name,slug,price,stock,is_active,cost_price) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Test sofa','test-sofa',100,3,true,40),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Last item','last-item',100,1,true,40);
INSERT INTO public.product_variants(id,product_id,name,stock) VALUES
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Test variant',3);
UPDATE public.shipping_district_centers SET base_shipping_price=70,center_route_distance_km=10 WHERE district='Comas';

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
SELECT set_config('request.jwt.claim.role','authenticated',false);
DO $$ BEGIN
 BEGIN UPDATE public.profiles SET role='admin' WHERE id=auth.uid(); RAISE EXCEPTION 'TEST FAILED: own role editable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN DELETE FROM public.profiles WHERE id=auth.uid(); RAISE EXCEPTION 'TEST FAILED: own profile deletable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN INSERT INTO public.profiles(id,email,role) VALUES(auth.uid(),'attacker@example.test','admin'); RAISE EXCEPTION 'TEST FAILED: client can insert admin profile'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN INSERT INTO public.orders(user_id,total) VALUES(auth.uid(),0); RAISE EXCEPTION 'TEST FAILED: customer bypasses checkout'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.profiles SET full_name='Updated customer' WHERE id=auth.uid();
 ASSERT (SELECT full_name FROM public.profiles WHERE id=auth.uid())='Updated customer';
 ASSERT (SELECT count(*) FROM public.profiles)=1,'Other profiles leaked';
 BEGIN PERFORM public.admin_sales_report(now()-interval '1 day',now()); RAISE EXCEPTION 'TEST FAILED: customer sees report'; EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE; END IF; END;
 BEGIN PERFORM cost_price FROM public.products; RAISE EXCEPTION 'TEST FAILED: cost visible'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN INSERT INTO storage.objects(bucket_id,name) VALUES('product-images','unauthorized.png'); RAISE EXCEPTION 'TEST FAILED: customer uploads image'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.store_settings SET name='HACKED' WHERE id=1;
 ASSERT (SELECT name FROM public.store_settings WHERE id=1)<>'HACKED';
END $$;
RESET ROLE;
SET ROLE service_role;
SELECT set_config('request.jwt.claim.role','service_role',false);
CREATE TEMP TABLE first_order AS SELECT * FROM public.create_server_validated_order(
 '22222222-2222-4222-8222-222222222222',
 '[{"productId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","variantId":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","quantity":2}]',
 'yape','{"latitude":-12,"longitude":-77,"district":"Comas","shippingType":"lima_delivery","quoteStatus":"calculated","distanceKm":10,"centerDistanceKm":10,"centerDeltaKm":0,"basePrice":70,"shippingAmount":70}',
 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');
DO $$ DECLARE repeated record; BEGIN
 ASSERT (SELECT stock FROM public.products WHERE slug='test-sofa')=1,'Product inventory not reserved';
 ASSERT (SELECT stock FROM public.product_variants LIMIT 1)=1,'Variant inventory not reserved';
 SELECT * INTO repeated FROM public.create_server_validated_order(
 '22222222-2222-4222-8222-222222222222','[{"productId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","variantId":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","quantity":2}]',
 'yape','{"latitude":-12,"longitude":-77,"district":"Comas","shippingType":"lima_delivery","quoteStatus":"calculated","distanceKm":10,"centerDistanceKm":10,"centerDeltaKm":0,"basePrice":70,"shippingAmount":70}','dddddddd-dddd-4ddd-8ddd-dddddddddddd');
 ASSERT repeated.order_id=(SELECT order_id FROM first_order),'Retry created a duplicate';
 ASSERT (SELECT stock FROM public.products WHERE slug='test-sofa')=1,'Retry deducted stock twice';
 ASSERT repeated.total=270,'Authoritative pricing incorrect';
 BEGIN PERFORM * FROM public.create_server_validated_order('22222222-2222-4222-8222-222222222222','[{"productId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","quantity":2}]','yape','{"latitude":-12,"longitude":-77}','dddddddd-dddd-4ddd-8ddd-dddddddddddd'); RAISE EXCEPTION 'TEST FAILED: changed cart reused key'; EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE; END IF; END;
 BEGIN PERFORM * FROM public.create_server_validated_order('22222222-2222-4222-8222-222222222222','[{"productId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","quantity":2}]','yape','{}','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'); RAISE EXCEPTION 'TEST FAILED: stock oversold'; EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE; END IF; END;
 BEGIN PERFORM * FROM public.create_server_validated_order('22222222-2222-4222-8222-222222222222','[{"productId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","quantity":null}]','yape','{}','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'); RAISE EXCEPTION 'TEST FAILED: null quantity accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE; END IF; END;
 BEGIN PERFORM * FROM public.create_priced_order_internal('22222222-2222-4222-8222-222222222222','[]','yape','{}'); RAISE EXCEPTION 'TEST FAILED: private engine callable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

-- Unpaid customers may not request refunds.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
SELECT set_config('request.jwt.claim.role','authenticated',false);
DO $$ BEGIN
 UPDATE public.orders SET payment_status='approved' WHERE user_id=auth.uid();
 ASSERT (SELECT payment_status FROM public.orders LIMIT 1)='pending','Customer self-approved payment';
 BEGIN PERFORM public.review_manual_payment((SELECT id FROM public.orders LIMIT 1),'approved','FAKE',NULL); RAISE EXCEPTION 'TEST FAILED: customer reviews payments'; EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE; END IF; END;
 BEGIN PERFORM public.request_return((SELECT id FROM public.order_items LIMIT 1),1,'refund_only','Test reason',NULL); RAISE EXCEPTION 'TEST FAILED: unpaid refund accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE; END IF; END;
END $$;
RESET ROLE;

-- Real manual review is admin-only, keeps the original payment time on retries.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT public.review_manual_payment((SELECT id FROM public.orders LIMIT 1),'approved','TEST-REAL-REFERENCE','Test only');
DO $$ DECLARE before_time timestamptz; report jsonb; BEGIN
 SELECT paid_at INTO before_time FROM public.orders LIMIT 1;
 PERFORM public.review_manual_payment((SELECT id FROM public.orders LIMIT 1),'approved','TEST-RETRY',NULL);
 ASSERT (SELECT paid_at FROM public.orders LIMIT 1)=before_time,'Payment retry changed reporting date';
 report:=public.admin_sales_report(date_trunc('day',now() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima',(date_trunc('day',now() AT TIME ZONE 'America/Lima')+interval '1 day') AT TIME ZONE 'America/Lima');
 ASSERT (report->>'gross')::numeric=270 AND (report->>'paidOrders')::integer=1,'Report counts wrong payments';
 ASSERT jsonb_array_length(report->'series')=24,'Day report lacks hourly buckets';
 report:=public.admin_sales_report(date_trunc('year',now() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima',(date_trunc('year',now() AT TIME ZONE 'America/Lima')+interval '1 year') AT TIME ZONE 'America/Lima');
 ASSERT jsonb_array_length(report->'series')=12,'Year report lacks monthly buckets';
 INSERT INTO storage.objects(bucket_id,name) VALUES('product-images','admin-test.png');
 UPDATE public.store_settings SET name='Configured store' WHERE id=1;
 ASSERT (SELECT name FROM public.store_settings WHERE id=1)='Configured store';
END $$;
RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
SELECT public.request_return((SELECT id FROM public.order_items LIMIT 1),1,'refund_only','Test return',NULL);
RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $$ DECLARE request_id uuid; report jsonb; BEGIN
 SELECT id INTO request_id FROM public.return_requests LIMIT 1;
 BEGIN PERFORM public.review_return_request(request_id,'refunded',NULL,'TEST-REFUND'); RAISE EXCEPTION 'TEST FAILED: refund skipped approval'; EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE; END IF; END;
 PERFORM public.review_return_request(request_id,'approved',NULL,NULL);
 PERFORM public.review_return_request(request_id,'refunded',NULL,'TEST-REFUND');
 ASSERT (SELECT refunded_at FROM public.return_requests WHERE id=request_id) IS NOT NULL;
 BEGIN PERFORM public.review_return_request(request_id,'approved',NULL,NULL); RAISE EXCEPTION 'TEST FAILED: refunded request reopened'; EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE; END IF; END;
 report:=public.admin_sales_report(now()-interval '1 hour',now()+interval '1 hour');
 ASSERT (report->>'refunds')::numeric=100 AND (report->>'net')::numeric=170,'Refund not deducted from cash reporting';
END $$;
RESET ROLE;

-- Cancellation restores each reserved unit exactly once.
UPDATE public.orders SET status='cancelado';
UPDATE public.orders SET status='cancelado';
DO $$ BEGIN
 ASSERT (SELECT stock FROM public.products WHERE slug='test-sofa')=3,'Cancelled inventory not restored once';
 ASSERT (SELECT stock FROM public.product_variants LIMIT 1)=3,'Variant cancellation incorrect';
END $$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
UPDATE public.store_settings SET origin_lat=-12.1 WHERE id=1;
DO $$ BEGIN
 ASSERT (SELECT center_route_distance_km IS NULL FROM public.shipping_district_centers WHERE district='Comas'),'Origin change did not invalidate distances';
 ASSERT (SELECT base_shipping_price FROM public.shipping_district_centers WHERE district='Comas')=70,'Origin change overwrote commercial tariffs';
END $$;
RESET ROLE;
SELECT 'SQL acceptance checks passed' AS result;
