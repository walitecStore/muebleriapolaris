import { NextResponse } from 'next/server';
import { buildShippingQuote } from '@/lib/server/shipping-quote';
import { parseCoordinatePair, ShippingError } from '@/lib/server/shipping';
import { createAdminClient } from '@/lib/supabase/admin';

type QuoteRequest = {
  latitude?: number | string;
  longitude?: number | string;
  items?: { productId?: string; quantity?: number }[];
};

const STATUS_BY_CODE = {
  INVALID_COORDINATES: 400,
  ORIGIN_NOT_CONFIGURED: 503,
  GEOCODING_FAILED: 422,
  DISTRICT_NOT_COVERED: 422,
  ROUTING_FAILED: 502,
  SHIPPING_CONFIG_ERROR: 503,
} as const;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuoteRequest;
    const destination = parseCoordinatePair(body.latitude, body.longitude);
    if (!destination)
      throw new ShippingError('INVALID_COORDINATES', 'Las coordenadas de entrega no son válidas.');
    const productIds = Array.from(
      new Set((body.items ?? []).map((item) => item.productId).filter(Boolean))
    ).slice(0, 50) as string[];
    if (!productIds.length)
      return NextResponse.json(
        { ok: false, error: 'Faltan los productos del pedido.' },
        { status: 400 }
      );
    const supabase = createAdminClient();
    const { data: products, error } = await supabase
      .from('products')
      .select('id,name,shipping_category,shipping_factor')
      .in('id', productIds)
      .eq('is_active', true);
    if (error || products?.length !== productIds.length)
      return NextResponse.json(
        { ok: false, error: 'No se pudieron validar los productos.' },
        { status: 400 }
      );
    const factorProduct = (products ?? []).reduce(
      (current, product) =>
        Number(product.shipping_factor) > Number(current?.shipping_factor ?? 1) ? product : current,
      products?.[0]
    );
    const quote = await buildShippingQuote(supabase, destination, {
      factor: Math.max(1, Number(factorProduct?.shipping_factor) || 1),
      productId: factorProduct?.id ?? null,
      productName: factorProduct?.name ?? null,
      shippingCategory: factorProduct?.shipping_category ?? null,
      source: 'products.shipping_factor',
    });
    return NextResponse.json(quote);
  } catch (error) {
    const shippingError =
      error instanceof ShippingError
        ? error
        : new ShippingError('SHIPPING_CONFIG_ERROR', 'No se pudo calcular el envío.');
    console.error('[shipping]', { code: shippingError.code, message: shippingError.message });
    return NextResponse.json(
      { ok: false, code: shippingError.code, error: shippingError.message },
      { status: STATUS_BY_CODE[shippingError.code] }
    );
  }
}
