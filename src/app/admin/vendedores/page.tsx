'use client';
import { useEffect, useState, type FormEvent } from 'react';
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
  const [reviewing, setReviewing] = useState<{ payment: Payment; approve: boolean } | null>(null);
  const [note, setNote] = useState('');
  const [verified, setVerified] = useState(false);
  const [success, setSuccess] = useState('');
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
    setError('');
    setSummary(null);
    Promise.all([
      db.rpc('admin_membership_report'),
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
    ]).then(([report, p, s]) => {
      if (!live) return;
      if (report.error || p.error || s.error) {
        setError('No se pudieron cargar vendedores y pagos. Pulsa Actualizar para reintentar.');
        setPayments([]);
        setSellers([]);
      } else {
        setSummary(report.data);
        setPayments((p.data || []) as unknown as Payment[]);
        setSellers(s.data || []);
        setError('');
      }
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [page, refresh]);
  function startReview(payment: Payment, approve: boolean) {
    setReviewing({ payment, approve });
    setNote('');
    setVerified(false);
    setError('');
    setSuccess('');
  }
  async function review(event: FormEvent) {
    event.preventDefault();
    if (
      busy ||
      !reviewing ||
      (reviewing.approve && !verified) ||
      (!reviewing.approve && !note.trim())
    )
      return;
    setBusy(reviewing.payment.id);
    setError('');
    try {
      const { error } = await createClient().rpc('review_seller_membership', {
        p_id: reviewing.payment.id,
        p_approve: reviewing.approve,
        p_note: note.trim(),
      });
      if (error) throw error;
      setSuccess(
        reviewing.approve
          ? 'Pago aprobado. La membresía fue actualizada.'
          : 'Pago rechazado. El vendedor podrá consultar el motivo.'
      );
      setReviewing(null);
      setRefresh((value) => value + 1);
    } catch {
      setError(
        'No se pudo revisar el pago. Actualiza la lista para comprobar si otra sesión ya lo procesó antes de reintentar.'
      );
    } finally {
      setBusy('');
    }
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
    setError('');
    setSuccess('');
    try {
      const { error } = await createClient().rpc('set_seller_suspension', {
        p_user: s.user_id,
        p_suspend: !s.suspended,
      });
      if (error) throw error;
      setSuccess(
        s.suspended
          ? 'Vendedor reactivado. Necesita membresía vigente para publicar.'
          : 'Vendedor suspendido. Sus publicaciones dejan de mostrarse.'
      );
      setRefresh((value) => value + 1);
    } catch {
      setError('No se pudo cambiar la suspensión. Actualiza la lista y vuelve a intentar.');
    } finally {
      setBusy('');
    }
  }
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
      <h1 className="text-3xl font-black">Vendedores y membresías</h1>
      <p className="text-slate-600">
        Solo el dueño puede aprobar pagos, suspender vendedores y administrar toda la plataforma.
      </p>
      <button
        type="button"
        disabled={loading || !!busy}
        onClick={() => {
          setReviewing(null);
          setRefresh((value) => value + 1);
        }}
        className="rounded-xl border bg-white px-5 py-3 font-bold disabled:opacity-40"
      >
        Actualizar vendedores y pagos
      </button>
      {success && (
        <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-900">
          {success}
        </p>
      )}
      {reviewing && (
        <form
          onSubmit={review}
          aria-label="Revisión de membresía"
          className="space-y-4 rounded-2xl border border-cyan-300 bg-white p-5"
        >
          <h2 className="text-xl font-bold">
            {reviewing.approve ? 'Aprobar membresía' : 'Rechazar pago'}
          </h2>
          <p>
            Operación: <strong>{reviewing.payment.reference}</strong> · S/{reviewing.payment.amount}{' '}
            · {reviewing.payment.seller_profiles?.display_name || reviewing.payment.user_id}
          </p>
          {reviewing.approve && (
            <label className="flex gap-3 text-sm">
              <input
                type="checkbox"
                required
                checked={verified}
                onChange={(event) => setVerified(event.target.checked)}
              />
              Comprobé en Yape el abono real de S/50 y la referencia de esta operación.
            </label>
          )}
          <label className="block text-sm font-semibold">
            {reviewing.approve ? 'Nota de revisión (opcional)' : 'Motivo del rechazo'}
            <textarea
              required={!reviewing.approve}
              maxLength={1000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
          <p className="text-sm text-slate-600">
            Aprobar añade un mes de membresía. Rechazar no activa ni extiende la vigencia.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={
                !!busy || (reviewing.approve && !verified) || (!reviewing.approve && !note.trim())
              }
              className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-40"
            >
              {busy
                ? 'Guardando revisión…'
                : reviewing.approve
                  ? 'Confirmar aprobación'
                  : 'Confirmar rechazo'}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => setReviewing(null)}
              className="rounded-xl border px-5 py-3"
            >
              Cancelar revisión
            </button>
          </div>
        </form>
      )}
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
                    {p.seller_profiles?.phone} ·{' '}
                    {new Date(p.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
                  </p>
                </div>
                {p.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      disabled={!!busy || !!reviewing}
                      onClick={() => startReview(p, true)}
                      className="rounded-full bg-emerald-700 px-4 py-2 font-bold text-white"
                    >
                      Verifiqué el abono: aprobar
                    </button>
                    <button
                      disabled={!!busy || !!reviewing}
                      onClick={() => startReview(p, false)}
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
                      ` · Vence: ${new Date(s.approved_until).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}`}
                  </p>
                </div>
                <button
                  disabled={!!busy || !!reviewing}
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
