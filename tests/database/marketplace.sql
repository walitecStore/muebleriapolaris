-- Synthetic seller, membership and coupon fixtures; disposable local database only.
INSERT INTO auth.users(id,email) VALUES ('44444444-4444-4444-8444-444444444444','seller@example.test');
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',false);
SELECT set_config('request.jwt.claim.role','authenticated',false);
INSERT INTO public.seller_profiles(user_id,display_name,phone) VALUES(auth.uid(),'Test seller','999999999');
DO $$ BEGIN
 BEGIN UPDATE public.seller_profiles SET approved_until=now()+interval '10 years' WHERE user_id=auth.uid();RAISE EXCEPTION 'TEST FAILED: seller self-activated';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN INSERT INTO public.products(name,slug,price,stock,seller_id) VALUES('Unpaid','unpaid',50,10,auth.uid());RAISE EXCEPTION 'TEST FAILED: unpaid seller published';EXCEPTION WHEN raise_exception OR insufficient_privilege THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE;END IF;END;
 BEGIN INSERT INTO public.seller_membership_payments(user_id,reference,amount) VALUES(auth.uid(),'TEST-UNDERPAY',1);RAISE EXCEPTION 'TEST FAILED: seller changed membership amount';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
INSERT INTO public.seller_membership_payments(user_id,reference) VALUES(auth.uid(),'TEST-YAPE-1234');
DO $$ BEGIN
 BEGIN PERFORM public.review_seller_membership((SELECT id FROM public.seller_membership_payments WHERE reference='TEST-YAPE-1234'),true,'spoof');RAISE EXCEPTION 'TEST FAILED: seller approved own payment';EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE;END IF;END;
END $$;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT public.review_seller_membership((SELECT id FROM public.seller_membership_payments WHERE reference='TEST-YAPE-1234'),true,'Verified TEST ONLY');
DO $$ BEGIN
 ASSERT public.seller_is_active('44444444-4444-4444-8444-444444444444');
 BEGIN PERFORM public.review_seller_membership((SELECT id FROM public.seller_membership_payments WHERE reference='TEST-YAPE-1234'),true,'twice');RAISE EXCEPTION 'TEST FAILED: duplicate approval extended membership';EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE;END IF;END;
END $$;
SELECT set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',false);
INSERT INTO public.products(id,name,slug,price,stock,seller_id,promotion_eligible,delivery_vehicle) VALUES('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','Small test product','small-test-product',50,20,auth.uid(),true,'motorcycle');
DO $$ BEGIN
 BEGIN UPDATE public.products SET is_featured=true WHERE slug='small-test-product';RAISE EXCEPTION 'TEST FAILED: seller promoted own listing';EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE;END IF;END;
 BEGIN PERFORM cost_price FROM public.products WHERE seller_id=auth.uid();RAISE EXCEPTION 'TEST FAILED: seller reads private costs';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 UPDATE public.products SET name='HACKED' WHERE slug='test-sofa';
 ASSERT NOT EXISTS(SELECT 1 FROM public.products WHERE name='HACKED');
 INSERT INTO storage.objects(bucket_id,name) VALUES('product-images',auth.uid()::text||'/test.png');
 BEGIN INSERT INTO storage.objects(bucket_id,name) VALUES('product-images','other-seller/test.png');RAISE EXCEPTION 'TEST FAILED: seller uploads outside own folder';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
SELECT public.claim_daily_coupon();
DO $$ DECLARE first_id uuid; BEGIN
 SELECT id INTO first_id FROM public.promotion_coupons WHERE user_id=auth.uid();
 ASSERT (public.claim_daily_coupon()).id=first_id,'Second spin created a second coupon';
 ASSERT (SELECT count(*) FROM public.seller_membership_payments)=0,'Other seller payment leaked';
 ASSERT public.seller_orders()='[]'::jsonb,'Other seller sales leaked';
END $$;
RESET ROLE;
UPDATE public.promotion_coupons SET amount=15 WHERE user_id='22222222-2222-4222-8222-222222222222';
UPDATE public.shipping_district_centers SET center_route_distance_km=10 WHERE district='Comas';
SET ROLE service_role;
SELECT set_config('request.jwt.claim.role','service_role',false);
SELECT * FROM public.create_server_validated_order('22222222-2222-4222-8222-222222222222','[{"productId":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","quantity":3}]','yape',jsonb_build_object('latitude',-12,'longitude',-77,'district','Comas','shippingType','lima_delivery','quoteStatus','calculated','distanceKm',10,'centerDistanceKm',10,'centerDeltaKm',0,'basePrice',70,'shippingAmount',70,'couponId',(SELECT id FROM public.promotion_coupons WHERE user_id='22222222-2222-4222-8222-222222222222')),'aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa');
RESET ROLE;
DO $$ BEGIN
 ASSERT (SELECT total FROM public.orders WHERE promotion_coupon_id IS NOT NULL)=205,'Coupon total incorrect';
 ASSERT (SELECT discount_amount FROM public.orders WHERE promotion_coupon_id IS NOT NULL)=15,'Coupons incorrectly stacked with tier discount';
 ASSERT (SELECT seller_id FROM public.order_items WHERE product_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')='44444444-4444-4444-8444-444444444444','Seller snapshot missing';
END $$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',false);
DO $$ BEGIN
 ASSERT jsonb_array_length(public.seller_orders())=1,'Seller sales missing';
 ASSERT (public.seller_orders()->0->>'shipping_address') IS NULL,'Unpaid address leaked';
END $$;
RESET ROLE;
UPDATE public.seller_profiles SET approved_until=now()-interval '1 second' WHERE user_id='44444444-4444-4444-8444-444444444444';
SET ROLE anon;
DO $$ BEGIN ASSERT NOT EXISTS(SELECT 1 FROM public.products WHERE slug='small-test-product'),'Expired listing publicly visible';END $$;
RESET ROLE;
SELECT 'Marketplace acceptance checks passed' AS result;
-- Whole-city coverage and seller report isolation.
DO $$ BEGIN ASSERT (SELECT count(*) FROM public.shipping_district_centers WHERE province='Lima' AND active AND automatic_shipping)=43,'Missing Lima district coverage';END $$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
DO $$ BEGIN ASSERT (public.seller_sales_report(now()-interval '1 day',now()+interval '1 day')->>'net')::numeric=0,'Other seller report leaked';END $$;
RESET ROLE;
DO $$ BEGIN ASSERT (SELECT sum(allocated_discount) FROM public.order_items WHERE order_id=(SELECT id FROM public.orders WHERE promotion_coupon_id IS NOT NULL))=15,'Line discounts do not sum to order discount';END $$;

-- Discounted returns refund what was actually paid, not the undiscounted price.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT public.review_manual_payment((SELECT id FROM public.orders WHERE promotion_coupon_id IS NOT NULL),'approved','TEST-DISCOUNTED-PAYMENT',NULL);
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
SELECT public.request_return((SELECT id FROM public.order_items WHERE product_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),3,'return_and_refund','Test discounted return',NULL);
RESET ROLE;
DO $$ BEGIN ASSERT (SELECT refund_amount FROM public.return_requests WHERE reason='Test discounted return')=135,'Discounted return refunds gross price';END $$;
