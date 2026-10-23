import { NextResponse } from 'next/server';
import { drivingRoute, validCoordinate } from '@/lib/server/shipping';
import { createClient } from '@/lib/supabase/server';
export async function POST(request: Request) {
  try {
    const b = await request.json();
    if (!validCoordinate(b.latitude, b.longitude))
      return NextResponse.json(
        { error: 'La ubicación seleccionada no corresponde a Perú.' },
        { status: 400 }
      );
    const { data, error } = await (await createClient())
      .from('store_settings')
      .select('origin_lat,origin_lng,origin_address')
      .eq('id', 1)
      .single();
    if (error || !data)
      return NextResponse.json(
        { error: 'No se pudo consultar el origen de entrega.' },
        { status: 503 }
      );
    const route = await drivingRoute(Number(b.latitude), Number(b.longitude), {
      latitude: Number(data.origin_lat),
      longitude: Number(data.origin_lng),
      address: data.origin_address,
    });
    return NextResponse.json({ success: true, ...route });
  } catch {
    return NextResponse.json({ error: 'No se pudo calcular la ruta.' }, { status: 502 });
  }
}
