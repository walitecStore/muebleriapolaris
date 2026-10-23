'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { csvCell, limaDate, type SalesPeriod } from '@/lib/sales-period';
import { createClient } from '@/lib/supabase/client';
type Report = {
  gross: number;
  refunds: number;
  net: number;
  paidOrders: number;
  average: number;
  pendingOrders: number;
  activeProducts: number;
  lowStock: number;
  customers: number;
  expiredReservations: number;
  range: { start: string; end: string };
  series: { date: string; amount: number; orders: number }[];
  topProducts: { product_id: string; name: string; quantity: number; amount: number }[];
};
const money = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);
const periods: [SalesPeriod, string][] = [
  ['day', 'Día'],
  ['week', 'Semana'],
  ['month', 'Mes'],
  ['year', 'Año'],
];
export default function StoreDashboard({ reports = false }: { reports?: boolean }) {
  const [period, setPeriod] = useState<SalesPeriod>('day'),
    [date, setDate] = useState(limaDate()),
    [report, setReport] = useState<Report | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0),
    [expiring, setExpiring] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError('');
    setReport(null);
    fetch(`/api/admin/report?period=${period}&date=${date}`, {
      signal: c.signal,
      cache: 'no-store',
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'No se pudo cargar el reporte.');
        return d as Report;
      })
      .then(setReport)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [period, date, refresh]);
  function exportCSV() {
    if (!report) return;
    const rows: unknown[][] = [
      ['Reporte de ventas PEN', period, date],
      ['Desde (inclusive)', report.range.start],
      ['Hasta (exclusivo)', report.range.end],
      ['Zona horaria', 'America/Lima'],
      ['Cobros aprobados', report.gross],
      ['Reembolsos registrados', report.refunds],
      ['Neto cobrado', report.net],
      ['Pedidos pagados', report.paidOrders],
      [],
      ['Fecha local', 'Cobros PEN', 'Pedidos'],
      ...report.series.map((r) => [r.date, r.amount, r.orders]),
      [],
      ['Producto', 'Unidades', 'Venta de artículos PEN'],
      ...report.topProducts.map((p) => [p.name, p.quantity, p.amount]),
    ];
    const blob = new Blob(['\ufeff' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ventas-${period}-${date}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function expire() {
    if (!confirm('¿Cancelar reservas sin pago de más de 24 horas y devolver su stock?')) return;
    setExpiring(true);
    try {
      const { error } = await createClient().rpc('expire_unpaid_reservations');
      if (error) throw error;
      setRefresh((x) => x + 1);
    } catch {
      setError('No se pudieron liberar las reservas.');
    } finally {
      setExpiring(false);
    }
  }
  const max = Math.max(1, ...(report?.series.map((r) => Number(r.amount)) || []));
  return (
    <main className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
            Administración · PEN · Perú
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {reports ? 'Ventas y estadísticas' : 'Tu tienda, bajo control'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Revisa tus cobros y organiza el trabajo del día.
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
        >
          ＋ Agregar producto
        </Link>
      </header>
      {!reports && (
        <Link
          href="/admin/guia"
          className="block rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold text-cyan-900"
        >
          ¿Por dónde empezar? Administrar productos, vendedores y pedidos →
        </Link>
      )}
      <section
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-4"
        aria-label="Filtro del reporte"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {periods.map(([key, label]) => (
              <button
                key={key}
                aria-pressed={period === key}
                onClick={() => setPeriod(key)}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${period === key ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="text-sm">
            Fecha de referencia
            <input
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              value={date}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
              className="ml-2 rounded-lg border px-3 py-2"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRefresh((x) => x + 1)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Actualizar
          </button>
          <button
            disabled={!report || loading}
            onClick={exportCSV}
            className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40"
          >
            Exportar CSV
          </button>
        </div>
      </section>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800"
        >
          {error}
          <button onClick={() => setRefresh((x) => x + 1)} className="ml-3 underline">
            Reintentar
          </button>
        </div>
      )}
      {loading && (
        <p role="status" className="rounded-2xl bg-white p-8 text-slate-500">
          Consultando ventas reales…
        </p>
      )}
      {report && !loading && (
        <>
          <p className="text-xs text-slate-500">
            {new Date(report.range.start).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}{' '}
            —{' '}
            {new Date(new Date(report.range.end).getTime() - 1).toLocaleDateString('es-PE', {
              timeZone: 'America/Lima',
            })}{' '}
            · Semanas de lunes a domingo. Cobros según la fecha de pago.
          </p>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Cobros aprobados', money(report.gross), 'Incluye envío; excluye pagos pendientes'],
              [
                'Neto cobrado',
                money(report.net),
                `${money(report.refunds)} en reembolsos del período`,
              ],
              ['Pedidos pagados', String(report.paidOrders), 'Con pago aprobado en el período'],
              ['Ticket promedio', money(report.average), 'Promedio de los cobros aprobados'],
            ].map(([title, value, detail]) => (
              <article key={title} className="rounded-2xl border bg-white p-5">
                <h2 className="text-sm font-semibold text-slate-500">{title}</h2>
                <p className="mt-4 text-3xl font-black tracking-tight">{value}</p>
                <p className="mt-2 text-xs text-slate-500">{detail}</p>
              </article>
            ))}
          </section>
          <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
            <article className="min-w-0 rounded-2xl border bg-white p-5">
              <h2 className="font-bold">Evolución de cobros</h2>
              <p className="mt-1 text-xs text-slate-500">
                Pagos aprobados por {period === 'day' ? 'hora' : period === 'year' ? 'mes' : 'día'},
                horario de Lima. No representa utilidad.
              </p>
              {report.paidOrders === 0 ? (
                <p className="py-16 text-center text-sm text-slate-500">
                  No hay pagos aprobados en este período.
                </p>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <div
                    role="img"
                    aria-label="Cobros por fecha. Detalle disponible en CSV."
                    className="flex h-52 items-end gap-1 border-b pb-2"
                    style={{ minWidth: Math.min(report.series.length * 12, 2200) }}
                  >
                    {report.series.map((row) => (
                      <div
                        key={row.date}
                        className="min-w-[4px] flex-1 rounded-t bg-cyan-500 hover:bg-cyan-700"
                        style={{ height: `${Math.max(1, (Number(row.amount) / max) * 100)}%` }}
                        title={`${row.date}: ${money(Number(row.amount))} (${row.orders} pedidos)`}
                      >
                        <span className="sr-only">
                          {row.date}: {money(Number(row.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-slate-500">
                    <span>{report.series[0]?.date}</span>
                    <span>{report.series.at(-1)?.date}</span>
                  </div>
                </div>
              )}
            </article>
            <article className="rounded-2xl bg-slate-950 p-5 text-white">
              <h2 className="font-bold">Por atender ahora</h2>
              <p className="mt-1 text-xs text-slate-400">
                Estado actual de la tienda, fuera del filtro de fechas.
              </p>
              <div className="mt-6 space-y-5">
                {[
                  ['Pagos pendientes', report.pendingOrders, '/admin/pedidos'],
                  ['Productos con stock ≤ 5', report.lowStock, '/admin/productos'],
                  ['Productos activos', report.activeProducts, '/admin/productos'],
                  ['Clientes registrados', report.customers, '/admin/clientes'],
                ].map(([label, count, href]) => (
                  <Link
                    key={String(label)}
                    href={String(href)}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="text-slate-300">{label}</span>
                    <strong>{count} ↗</strong>
                  </Link>
                ))}
              </div>
              {report.expiredReservations > 0 && (
                <button
                  disabled={expiring}
                  onClick={expire}
                  className="mt-6 w-full rounded-lg bg-amber-300 p-3 text-sm font-bold text-slate-950"
                >
                  {expiring
                    ? 'Liberando…'
                    : `Liberar ${report.expiredReservations} reservas vencidas`}
                </button>
              )}
            </article>
          </section>
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-bold">Productos más vendidos</h2>
            <p className="mt-1 text-xs text-slate-500">
              Artículos de pedidos pagados en el período, antes de devoluciones y sin envío.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="py-3">Producto</th>
                    <th>Unidades</th>
                    <th className="text-right">Venta de artículos</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProducts.map((p) => (
                    <tr key={p.product_id} className="border-b last:border-0">
                      <td className="py-4">
                        <Link
                          href={`/admin/productos/${p.product_id}`}
                          className="font-semibold hover:text-cyan-700"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td>{p.quantity}</td>
                      <td className="text-right">{money(Number(p.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!report.topProducts.length && (
                <p className="py-8 text-sm text-slate-500">
                  Aún no hay artículos vendidos en este período.
                </p>
              )}
            </div>
          </section>
          {!reports && (
            <section className="grid gap-4 sm:grid-cols-3">
              {[
                ['Gestionar productos', 'Precio, fotos y existencias', '/admin/productos'],
                ['Perfil de la tienda', 'Logo, contacto y políticas', '/admin/configuracion'],
                ['Configurar cobros', 'Yape, Plin y transferencia', '/admin/pagos'],
              ].map(([title, detail, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-2xl border bg-white p-5 hover:border-cyan-500"
                >
                  <h2 className="font-bold">{title} ↗</h2>
                  <p className="mt-1 text-sm text-slate-500">{detail}</p>
                </Link>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
