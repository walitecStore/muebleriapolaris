import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readRequestJson, RequestJsonError } from '@/lib/request-json';
import { validCheckoutBody } from '@/lib/checkout-validation';
import { eligibleDiscount } from '@/lib/discovery';
export async function POST(request: Request) {
  try {
    const body = (await readRequestJson(request)) as {
      items: { productId: string; variantId?: string | null; quantity: number }[];
      couponId?: string;
    };
    if (
      !validCheckoutBody({
        ...body,
        checkoutKey: '00000000-0000-4000-8000-000000000000',
        shipping: { latitude: -12, longitude: -77 },
      })
    )
      return NextResponse.json({ error: 'Carrito no válido.' }, { status: 400 });
    const db = await createClient();
    const ids = [...new Set(body.items.map((i) => i.productId))];
    const { data: products, error } = await db
      .from('products')
      .select('id,price,sale_price,promotion_eligible')
      .in('id', ids)
      .eq('is_active', true);
    if (error || products?.length !== ids.length)
      return NextResponse.json({ error: 'No se pudieron verificar los precios.' }, { status: 409 });
    const variantIds = body.items.map((i) => i.variantId).filter((id): id is string => !!id);
    const result = variantIds.length
      ? await db
          .from('product_variants')
          .select('id,product_id,price_adjustment,additional_price')
          .in('id', variantIds)
          .eq('is_active', true)
      : { data: [], error: null };
    if (result.error) throw result.error;
    let subtotal = 0,
      eligibleSubtotal = 0;
    for (const item of body.items) {
      const product = products.find((p) => p.id === item.productId)!;
      const variant = result.data?.find(
        (v) => v.id === item.variantId && v.product_id === item.productId
      );
      if (item.variantId && !variant)
        return NextResponse.json({ error: 'Variante no disponible.' }, { status: 409 });
      const unit =
        Number(product.sale_price ?? product.price) +
        Number(variant?.price_adjustment || 0) +
        Number(variant?.additional_price || 0);
      subtotal += unit * item.quantity;
      if (product.promotion_eligible && unit <= 60) eligibleSubtotal += unit * item.quantity;
    }
    let discount = eligibleDiscount(eligibleSubtotal),
      couponApplied = false;
    if (body.couponId) {
      const { data: coupon } = await db
        .from('promotion_coupons')
        .select('amount,minimum_subtotal,expires_at,used_order_id')
        .eq('id', body.couponId)
        .maybeSingle();
      if (
        coupon &&
        !coupon.used_order_id &&
        new Date(coupon.expires_at).getTime() > Date.now() &&
        eligibleSubtotal >= Number(coupon.minimum_subtotal)
      ) {
        couponApplied = Number(coupon.amount) > discount;
        discount = Math.max(discount, Number(coupon.amount));
      }
    }
    return NextResponse.json(
      {
        subtotal: Number(subtotal.toFixed(2)),
        eligibleSubtotal: Number(eligibleSubtotal.toFixed(2)),
        discount: Math.min(discount, eligibleSubtotal),
        couponApplied,
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: 'No se pudieron calcular las ofertas.' },
      { status: e instanceof RequestJsonError ? e.status : 503 }
    );
  }
}
