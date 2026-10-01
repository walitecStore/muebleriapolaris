import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PAYMENT_METHODS, type PaymentMethodId } from '@/lib/payments';
import { buildShippingQuote } from '@/lib/server/shipping-quote';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCoordinatePair, ShippingError } from '@/lib/server/shipping';

type CheckoutBody = {
  items?: { productId?: string; variantId?: string | null; quantity?: number }[];
  paymentMethod?: PaymentMethodId;
  shipping?: { latitude?: number; longitude?: number; address?: string; reference?: string };
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });

  const body = (await request.json()) as CheckoutBody;
  const method = PAYMENT_METHODS.find((entry) => entry.id === body.paymentMethod);
  if (!method) return NextResponse.json({ error: 'Método de pago no válido.' }, { status: 400 });
  const { data: configuredMethod, error: methodError } = await supabase
    .from('payment_methods')
    .select('code,is_active')
    .eq('code', method.id)
    .maybeSingle();
  if (!methodError && (!configuredMethod || !configuredMethod.is_active)) {
    return NextResponse.json({ error: 'Este método de pago no está disponible.' }, { status: 400 });
  }
  if (!body.items?.length || !body.shipping) {
    return NextResponse.json({ error: 'El checkout está incompleto.' }, { status: 400 });
  }
  const destinationCoordinate = parseCoordinatePair(
    body.shipping.latitude,
    body.shipping.longitude
  );
  if (!destinationCoordinate) {
    return NextResponse.json({ error: 'La ubicación de entrega no es válida.' }, { status: 400 });
  }
  const productRows = await supabase
    .from('products')
    .select('id,name,shipping_category,shipping_factor')
    .in('id', body.items.map((item) => item.productId).filter(Boolean));
  if (
    productRows.error ||
    productRows.data?.length !== new Set(body.items.map((item) => item.productId)).size
  )
    return NextResponse.json({ error: 'No se pudieron validar los productos.' }, { status: 400 });
  const factorProduct = (productRows.data ?? []).reduce(
    (current, product) =>
      Number(product.shipping_factor) > Number(current?.shipping_factor ?? 1) ? product : current,
    productRows.data?.[0]
  );
  const productFactor = {
    factor: Math.max(1, Number(factorProduct?.shipping_factor) || 1),
    productId: factorProduct?.id ?? null,
    productName: factorProduct?.name ?? null,
    shippingCategory: factorProduct?.shipping_category ?? null,
    source: 'products.shipping_factor' as const,
  };
  let quote;
  try {
    const adminForQuote = createAdminClient();
    quote = await buildShippingQuote(adminForQuote, destinationCoordinate, productFactor);
  } catch (error) {
    return NextResponse.json(
      {
        code: error instanceof ShippingError ? error.code : 'SHIPPING_CONFIG_ERROR',
        error: error instanceof Error ? error.message : 'No se pudo verificar el destino.',
      },
      {
        status:
          error instanceof ShippingError && error.code === 'ORIGIN_NOT_CONFIGURED' ? 503 : 400,
      }
    );
  }
  if (quote.status === 'requires_quote')
    return NextResponse.json(
      { code: 'SHIPPING_CONFIG_ERROR', error: quote.message },
      { status: 409 }
    );
  const destination = quote.destination;
  const reference = String(body.shipping.reference ?? body.shipping.address ?? '')
    .split('')
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout no configurado.' },
      { status: 503 }
    );
  }
  const { data, error } = await admin.rpc('create_server_validated_order', {
    p_user_id: auth.user.id,
    p_items: body.items,
    p_payment_method: method.id,
    p_shipping: {
      latitude: destinationCoordinate.lat,
      longitude: destinationCoordinate.lng,
      distanceKm: quote.route.distanceKm,
      durationMinutes: Math.max(1, Math.round(quote.route.durationSeconds / 60)),
      address: destination.address,
      reference,
      district: destination.district,
      province: destination.province,
      department: destination.department,
      shippingType: 'lima_delivery',
      quoteStatus: 'calculated',
      routeProvider: quote.route.provider,
      centerDistanceKm: quote.audit.centerRouteDistanceKm,
      centerDeltaKm: quote.audit.centerDeltaKm,
      commercialRoutePrice: quote.pricing.commercialRoutePrice,
      adjustment: quote.pricing.centerAdjustment,
      shippingAmount: quote.pricing.finalPrice,
      pricingMode: quote.pricing.pricingMode,
      calibrationName: quote.audit.calibrationName,
      pricingVersion: quote.audit.pricingVersion,
    },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const order = Array.isArray(data) ? data[0] : data;
  // Ningún proveedor está configurado todavía. El servidor crea una intención
  // pendiente; solo un webhook/backend autenticado podrá aprobarla posteriormente.
  return NextResponse.json({
    order,
    payment: {
      status: 'pending',
      provider: method.provider,
      message:
        method.provider === 'manual'
          ? 'El pago queda pendiente hasta que Polaris lo verifique.'
          : 'La pasarela todavía no está configurada. No se realizó ningún cobro.',
    },
  });
}
