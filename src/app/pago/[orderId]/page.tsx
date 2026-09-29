'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isPaymentApproved, paymentStatusLabel, type PaymentMethodId } from '@/lib/payments';

type Method = {
  code: PaymentMethodId;
  label: string;
  provider: string | null;
  metadata: Record<string, string>;
};
type PaymentData = {
  order: {
    id: string;
    order_number: string;
    total: number;
    payment_method: PaymentMethodId;
    payment_status: string;
  };
  attempt: {
    id: string;
    method: PaymentMethodId;
    status: string;
    provider_reference?: string;
    expires_at?: string;
  } | null;
  methods: Method[];
};

const descriptions: Record<PaymentMethodId, string> = {
  card: 'Paga con tarjeta mediante una pasarela con tokenización segura.',
  yape: 'Escanea el QR oficial configurado y espera la verificación de Polaris.',
  plin: 'Escanea el QR oficial configurado y espera la verificación de Polaris.',
  bank_transfer: 'Transfiere a la cuenta oficial configurada y conserva tu referencia.',
  mercado_pago: 'Continúa en la experiencia segura del proveedor.',
};

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [data, setData] = useState<PaymentData | null>(null);
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [leaveOpen, setLeaveOpen] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/payments/${orderId}`, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo recuperar el pago.');
    setData(result);
    setMethod((current) => current ?? result.order.payment_method);
  }, [orderId]);

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, [load]);
  const selected = useMemo(
    () => data?.methods.find((item) => item.code === method),
    [data, method]
  );
  const pending = !!data && !isPaymentApproved(data.order.payment_status);

  async function act(action: 'start' | 'continue' | 'retry' | 'change') {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/payments/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, method }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo iniciar el pago.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo procesar.');
    } finally {
      setBusy(false);
    }
  }

  async function refreshStatus() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo consultar el estado.');
    } finally {
      setBusy(false);
    }
  }

  if (!data)
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <p className="mx-auto max-w-3xl rounded-2xl bg-white p-8">{error || 'Recuperando pago…'}</p>
      </main>
    );
  const meta = selected?.metadata || {};

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">
            Mueblería Polaris · Pago
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black">Pedido #{data.order.order_number}</h1>
              <p className="mt-1 text-slate-300">{paymentStatusLabel(data.order.payment_status)}</p>
            </div>
            <p className="text-3xl font-black">S/ {Number(data.order.total).toFixed(2)}</p>
          </div>
        </header>

        {isPaymentApproved(data.order.payment_status) ? (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <h2 className="text-xl font-black text-emerald-900">Pago aprobado</h2>
            <p className="mt-2 text-emerald-700">Ya podemos comenzar a preparar tu pedido.</p>
            <Link
              className="mt-5 inline-block rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white"
              href="/pedidos"
            >
              Ver seguimiento
            </Link>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border bg-white p-5 sm:p-7">
              <h2 className="text-xl font-black">Métodos de pago</h2>
              <p className="mt-1 text-sm text-slate-500">
                Solo mostramos métodos habilitados por Polaris.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {data.methods.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setMethod(item.code)}
                    className={`rounded-2xl border p-4 text-left ${method === item.code ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-100' : 'hover:border-slate-400'}`}
                  >
                    <span className="font-extrabold">{item.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {descriptions[item.code]}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border bg-white p-5 sm:p-7">
              <h2 className="text-lg font-black">
                {method === 'yape' || method === 'plin' ? 'Pagar con Yape / Plin' : selected?.label}
              </h2>
              {(method === 'yape' || method === 'plin') && (
                <div className="mt-4 space-y-4">
                  {meta.qr_url ? (
                    <img
                      src={meta.qr_url}
                      alt="QR oficial de pago"
                      className="mx-auto h-56 w-56 rounded-2xl border object-contain p-2"
                    />
                  ) : (
                    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                      El QR oficial aún no está configurado. No realices pagos a datos enviados por
                      terceros.
                    </p>
                  )}
                  {data.attempt?.provider_reference && (
                    <CopyRow label="Código de pago" value={data.attempt.provider_reference} />
                  )}
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
                    <li>Abre Yape o Plin.</li>
                    <li>Escanea el QR o usa el código proporcionado.</li>
                    <li>Paga el importe exacto.</li>
                    <li>Regresa a Polaris.</li>
                    <li>Consulta el estado; la consulta no aprueba el pago.</li>
                  </ol>
                </div>
              )}
              {method === 'bank_transfer' && (
                <div className="mt-4 space-y-2">
                  {meta.bank && meta.account_holder && meta.account_number ? (
                    <>
                      <CopyRow label="Banco" value={meta.bank} />
                      <CopyRow label="Titular" value={meta.account_holder} />
                      <CopyRow label="Cuenta" value={meta.account_number} />
                      {meta.cci && <CopyRow label="CCI" value={meta.cci} />}
                    </>
                  ) : (
                    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                      No hay una cuenta bancaria oficial configurada.
                    </p>
                  )}
                  <p className="text-sm text-slate-600">
                    Tu pedido comenzará a prepararse cuando confirmemos el pago.
                  </p>
                </div>
              )}
              {method === 'card' && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input
                    aria-label="Número de tarjeta"
                    disabled
                    placeholder="Número de tarjeta"
                    className="rounded-xl border p-3"
                  />
                  <input
                    aria-label="Nombre del titular"
                    disabled
                    placeholder="Nombre del titular"
                    className="rounded-xl border p-3"
                  />
                  <input
                    aria-label="Vencimiento"
                    disabled
                    placeholder="MM/AA"
                    className="rounded-xl border p-3"
                  />
                  <input
                    aria-label="CVV"
                    disabled
                    placeholder="CVV"
                    className="rounded-xl border p-3"
                  />
                  <p className="sm:col-span-2 text-xs text-slate-500">
                    La captura se habilitará únicamente con el SDK tokenizado del proveedor. Polaris
                    no recibe ni almacena número o CVV.
                  </p>
                </div>
              )}
              {method === 'mercado_pago' && (
                <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
                  Este proveedor requiere credenciales de servidor antes de iniciar un cobro.
                </p>
              )}
              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="font-black">Pago pendiente de verificación</p>
                <p className="text-sm text-slate-600">
                  Completa el pago para que podamos comenzar a preparar tu pedido.
                </p>
              </div>
              {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  disabled={busy || !selected}
                  onClick={() => {
                    if (
                      data.attempt?.method === method &&
                      (method === 'yape' || method === 'plin')
                    ) {
                      void refreshStatus();
                      return;
                    }
                    void act(
                      data.attempt
                        ? data.attempt.method === method
                          ? 'continue'
                          : 'change'
                        : 'start'
                    );
                  }}
                  className="rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
                >
                  {busy
                    ? 'Procesando tu pago…'
                    : data.attempt?.method === method && (method === 'yape' || method === 'plin')
                      ? 'Ya realicé el pago'
                      : data.attempt?.method !== method
                        ? 'Cambiar método de pago'
                        : 'Continuar con el pago'}
                </button>
                <button
                  onClick={() => setLeaveOpen(true)}
                  className="rounded-xl border px-5 py-3 font-bold"
                >
                  Salir
                </button>
              </div>
            </section>
          </>
        )}
      </div>
      {leaveOpen && pending && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <h2 className="text-xl font-black">Tu pago aún no se ha completado</h2>
            <p className="mt-2 text-slate-600">
              ¿Deseas continuar con el pago? Tu pedido se conservará pendiente.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setLeaveOpen(false)}
                className="rounded-xl bg-amber-500 px-4 py-3 font-black"
              >
                Continuar pagando
              </button>
              <button
                onClick={() => router.push('/pedidos')}
                className="rounded-xl border px-4 py-3 font-bold"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-mono font-bold">{value}</p>
      </div>
      <button
        onClick={() => navigator.clipboard.writeText(value)}
        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
      >
        Copiar
      </button>
    </div>
  );
}
