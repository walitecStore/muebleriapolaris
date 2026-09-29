import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
  const body = (await request.json()) as {
    orderId?: string;
    status?: string;
    reference?: string;
    note?: string;
  };
  if (!body.orderId || !['approved', 'rejected'].includes(body.status || ''))
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
  const { error } = await supabase.rpc('review_manual_payment', {
    p_order_id: body.orderId,
    p_status: body.status,
    p_reference: body.reference || null,
    p_note: body.note || null,
  });
  if (error)
    return NextResponse.json(
      { error: 'No tienes permiso para validar este pago.' },
      { status: 403 }
    );
  return NextResponse.json({ ok: true });
}
