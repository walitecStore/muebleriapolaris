import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPaymentMethodId } from '@/lib/payments';

type Context = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      'id,order_number,total,payment_method,payment_status,payment_provider,provider_reference,paid_at'
    )
    .eq('id', orderId)
    .eq('user_id', auth.user.id)
    .single();
  if (error || !order)
    return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });

  const [{ data: attempts }, { data: methods }] = await Promise.all([
    supabase
      .from('payment_attempts')
      .select('id,method,status,provider,provider_reference,expires_at,created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false }),
    supabase
      .from('payment_methods')
      .select('code,label,provider,sort_order,metadata')
      .eq('is_active', true)
      .order('sort_order'),
  ]);
  const configuredMethods = (methods ?? []).filter((method) => {
    if (method.code !== 'bank_transfer') return true;
    const metadata = (method.metadata ?? {}) as Record<string, unknown>;
    return Boolean(metadata.bank && metadata.account_holder && metadata.account_number);
  });
  return NextResponse.json({ order, attempt: attempts?.[0] ?? null, methods: configuredMethods });
}

export async function POST(request: Request, { params }: Context) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
  const body = (await request.json()) as { action?: string; method?: string };
  if (!['start', 'continue', 'retry', 'change'].includes(body.action || ''))
    return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 });
  if (body.method && !isPaymentMethodId(body.method))
    return NextResponse.json({ error: 'Método no válido.' }, { status: 400 });

  const { data, error } = await supabase.rpc('manage_payment_attempt', {
    p_order_id: orderId,
    p_action: body.action,
    p_method: body.method || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ payment: Array.isArray(data) ? data[0] : data });
}
