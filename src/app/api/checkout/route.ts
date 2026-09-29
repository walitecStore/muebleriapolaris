import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PAYMENT_METHODS, type PaymentMethodId } from '@/lib/payments';
import { buildShippingQuote } from '@/lib/server/shipping-quote';
import { createAdminClient } from '@/lib/supabase/admin';

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
  const latitude = Number(body.shipping.latitude);
  const longitude = Number(body.shipping.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: 'La ubicación de entrega no es válida.' }, { status: 400 });
  }
  const productRows = await supabase
    .from('products')
    .select('id,shipping_factor')
    .in('id', body.items.map((item) => item.productId).filter(Boolean));
  if (
    productRows.error ||
    productRows.data?.length !== new Set(body.items.map((item) => item.productId)).size
  )
    return NextResponse.json({ error: 'No se pudieron validar los productos.' }, { status: 400 });
  const productFactor = Math.max(
    1,
    ...(productRows.data ?? []).map((item) => Number(item.shipping_factor) || 1)
  );
  let quote;
  try {
    quote = await buildShippingQuote(supabase, latitude, longitude, productFactor);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo verificar el destino.' },
      { status: 400 }
    );
  }
  if (quote.status !== 'calculated') {
    return NextResponse.json(
      {
        error:
          'No pudimos calcular automáticamente el envío para esta ubicación. No se creó ningún pedido.',
      },
      { status: 409 }
    );
  }
  const destination = quote.destination;

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
      latitude,
      longitude,
      distanceKm: destination.distanceKm,
      durationMinutes: destination.durationMinutes,
      address: destination.address,
      reference: body.shipping.reference || body.shipping.address || '',
      district: destination.district,
      province: destination.province,
      department: destination.department,
      shippingType: 'lima_delivery',
      quoteStatus: 'calculated',
      routeProvider: destination.provider,
      centerDistanceKm: quote.audit.centerDistanceKm,
      centerDeltaKm: quote.audit.deltaKm,
      basePrice: quote.audit.basePrice,
      adjustment: quote.audit.adjustment,
      shippingAmount: quote.shippingCost,
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
