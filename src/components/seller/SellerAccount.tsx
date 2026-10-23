'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { createClient } from '@/lib/supabase/client';
import { publicWebUrl } from '@/lib/store-profile';
const blank = {
  display_name: '',
  bio: '',
  phone: '',
  avatar_url: '',
  delivery_vehicle: 'motorcycle',
  delivery_partner: 'polaris',
  delivery_notes: '',
};
type Payment = {
  id: string;
  reference: string;
  status: string;
  created_at: string;
  review_note: string;
};
export default function SellerAccount() {
  const { user } = useAuth(),
    store = useStore();
  const [form, setForm] = useState(blank),
    [until, setUntil] = useState(''),
    [suspended, setSuspended] = useState(false),
    [exists, setExists] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [reference, setReference] = useState(''),
    [payments, setPayments] = useState<Payment[]>([]);
  useEffect(() => {
    if (!user) return;
    let live = true;
    const db = createClient();
    Promise.all([
      db.from('seller_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      db
        .from('seller_membership_payments')
        .select('id,reference,status,created_at,review_note')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12),
    ]).then(([p, m]) => {
      if (!live) return;
      if (p.error || m.error)
        setMessage(
          'Las inscripciones de vendedores todavía no están habilitadas. Contacta a Polaris.'
        );
      if (p.data) {
        const row = p.data;
        setForm({
          ...blank,
          ...Object.fromEntries(
            Object.keys(blank).map((k) => [k, row[k] || blank[k as keyof typeof blank]])
          ),
        });
        setExists(true);
        setUntil(row.approved_until || '');
        setSuspended(row.suspended);
      }
      setPayments(m.data || []);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [user]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    setMessage('');
    if (form.avatar_url && !publicWebUrl(form.avatar_url)) {
      setMessage('Usa una URL de imagen válida.');
      setBusy(false);
      return;
    }
    try {
      const db = createClient();
      const payload = { ...form, display_name: form.display_name.trim(), phone: form.phone.trim() };
      const { error } = exists
        ? await db.from('seller_profiles').update(payload).eq('user_id', user.id)
        : await db.from('seller_profiles').insert({ ...payload, user_id: user.id });
      if (error) throw error;
      setExists(true);
      setMessage('Perfil guardado.');
    } catch {
      setMessage('No se pudo guardar el perfil. Revisa los datos y vuelve a intentar.');
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await createClient()
        .from('seller_membership_payments')
        .insert({ user_id: user.id, reference: reference.trim() })
        .select('id,reference,status,created_at,review_note')
        .single();
      if (error) throw error;
      setPayments((p) => [data, ...p]);
      setReference('');
      setMessage(
        'Pago enviado para revisión. El dueño verificará el abono antes de activar tu membresía.'
      );
    } catch {
      setMessage(
        'No se pudo registrar. Comprueba que la referencia sea válida y no tengas otro pago pendiente.'
      );
    } finally {
      setBusy(false);
    }
  }
  const active = !suspended && new Date(until || 0).getTime() > Date.now();
  return (
    <main className="mx-auto max-w-5xl space-y-7 px-5 py-10">
      <div>
        <h1 className="text-3xl font-black">Tu negocio en Polaris</h1>
        <p className="mt-3 text-slate-600">
          1. Completa tu perfil. 2. Abona S/50. 3. Espera la verificación. 4. Publica tus productos.
        </p>
      </div>
      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <section className={`rounded-2xl p-5 ${active ? 'bg-emerald-100' : 'bg-amber-50'}`}>
            <h2 className="font-bold">
              {suspended
                ? 'Cuenta suspendida'
                : active
                  ? 'Membresía activa'
                  : 'Membresía pendiente de activación'}
            </h2>
            {until && (
              <p className="mt-2 text-sm">
                Vigencia hasta {new Date(until).toLocaleString('es-PE')}.
              </p>
            )}
            {active && (
              <Link
                href="/vender/productos/nuevo"
                className="mt-3 inline-block font-bold text-cyan-800 underline"
              >
                Publicar mi primer producto →
              </Link>
            )}
          </section>
          <form
            onSubmit={save}
            className="grid gap-4 rounded-3xl border bg-white p-6 sm:grid-cols-2"
          >
            <h2 className="text-xl font-bold sm:col-span-2">Perfil del vendedor</h2>
            {[
              ['display_name', 'Nombre de tu negocio'],
              ['phone', 'Teléfono de coordinación'],
              ['avatar_url', 'URL de foto o logo'],
              ['bio', 'Descripción de tu negocio'],
            ].map(([key, label]) => (
              <label key={key} className="text-sm font-semibold">
                {label}
                <input
                  required={key === 'display_name' || key === 'phone'}
                  maxLength={key === 'bio' ? 1500 : 300}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>
            ))}
            <label className="text-sm font-semibold">
              Vehículo habitual
              <select
                value={form.delivery_vehicle}
                onChange={(e) => setForm({ ...form, delivery_vehicle: e.target.value })}
                className="mt-2 w-full rounded-xl border p-3"
              >
                <option value="motorcycle">Motorizado: productos pequeños</option>
                <option value="truck">Camión: productos grandes</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Coordinación de entrega
              <select
                value={form.delivery_partner}
                onChange={(e) => setForm({ ...form, delivery_partner: e.target.value })}
                className="mt-2 w-full rounded-xl border p-3"
              >
                <option value="polaris">Coordinar con Polaris</option>
                <option value="independent">Mi transportista particular</option>
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              Instrucciones de entrega
              <textarea
                maxLength={1000}
                value={form.delivery_notes}
                onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })}
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
            <button
              disabled={busy}
              className="rounded-full bg-cyan-600 px-5 py-3 font-bold text-white"
            >
              Guardar perfil
            </button>
          </form>
          <section className="space-y-4 rounded-3xl border bg-white p-6">
            <h2 className="text-xl font-bold">Membresía mensual · S/50</h2>
            <p>
              Yapea a <strong>{store.membership_yape_phone || '916832791'}</strong>
              {store.membership_payee && (
                <>
                  {' '}
                  · Titular: <strong>{store.membership_payee}</strong>
                </>
              )}
              .
            </p>
            {publicWebUrl(store.membership_qr_url) ? (
              <img
                src={store.membership_qr_url}
                alt="QR de cobro Yape de Polaris"
                className="h-64 w-64 rounded-2xl border object-contain"
              />
            ) : (
              <p className="rounded-xl bg-amber-50 p-4 text-sm">
                El dueño aún debe cargar el QR de cobro de su aplicación Yape. Puedes pagar al
                número indicado después de comprobar el nombre del destinatario.
              </p>
            )}
            <p className="text-sm text-slate-500">
              Cada pago aprobado añade un mes desde el vencimiento vigente o desde la fecha de
              aprobación. La verificación es manual. No hay cobro automático ni renovación sin un
              nuevo pago.
            </p>
            {exists ? (
              <form onSubmit={submit} className="flex flex-wrap gap-3">
                <label className="flex-1 text-sm">
                  Número de operación de Yape
                  <input
                    required
                    minLength={4}
                    maxLength={100}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-3"
                  />
                </label>
                <button
                  disabled={busy || payments.some((p) => p.status === 'pending')}
                  className="self-end rounded-full bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-40"
                >
                  Enviar para verificar
                </button>
              </form>
            ) : (
              <p className="text-sm text-amber-800">Primero guarda tu perfil.</p>
            )}
            {payments.map((p) => (
              <div key={p.id} className="rounded-xl border p-3 text-sm">
                <strong>{p.reference}</strong> ·{' '}
                {{ pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' }[p.status]} ·{' '}
                {new Date(p.created_at).toLocaleDateString('es-PE')}
                {p.review_note && <p>{p.review_note}</p>}
              </div>
            ))}
          </section>
        </>
      )}
      {message && (
        <p role="status" className="rounded-xl border bg-white p-4">
          {message}
        </p>
      )}
    </main>
  );
}
