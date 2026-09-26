'use client';

import { Bell, Search, Settings } from 'lucide-react';

export default function DashboardHeader() {
  const hour = new Date().getHours();

  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const today = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-3xl font-black text-slate-900">{greeting}, Wualdir 👋</h1>

        <p className="mt-1 text-slate-500 capitalize">{today}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            placeholder="Buscar productos, pedidos..."
            className="
              w-80
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              py-3
              pl-11
              pr-4
              outline-none
              transition
              focus:border-cyan-500
              focus:bg-white
            "
          />
        </div>

        <button className="relative rounded-xl bg-slate-100 p-3 transition hover:bg-slate-200">
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500"></span>
        </button>

        <button className="rounded-xl bg-slate-100 p-3 transition hover:bg-slate-200">
          <Settings size={20} />
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-600 font-bold text-white">
            WE
          </div>

          <div className="hidden md:block">
            <p className="font-semibold">Wualdir Espinoza</p>

            <p className="text-xs text-slate-500">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  );
}
