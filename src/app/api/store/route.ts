import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emptyStore } from '@/lib/store-profile';
export async function GET() {
  try {
    const { data, error } = await (await createClient())
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (error || !data)
      return NextResponse.json({ error: 'Perfil de tienda no disponible.' }, { status: 503 });
    const fields = Object.fromEntries(Object.keys(emptyStore).map((k) => [k, data[k]]));
    return NextResponse.json(fields, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Perfil de tienda no disponible.' }, { status: 503 });
  }
}
