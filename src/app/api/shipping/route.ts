import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyShippingDestination } from '@/lib/server/shipping';

type QuoteRequest = { latitude?: number; longitude?: number; categories?: string[] };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuoteRequest;
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const categories = Array.from(
      new Set(
        (body.categories ?? []).map((value) => String(value).trim().toUpperCase()).filter(Boolean)
      )
    ).slice(0, 20);
    if (!categories.length)
      return NextResponse.json({ error: 'Faltan las categorías del pedido.' }, { status: 400 });

    const destination = await verifyShippingDestination(latitude, longitude);
    if (!destination.isLimaMetropolitana) {
      return NextResponse.json({
        success: true,
        status: 'requires_quote',
        shippingType: 'province_quote',
        message: 'Envío a provincia: requiere cotización',
        destination,
      });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('calculate_location_shipping', {
      p_category_codes: categories,
      p_distance_km: destination.distanceKm,
      p_district: destination.district,
    });
    const shippingCost = Number(data);
    if (error || !Number.isFinite(shippingCost) || shippingCost < 0) {
      console.error('[SHIPPING] Tariff error:', error);
      return NextResponse.json(
        { error: 'No se pudo obtener una tarifa configurada.' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      status: 'calculated',
      shippingType: 'lima_delivery',
      shippingCost: Number(shippingCost.toFixed(2)),
      destination,
    });
  } catch (error) {
    console.error('[SHIPPING] Quote error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo calcular el envío.' },
      { status: 422 }
    );
  }
}
