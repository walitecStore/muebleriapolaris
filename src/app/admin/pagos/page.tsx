'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { publicWebUrl } from '@/lib/store-profile';
import { manualPaymentReady } from '@/lib/payments';
type Method = { code: string; label: string; is_active: boolean; metadata: Record<string, string> };
function MethodForm({ initial }: { initial: Method }) {
  const [method, setMethod] = useState(initial),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const fields =
    method.code === 'bank_transfer'
      ? [
          ['bank', 'Banco'],
          ['account_holder', 'Titular'],
          ['account_number', 'Número de cuenta'],
          ['cci', 'CCI (opcional)'],
        ]
      : [
          ['qr_url', 'URL HTTPS del QR oficial'],
          ['account_holder', 'Titular'],
          ['phone', 'Teléfono de cobro'],
        ];
  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (method.is_active && !manualPaymentReady(method)) {
      setError('Completa los datos oficiales antes de activar el método.');
      return;
    }
    if (method.metadata.qr_url && !publicWebUrl(method.metadata.qr_url)) {
      setError('La dirección del QR no es válida.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await createClient()
        .from('payment_methods')
        .update({ is_active: method.is_active, metadata: method.metadata })
        .eq('code', method.code)
        .select('code')
        .single();
      if (error) throw error;
      setMessage('Método de pago guardado.');
    } catch {
      setError('No se pudo guardar el método de pago.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border bg-white p-5">
      <h2 className="text-xl font-bold">{method.label}</h2>
      <label className="flex gap-2 text-sm">
        <input
          type="checkbox"
          checked={method.is_active}
          onChange={(e) => setMethod({ ...method, is_active: e.target.checked })}
        />
        Disponible para clientes
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              maxLength={2048}
              value={method.metadata[key] || ''}
              onChange={(e) =>
                setMethod({ ...method, metadata: { ...method.metadata, [key]: e.target.value } })
              }
              className="mt-1 w-full rounded-lg border p-3"
            />
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-700">
          {message}
        </p>
      )}
      <button
        disabled={saving}
        className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Guardar método'}
      </button>
    </form>
  );
}
export default function PaymentSettings() {
  const [methods, setMethods] = useState<Method[]>([]),
    [error, setError] = useState('');
  useEffect(() => {
    createClient()
      .from('payment_methods')
      .select('code,label,is_active,metadata')
      .in('code', ['yape', 'plin', 'bank_transfer'])
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) setError('No se pudieron consultar los medios de pago.');
        else setMethods(data || []);
      });
  }, []);
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <h1 className="text-3xl font-black">Medios de pago</h1>
      <p className="text-sm text-slate-500">
        Publica únicamente cuentas y QR oficiales. Estos datos serán visibles para los compradores.
        Nunca ingreses claves de acceso. Los pagos requieren verificación en Pedidos.
      </p>
      {error && (
        <p role="alert" className="text-rose-700">
          {error}
        </p>
      )}
      {methods.map((m) => (
        <MethodForm key={m.code} initial={{ ...m, metadata: m.metadata || {} }} />
      ))}
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        Tarjetas y Mercado Pago permanecerán deshabilitados hasta integrar y validar una pasarela
        real.
      </p>
    </main>
  );
}
