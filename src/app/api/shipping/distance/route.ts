import { NextResponse } from 'next/server';
import {
  getDrivingRoute,
  getShippingOrigin,
  parseCoordinatePair,
  ShippingError,
} from '@/lib/server/shipping';

/** Compatibilidad: comparte el mismo origen y proveedor que el motor autoritativo. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const destination = parseCoordinatePair(body.latitude, body.longitude);
    if (!destination)
      throw new ShippingError('INVALID_COORDINATES', 'Las coordenadas no son válidas.');
    const route = await getDrivingRoute(await getShippingOrigin(), destination);
    return NextResponse.json({ ok: true, route });
  } catch (error) {
    const shippingError =
      error instanceof ShippingError
        ? error
        : new ShippingError('ROUTING_FAILED', 'No fue posible calcular la ruta.');
    return NextResponse.json(
      { ok: false, code: shippingError.code, error: shippingError.message },
      { status: shippingError.code === 'INVALID_COORDINATES' ? 400 : 502 }
    );
  }
}
