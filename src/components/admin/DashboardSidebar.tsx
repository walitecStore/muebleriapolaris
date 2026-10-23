'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Undo2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  CreditCard,
  MapPin,
  Store,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
const menu = [
  ['Resumen', '/admin', LayoutDashboard],
  ['Productos', '/admin/productos', Package],
  ['Categorías', '/admin/categorias', FolderTree],
  ['Reseñas', '/admin/resenas', Users],
  ['Pedidos', '/admin/pedidos', ShoppingCart],
  ['Devoluciones', '/admin/devoluciones', Undo2],
  ['Vendedores y membresías', '/admin/vendedores', Users],
  ['Clientes', '/admin/clientes', Users],
  ['Ventas y reportes', '/admin/estadisticas', BarChart3],
  ['Medios de pago', '/admin/pagos', CreditCard],
  ['Tarifas de envío', '/admin/envios', MapPin],
  ['Perfil de la tienda', '/admin/configuracion', Settings],
] as const;
export default function DashboardSidebar() {
  const path = usePathname(),
    router = useRouter();
  const { signOut } = useAuth();
  const [error, setError] = useState(''),
    [leaving, setLeaving] = useState(false);
  async function logout() {
    setLeaving(true);
    try {
      await signOut();
      router.replace('/login');
      router.refresh();
    } catch {
      setError('No se pudo cerrar la sesión. Reintenta.');
      setLeaving(false);
    }
  }
  return (
    <aside className="bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto">
      <Link href="/admin" className="flex items-center gap-3 border-b border-white/10 p-5">
        <span className="rounded-xl bg-cyan-400 p-2 text-slate-950">
          <Store size={24} />
        </span>
        <span className="font-black">
          Polaris
          <span className="block text-xs font-normal text-slate-400">Control de tu tienda</span>
        </span>
      </Link>
      <nav aria-label="Administración" className="flex gap-1 overflow-x-auto p-3 lg:flex-col">
        {menu.map(([label, href, Icon]) => (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${path === href || (href !== '/admin' && path.startsWith(href + '/')) ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex gap-4 border-t border-white/10 p-4 lg:flex-col">
        <Link className="text-sm text-slate-300" href="/">
          Ver mi tienda ↗
        </Link>
        <button
          onClick={logout}
          disabled={leaving}
          className="flex items-center gap-2 text-sm text-rose-300 disabled:opacity-50"
        >
          <LogOut size={16} />
          {leaving ? 'Cerrando…' : 'Cerrar sesión'}
        </button>
        {error && (
          <p role="alert" className="text-xs text-rose-300">
            {error}
          </p>
        )}
      </div>
    </aside>
  );
}
