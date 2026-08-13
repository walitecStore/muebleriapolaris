'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  CalendarDays,
} from 'lucide-react';

import {
  getSalesChartData,
  type SalesChartData,
} from '@/lib/dashboardData';

const formatCurrency = (value: number) => {
  return `S/ ${value.toLocaleString('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export default function SalesChart() {
  const [salesData, setSalesData] = useState<
    SalesChartData[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSales() {
      try {
        const data = await getSalesChartData();

        if (mounted) {
          setSalesData(data);
        }
      } catch (error) {
        console.error(
          'Error cargando gráfico de ventas:',
          error,
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSales();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Ventas acumuladas del año
   */
  const totalSales = useMemo(() => {
    return salesData.reduce(
      (total, item) => total + Number(item.sales || 0),
      0,
    );
  }, [salesData]);

  /*
   * Mes actual y mes anterior
   */
  const currentMonthIndex = new Date().getMonth();

  const currentMonthSales =
    salesData[currentMonthIndex]?.sales ?? 0;

  const previousMonthSales =
    currentMonthIndex > 0
      ? salesData[currentMonthIndex - 1]?.sales ?? 0
      : 0;

  /*
   * Crecimiento respecto al mes anterior
   */
  const growth =
    previousMonthSales > 0
      ? ((currentMonthSales - previousMonthSales) /
          previousMonthSales) *
        100
      : currentMonthSales > 0
        ? 100
        : 0;

  const isPositive = growth >= 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
            <TrendingUp size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Ventas
            </h2>

            <p className="text-sm text-slate-500">
              Rendimiento de ventas durante el año
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
        >
          <CalendarDays size={17} />
          Este año
        </button>
      </div>

      {/* Resumen */}
      <div className="mb-6 mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Ventas acumuladas
          </p>

          <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
            {loading
              ? 'Cargando...'
              : formatCurrency(totalSales)}
          </p>
        </div>

        {!loading && (
          <>
            <div
              className={`mb-1 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {isPositive ? (
                <TrendingUp size={15} />
              ) : (
                <TrendingDown size={15} />
              )}

              {isPositive ? '+' : ''}
              {growth.toFixed(1)}%
            </div>

            <p className="mb-1 text-sm text-slate-400">
              vs. mes anterior
            </p>
          </>
        )}
      </div>

      {/* Gráfico */}
      <div className="h-[320px] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500" />

              Cargando ventas...
            </div>
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={salesData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="salesGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#06b6d4"
                    stopOpacity={0.28}
                  />

                  <stop
                    offset="100%"
                    stopColor="#06b6d4"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#64748b',
                  fontSize: 12,
                }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#64748b',
                  fontSize: 12,
                }}
                tickFormatter={(value) =>
                  `S/${Number(value) / 1000}k`
                }
                width={55}
              />

              <Tooltip
                cursor={{
                  stroke: '#06b6d4',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
                contentStyle={{
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow:
                    '0 10px 30px rgba(15, 23, 42, 0.10)',
                  padding: '12px 14px',
                }}
                labelStyle={{
                  color: '#0f172a',
                  fontWeight: 700,
                  marginBottom: 4,
                }}
                formatter={(value) => [
                  formatCurrency(Number(value)),
                  'Ventas',
                ]}
              />

              <Area
                type="monotone"
                dataKey="sales"
                stroke="#0891b2"
                strokeWidth={3}
                fill="url(#salesGradient)"
                activeDot={{
                  r: 6,
                  strokeWidth: 3,
                  stroke: '#ffffff',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie inferior */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />

          <span className="text-sm text-slate-500">
            Ventas mensuales
          </span>
        </div>

        <span className="text-sm font-semibold text-slate-700">
          Datos actualizados desde Supabase
        </span>
      </div>
    </section>
  );
}