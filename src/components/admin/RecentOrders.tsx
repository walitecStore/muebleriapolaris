'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Clock3, PackageCheck, Truck, CircleCheck, Package } from 'lucide-react';

import { getRecentOrders, type RecentOrder } from '@/lib/dashboardData';

const formatCurrency = (amount: number) => {
  return `S/ ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const normalizeStatus = (status: string) => {
  const value = status.toLowerCase();

  if (value.includes('entreg') || value.includes('complet')) {
    return 'Entregado';
  }

  if (value.includes('camino') || value.includes('enviado') || value.includes('envio')) {
    return 'En camino';
  }

  return 'Preparando';
};

const statusConfig = {
  Preparando: {
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock3,
  },

  'En camino': {
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Truck,
  },

  Entregado: {
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CircleCheck,
  },
};

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return 'CL';
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        const data = await getRecentOrders(5);

        if (mounted) {
          setOrders(data);
        }
      } catch (error) {
        console.error('Error cargando pedidos recientes:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <PackageCheck size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">Pedidos recientes</h2>

              <p className="text-sm text-slate-500">Últimos pedidos registrados</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="group flex items-center gap-2 text-sm font-bold text-cyan-600 transition hover:text-cyan-700"
        >
          Ver todos
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Cargando */}
      {loading && (
        <div className="flex items-center justify-center px-6 py-16">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500" />
            Cargando pedidos...
          </div>
        </div>
      )}

      {/* Sin pedidos */}
      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Package size={24} />
          </div>

          <h3 className="mt-4 font-bold text-slate-700">No hay pedidos recientes</h3>

          <p className="mt-1 text-sm text-slate-500">Los nuevos pedidos aparecerán aquí.</p>
        </div>
      )}

      {/* Tabla */}
      {!loading && orders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pedido
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cliente
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Producto
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Fecha
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Importe
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const status = normalizeStatus(order.status);

                const config = statusConfig[status];

                const StatusIcon = config.icon;

                return (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/70"
                  >
                    {/* Pedido */}
                    <td className="px-6 py-5">
                      <span className="font-mono text-xs font-bold text-slate-700" title={order.id}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>

                    {/* Cliente */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-black text-cyan-700">
                          {getInitials(order.customer)}
                        </div>

                        <span className="font-medium text-slate-700">{order.customer}</span>
                      </div>
                    </td>

                    {/* Producto */}
                    <td className="px-6 py-5">
                      <div>
                        <span className="text-sm font-medium text-slate-600">{order.product}</span>

                        {order.quantity > 0 && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            {order.quantity} {order.quantity === 1 ? 'unidad' : 'unidades'}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="px-6 py-5">
                      <span className="text-sm text-slate-500">{order.date}</span>
                    </td>

                    {/* Importe */}
                    <td className="px-6 py-5">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(order.amount)}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${config.className}`}
                      >
                        <StatusIcon size={14} />
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pie */}
      {!loading && orders.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <p className="text-sm text-slate-500">
            Mostrando los últimos <span className="font-bold text-slate-700">{orders.length}</span>{' '}
            pedidos
          </p>

          <div className="hidden items-center gap-2 text-xs text-emerald-600 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Datos de Supabase
          </div>
        </div>
      )}
    </section>
  );
}
