import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildShippingQuote } from '@/lib/server/shipping-quote';

type QuoteRequest = {
  latitude?: number;
  longitude?: number;
  items?: { productId?: string; quantity?: number }[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuoteRequest;
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const supabase = await createClient();
    const productIds = Array.from(
      new Set((body.items ?? []).map((item) => item.productId).filter(Boolean))
    ).slice(0, 50) as string[];
    if (!productIds.length)
      return NextResponse.json({ error: 'Faltan los productos del pedido.' }, { status: 400 });
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id,shipping_factor')
      .in('id', productIds)
      .eq('is_active', true);
    if (productsError || products?.length !== productIds.length)
      return NextResponse.json({ error: 'No se pudieron validar los productos.' }, { status: 400 });
    const productFactor = Math.max(
      1,
      ...(products ?? []).map((product) => Number(product.shipping_factor) || 1)
    );
    const quote = await buildShippingQuote(supabase, latitude, longitude, productFactor);
    if (quote.status === 'requires_quote') {
      return NextResponse.json({
        success: true,
        status: 'requires_quote',
        shippingType: 'manual_quote',
        message: quote.message,
        destination: quote.destination,
      });
    }
    return NextResponse.json({
      success: true,
      status: 'calculated',
      shippingType: 'lima_delivery',
      shippingCost: quote.shippingCost,
      destination: quote.destination,
    });
  } catch (error) {
    console.error('[SHIPPING] Quote error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo calcular el envío.' },
      { status: 422 }
    );
  }
}
