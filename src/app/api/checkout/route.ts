import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PAYMENT_METHODS, type PaymentMethodId } from '@/lib/payments';

type CheckoutBody = {
  items?: { productId?: string; variantId?: string | null; quantity?: number }[];
  paymentMethod?: PaymentMethodId;
  shipping?: { latitude?: number; longitude?: number; distanceKm?: number; address?: string };
};

const STORE_LOCATION = { lat: -11.993057, lng: -77.071283 };

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
  const routeResponse = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${STORE_LOCATION.lng},${STORE_LOCATION.lat};${longitude},${latitude}?overview=false&alternatives=false&steps=false`,
    { headers: { Accept: 'application/json' }, cache: 'no-store' }
  );
  const route = routeResponse.ok ? await routeResponse.json() : null;
  const verifiedDistanceKm = Number(route?.routes?.[0]?.distance) / 1000;
  if (!Number.isFinite(verifiedDistanceKm) || verifiedDistanceKm <= 0) {
    return NextResponse.json(
      { error: 'No se pudo verificar la distancia de entrega.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc('create_validated_order', {
    p_items: body.items,
    p_payment_method: method.id,
    p_shipping: { ...body.shipping, latitude, longitude, distanceKm: verifiedDistanceKm },
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
