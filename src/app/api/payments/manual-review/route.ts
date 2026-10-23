import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/server/admin';
import { readRequestJson, RequestJsonError } from '@/lib/request-json';

export async function POST(request: Request) {
  const { supabase, user, isAdmin } = await getAdminSession();
  if (!user || !isAdmin)
    return NextResponse.json(
      { error: 'Acceso administrativo requerido.' },
      { status: user ? 403 : 401 }
    );
  try {
    const raw = await readRequestJson(request, 4096);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
    const body = raw as Record<string, unknown>;
    if (
      typeof body.orderId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.orderId) ||
      !['approved', 'rejected'].includes(String(body.status)) ||
      (body.reference !== undefined && typeof body.reference !== 'string') ||
      (body.note !== undefined && typeof body.note !== 'string')
    )
      return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
    const reference = (body.reference as string | undefined)?.trim() || '';
    const note = (body.note as string | undefined)?.trim() || '';
    if (reference.length > 200 || note.length > 1000 || (body.status === 'approved' && !reference))
      return NextResponse.json(
        { error: 'Revisa la referencia del pago y la nota de revisión.' },
        { status: 400 }
      );
    const { error } = await supabase.rpc('review_manual_payment', {
      p_order_id: body.orderId,
      p_status: body.status,
      p_reference: reference || null,
      p_note: note || null,
    });
    if (error)
      return NextResponse.json(
        {
          error: 'No se pudo revisar el pago. Actualiza el pedido: su estado puede haber cambiado.',
        },
        { status: 409 }
      );
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof RequestJsonError
            ? error.message
            : 'No se pudo revisar el pago. Inténtalo nuevamente.',
      },
      { status: error instanceof RequestJsonError ? error.status : 503 }
    );
  }
}
