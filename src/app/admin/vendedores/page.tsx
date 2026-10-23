'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
type Seller = {
  user_id: string;
  display_name: string;
  phone: string;
  approved_until: string | null;
  suspended: boolean;
  delivery_vehicle: string;
  delivery_partner: string;
};
type Payment = {
  id: string;
  user_id: string;
  reference: string;
  created_at: string;
  status: string;
  amount: number;
  seller_profiles: { display_name: string; phone: string } | null;
};
export default function Sellers() {
  const [summary, setSummary] = useState<{
    active: number;
    pending: number;
    collected: number;
  } | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]),
    [sellers, setSellers] = useState<Seller[]>([]),
    [page, setPage] = useState(0),
    [refresh, setRefresh] = useState(0),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    const db = createClient();
    setLoading(true);
    void db.rpc('admin_membership_report').then(({ data }) => setSummary(data));
    Promise.all([
      db
        .from('seller_membership_payments')
        .select('id,user_id,reference,created_at,status,amount,seller_profiles(display_name,phone)')
        .order('created_at', { ascending: false })
        .range(page * 25, page * 25 + 24),
      db
        .from('seller_profiles')
        .select(
          'user_id,display_name,phone,approved_until,suspended,delivery_vehicle,delivery_partner'
        )
        .order('created_at', { ascending: false })
        .range(page * 25, page * 25 + 24),
    ]).then(([p, s]) => {
      if (!live) return;
      if (p.error || s.error)
        setError('No se pudieron cargar vendedores. Comprueba la nueva migración.');
      else {
        setPayments(p.data as unknown as Payment[]);
        setSellers(s.data || []);
        setError('');
      }
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [page, refresh]);
  async function review(p: Payment, approve: boolean) {
    if (busy) return;
    const note = prompt(
      approve
        ? 'Confirma que verificaste en Yape el abono REAL de S/50. Añade una nota de revisión:'
        : 'Motivo de rechazo:'
    );
    if (note === null) return;
    if (
      approve &&
      !confirm(`¿Aprobar S/50 con operación ${p.reference}? Esto activa un mes de venta.`)
    )
      return;
    setBusy(p.id);
    const { error } = await createClient().rpc('review_seller_membership', {
      p_id: p.id,
      p_approve: approve,
      p_note: note,
    });
    if (error) setError('No se pudo revisar. Puede haber sido procesado por otra sesión.');
    else setRefresh((x) => x + 1);
    setBusy('');
  }
  async function suspend(s: Seller) {
    if (
      busy ||
      !confirm(
        s.suspended ? '¿Reactivar a este vendedor?' : '¿Suspender publicaciones de este vendedor?'
      )
    )
      return;
    setBusy(s.user_id);
    const { error } = await createClient().rpc('set_seller_suspension', {
      p_user: s.user_id,
      p_suspend: !s.suspended,
    });
    if (error) setError('No se pudo cambiar la suspensión.');
    else setRefresh((x) => x + 1);
    setBusy('');
  }
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
      <h1 className="text-3xl font-black">Vendedores y membresías</h1>
      <p className="text-slate-600">
        Solo el dueño puede aprobar pagos, suspender vendedores y administrar toda la plataforma.
      </p>
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['Vendedores activos', summary.active],
            ['Pagos por verificar', summary.pending],
            [
              'Membresías cobradas (histórico)',
              Number(summary.collected).toLocaleString('es-PE', {
                style: 'currency',
                currency: 'PEN',
              }),
            ],
          ].map(([label, value]) => (
            <section key={label} className="rounded-2xl border bg-white p-5">
              <h2 className="text-sm text-slate-500">{label}</h2>
              <p className="mt-2 text-2xl font-black">{value}</p>
            </section>
          ))}
        </div>
      )}
      <Link href="/admin/configuracion" className="inline-block text-cyan-700 underline">
        Configurar QR de Yape y datos de cobro
      </Link>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">
          {error}
        </p>
      )}
      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Pagos de S/50</h2>
            {!payments.length && <p>No hay pagos registrados.</p>}
            {payments.map((p) => (
              <article
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5"
              >
                <div>
                  <h3 className="font-bold">{p.seller_profiles?.display_name || p.user_id}</h3>
                  <p className="text-sm">
                    Operación: {p.reference} · S/{p.amount} ·{' '}
                    {
                      { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' }[
                        p.status
                      ]
                    }
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.seller_profiles?.phone} · {new Date(p.created_at).toLocaleString('es-PE')}
                  </p>
                </div>
                {p.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      disabled={!!busy}
                      onClick={() => review(p, true)}
                      className="rounded-full bg-emerald-700 px-4 py-2 font-bold text-white"
                    >
                      Verifiqué el abono: aprobar
                    </button>
                    <button
                      disabled={!!busy}
                      onClick={() => review(p, false)}
                      className="rounded-full border px-4 py-2"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </article>
            ))}
          </section>
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Perfiles de vendedores</h2>
            {sellers.map((s) => (
              <article
                key={s.user_id}
                className="flex flex-wrap justify-between gap-4 rounded-2xl border bg-white p-5"
              >
                <div>
                  <h3 className="font-bold">{s.display_name}</h3>
                  <p className="text-sm">
                    {s.phone} · {s.delivery_vehicle === 'truck' ? 'Camión' : 'Motorizado'} ·{' '}
                    {s.delivery_partner === 'polaris' ? 'Coordina con Polaris' : 'Particular'}
                  </p>
                  <p className="text-sm">
                    {s.suspended
                      ? 'Suspendido'
                      : new Date(s.approved_until || 0).getTime() > Date.now()
                        ? 'Activo'
                        : 'Sin membresía activa'}
                    {s.approved_until &&
                      ` · Vence: ${new Date(s.approved_until).toLocaleDateString('es-PE')}`}
                  </p>
                </div>
                <button
                  disabled={!!busy}
                  onClick={() => suspend(s)}
                  className="rounded-full border px-4 py-2"
                >
                  {s.suspended ? 'Reactivar' : 'Suspender'}
                </button>
              </article>
            ))}
          </section>
          <div className="flex items-center gap-4">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border px-4 py-2 disabled:opacity-40"
            >
              Anterior
            </button>
            <span>Página {page + 1}</span>
            <button
              disabled={payments.length < 25 && sellers.length < 25}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border px-4 py-2 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </main>
  );
}
