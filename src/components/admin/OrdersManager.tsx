'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isPaymentApproved, paymentStatusLabel } from '@/lib/payments';
type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  shipping_address: string;
  shipping_reference: string;
  shipping_district: string;
  provider_reference: string;
  profiles: { full_name: string; email: string } | null;
  order_items: { product_name: string; quantity: number; unit_price: number }[];
};
const states = [
  ['confirmado', 'Confirmado'],
  ['preparando', 'Preparando'],
  ['empaquetando', 'Empaquetando'],
  ['preparando_envio', 'Preparando envío'],
  ['camino', 'En camino'],
  ['entregado', 'Entregado'],
  ['cancelado', 'Cancelado'],
];
export default function OrdersManager({ customerId }: { customerId?: string }) {
  const [rows, setRows] = useState<Order[]>([]),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState(0),
    [filter, setFilter] = useState('all'),
    [refresh, setRefresh] = useState(0),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(''),
    [reference, setReference] = useState<Record<string, string>>({});
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    let q = createClient()
      .from('orders')
      .select(
        'id,order_number,status,total,payment_status,payment_method,created_at,shipping_address,shipping_reference,shipping_district,provider_reference,profiles(full_name,email),order_items(product_name,quantity,unit_price)'
      )
      .order('created_at', { ascending: false })
      .range(page * 20, page * 20 + 19);
    if (customerId) q = q.eq('user_id', customerId);
    if (filter === 'pending') q = q.eq('payment_status', 'pending').neq('status', 'cancelado');
    if (filter === 'paid') q = q.in('payment_status', ['approved', 'aprobado']);
    q.then(({ data, error }) => {
      if (!live) return;
      if (error)
        setError('No se pudieron cargar los pedidos. Comprueba las migraciones y permisos.');
      else setRows((data || []) as unknown as Order[]);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [page, filter, refresh, customerId]);
  async function review(o: Order, status: string) {
    if (status === 'approved' && !reference[o.id]?.trim()) {
      setError('Ingresa la referencia bancaria o del pago verificado antes de aprobar.');
      return;
    }
    if (
      !confirm(
        status === 'approved'
          ? '¿Verificaste el ingreso real de este importe?'
          : '¿Rechazar este pago? El pedido conservará su reserva hasta cancelarlo.'
      )
    )
      return;
    setBusy(o.id);
    setError('');
    try {
      const r = await fetch('/api/payments/manual-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: o.id, status, reference: reference[o.id] || '' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'No se pudo revisar el pago.');
      setRefresh((x) => x + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo revisar el pago.');
    } finally {
      setBusy('');
    }
  }
  async function update(o: Order, status: string) {
    if (
      !confirm(
        `¿Cambiar el pedido a ${states.find((s) => s[0] === status)?.[1]}?${status === 'cancelado' ? ' Se liberará el inventario reservado.' : ''}`
      )
    )
      return;
    setBusy(o.id);
    setError('');
    try {
      const { error } = await createClient()
        .from('orders')
        .update({ status })
        .eq('id', o.id)
        .select('id')
        .single();
      if (error) throw error;
      setRefresh((x) => x + 1);
    } catch {
      setError(
        'No se pudo cambiar el estado. Un pedido sin pago aprobado no puede entrar en preparación o reparto.'
      );
    } finally {
      setBusy('');
    }
  }
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <h1 className="text-3xl font-black">Pedidos y pagos</h1>
      <p className="text-sm text-slate-500">
        Verifica el cobro antes de preparar el pedido. Cancelar no devuelve dinero; los reembolsos
        se registran en Devoluciones.
      </p>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">
          Mostrar
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
            className="ml-3 rounded-lg border p-3"
          >
            <option value="all">Todos los pedidos</option>
            <option value="pending">Pagos pendientes</option>
            <option value="paid">Pagados</option>
          </select>
        </label>
        <button
          onClick={() => setRefresh((x) => x + 1)}
          className="rounded-lg border bg-white px-4"
        >
          Actualizar
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Cargando pedidos…</p>
      ) : (
        <div className="space-y-5">
          {rows.map((o) => (
            <article key={o.id} className="space-y-4 rounded-2xl border bg-white p-5">
              <header className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-black">{o.order_number || o.id.slice(0, 8)}</h2>
                  <p className="text-xs text-slate-500">
                    {new Date(o.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })} ·{' '}
                    {o.profiles?.full_name || o.profiles?.email || 'Cliente'}
                  </p>
                </div>
                <div className="text-right">
                  <strong>
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
                      o.total
                    )}
                  </strong>
                  <p
                    className={`text-sm ${isPaymentApproved(o.payment_status) ? 'text-emerald-700' : 'text-amber-700'}`}
                  >
                    {paymentStatusLabel(o.payment_status)} · {o.payment_method}
                  </p>
                </div>
              </header>
              <ul className="space-y-1 text-sm">
                {o.order_items.map((i, n) => (
                  <li key={n}>
                    {i.quantity} × {i.product_name} · S/ {Number(i.unit_price).toFixed(2)} c/u
                  </li>
                ))}
              </ul>
              <p className="text-sm text-slate-600">
                Entrega: {o.shipping_address || o.shipping_district || 'Sin dirección'}
                {o.shipping_reference && ` · ${o.shipping_reference}`}
              </p>
              <label className="block text-sm font-semibold">
                Estado logístico
                <select
                  value={o.status}
                  disabled={busy === o.id || o.status === 'cancelado'}
                  onChange={(e) => void update(o, e.target.value)}
                  className="ml-3 rounded-lg border p-2"
                >
                  {states.map(([value, label]) => (
                    <option
                      key={value}
                      value={value}
                      disabled={
                        !isPaymentApproved(o.payment_status) &&
                        !['confirmado', 'cancelado'].includes(value)
                      }
                    >
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {!isPaymentApproved(o.payment_status) && o.status !== 'cancelado' && (
                <div className="flex flex-wrap items-end gap-3 border-t pt-4">
                  <label className="min-w-48 flex-1 text-sm">
                    Referencia real del pago
                    <input
                      value={reference[o.id] || ''}
                      maxLength={200}
                      onChange={(e) => setReference({ ...reference, [o.id]: e.target.value })}
                      className="mt-1 w-full rounded-lg border p-3"
                    />
                  </label>
                  <button
                    disabled={busy === o.id}
                    onClick={() => void review(o, 'approved')}
                    className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Aprobar pago verificado
                  </button>
                  <button
                    disabled={busy === o.id}
                    onClick={() => void review(o, 'rejected')}
                    className="rounded-lg border px-4 py-3 text-sm"
                  >
                    Rechazar pago
                  </button>
                </div>
              )}
              {o.provider_reference && (
                <p className="text-xs text-slate-500">Referencia: {o.provider_reference}</p>
              )}
            </article>
          ))}
          {!rows.length && (
            <p className="rounded-xl bg-white p-8 text-slate-500">
              No hay pedidos en esta selección.
            </p>
          )}
        </div>
      )}
      <div className="flex justify-between">
        <button
          disabled={page === 0 || loading}
          onClick={() => setPage((x) => x - 1)}
          className="rounded-lg border px-4 py-2 disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="p-2 text-sm">Página {page + 1}</span>
        <button
          disabled={rows.length < 20 || loading}
          onClick={() => setPage((x) => x + 1)}
          className="rounded-lg border px-4 py-2 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </main>
  );
}
