'use client';
import { useState, useEffect } from 'react';
import { limaDate, csvCell } from '@/lib/sales-period';
type Report = {
  gross: number;
  discount: number;
  refunds: number;
  net: number;
  orders: number;
  units: number;
};
const fields = [
  ['gross', 'Ventas brutas'],
  ['discount', 'Descuentos aplicados'],
  ['refunds', 'Reembolsos'],
  ['net', 'Ventas netas'],
  ['orders', 'Pedidos pagados'],
  ['units', 'Unidades vendidas'],
] as const;
export default function Stats() {
  const [period, setPeriod] = useState('month'),
    [date, setDate] = useState(limaDate()),
    [report, setReport] = useState<Report | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    fetch(`/api/seller/report?period=${period}&date=${date}`, { signal: c.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => {
        setReport(d);
        setError('');
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [period, date]);
  function csv() {
    if (!report) return;
    const data =
      '\uFEFF' +
      fields.map(([key, label]) => [label, report[key]].map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-polaris-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-10">
      <h1 className="text-3xl font-black">Estadísticas de mi tienda</h1>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">
          Período
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="ml-2 rounded-xl border p-3"
          >
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
          </select>
        </label>
        <label className="text-sm">
          Fecha
          <input
            aria-label="Fecha del reporte"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ml-2 rounded-xl border p-3"
          />
        </label>
        <button
          onClick={csv}
          disabled={!report || loading || !!error}
          className="rounded-xl border px-5 py-3"
        >
          Descargar CSV
        </button>
      </div>
      <p className="text-sm text-slate-600">
        Según fecha de pago, en horario de Perú. Las ventas netas restan descuentos y reembolsos;
        excluyen envío y membresía. No representan utilidad ni una transferencia bancaria. Los pagos
        al vendedor se coordinan con Polaris.
      </p>
      {loading ? (
        <p>Cargando estadísticas…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        report && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(([key, label]) => (
              <section key={key} className="rounded-2xl border bg-white p-6">
                <h2 className="text-sm text-slate-500">{label}</h2>
                <p className="mt-2 text-3xl font-black">
                  {key === 'orders' || key === 'units'
                    ? report[key]
                    : Number(report[key]).toLocaleString('es-PE', {
                        style: 'currency',
                        currency: 'PEN',
                      })}
                </p>
              </section>
            ))}
          </div>
        )
      )}
    </main>
  );
}
