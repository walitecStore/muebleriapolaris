'use client';

import Link from 'next/link';
import {
  Plus,
  ShoppingCart,
  Gift,
  BarChart3,
  Package,
  Users,
  ArrowUpRight,
} from 'lucide-react';

const actions = [
  {
    title: 'Nuevo producto',
    description: 'Agregar un artículo al catálogo',
    href: '/admin/productos/nuevo',
    icon: Plus,
    color: 'cyan',
  },
  {
    title: 'Nuevo pedido',
    description: 'Registrar y gestionar pedidos',
    href: '/admin/pedidos/nuevo',
    icon: ShoppingCart,
    color: 'orange',
  },
  {
    title: 'Nueva promoción',
    description: 'Crear una oferta especial',
    href: '/admin/promociones/nueva',
    icon: Gift,
    color: 'pink',
  },
  {
    title: 'Estadísticas',
    description: 'Analizar ventas y rendimiento',
    href: '/admin/estadisticas',
    icon: BarChart3,
    color: 'purple',
  },
  {
    title: 'Gestionar productos',
    description: 'Editar inventario y catálogo',
    href: '/admin/productos',
    icon: Package,
    color: 'emerald',
  },
  {
    title: 'Ver clientes',
    description: 'Consultar clientes registrados',
    href: '/admin/clientes',
    icon: Users,
    color: 'blue',
  },
];

const colorClasses = {
  cyan: {
    icon: 'bg-cyan-50 text-cyan-600',
    hover: 'group-hover:bg-cyan-100',
  },
  orange: {
    icon: 'bg-orange-50 text-orange-600',
    hover: 'group-hover:bg-orange-100',
  },
  pink: {
    icon: 'bg-pink-50 text-pink-600',
    hover: 'group-hover:bg-pink-100',
  },
  purple: {
    icon: 'bg-purple-50 text-purple-600',
    hover: 'group-hover:bg-purple-100',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600',
    hover: 'group-hover:bg-emerald-100',
  },
  blue: {
    icon: 'bg-blue-50 text-blue-600',
    hover: 'group-hover:bg-blue-100',
  },
};

export default function QuickActions() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">
          Acciones rápidas
        </h2>

        <p className="text-sm text-slate-500">
          Accede rápidamente a las funciones principales
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const colors =
            colorClasses[action.color as keyof typeof colorClasses];

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.icon} ${colors.hover} transition-colors`}
              >
                <Icon size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  {action.title}
                </p>

                <p className="truncate text-xs text-slate-400">
                  {action.description}
                </p>
              </div>

              <ArrowUpRight
                size={15}
                className="shrink-0 text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-500"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}