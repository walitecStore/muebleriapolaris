'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Menu, X, Search, UserRound } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { useCart } from '@/app/components/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import GlobalSearch from '@/components/GlobalSearch';
import { useAuth } from '@/contexts/AuthContext';
const links = [
  ['Inicio', '/'],
  ['Catálogo', '/catalogo'],
  ['Ofertas', '/ofertas'],
  ['Ruleta', '/#ruleta'],
  ['Vender en Polaris', '/vender'],
  ['Instalar app', '/instalar'],
];
export default function Header() {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(false);
  const { openCart, totalItems } = useCart();
  const { favorites } = useFavorites();
  const { user } = useAuth();
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-teal-100 bg-white/95 text-slate-900 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Polaris, inicio">
            <AppLogo size={44} />
            <span className="text-2xl font-black tracking-tight text-cyan-950">Polaris</span>
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-4 2xl:flex">
            {links.map(([name, url]) => (
              <Link key={url} href={url} className="text-sm font-semibold hover:text-cyan-600">
                {name}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <button
              onClick={() => setSearch(true)}
              aria-label="Buscar productos"
              className="rounded-full p-2 hover:bg-cyan-50"
            >
              <Search size={21} />
            </button>
            <Link
              href="/favoritos"
              aria-label={`Favoritos, ${favorites.length}`}
              className="relative rounded-full p-2 hover:bg-cyan-50"
            >
              <Heart size={21} />
              {favorites.length > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1 text-[10px] text-white">
                  {favorites.length}
                </span>
              )}
            </Link>
            <button
              onClick={openCart}
              aria-label={`Carrito, ${totalItems} productos`}
              className="relative rounded-full p-2 hover:bg-cyan-50"
            >
              <ShoppingCart size={21} />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-cyan-600 px-1 text-[10px] text-white">
                  {totalItems}
                </span>
              )}
            </button>
            <Link
              href="/acceso"
              className="hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold sm:flex"
            >
              <UserRound size={17} />
              {user ? 'Mi cuenta' : 'Ingresar'}
            </Link>
            <button
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="rounded-full p-2 2xl:hidden"
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <nav
          aria-label="Paneles Polaris"
          className="flex items-center justify-center gap-4 overflow-x-auto border-t border-teal-100 bg-teal-50 px-3 py-2 text-xs font-bold sm:gap-7"
        >
          <Link href="/perfil" className="shrink-0 text-cyan-900">
            Mi Perfil
          </Link>
          <Link href="/admin" className="shrink-0 text-cyan-900">
            Panel del dueño
          </Link>
          <Link href="/vender" className="shrink-0 text-cyan-900">
            Vender
          </Link>
          <Link href="/instalar" className="shrink-0 text-cyan-900">
            Instalar app
          </Link>
        </nav>
        {open && (
          <nav
            aria-label="Menú móvil"
            className="grid max-h-[75vh] gap-1 overflow-y-auto border-t p-4 2xl:hidden"
          >
            {[
              ...links,
              ['Mis pedidos', '/pedidos'],
              ['Mi cuenta / Ingresar', '/acceso'],
              ['Panel del dueño', '/admin'],
              ['Instalar aplicación', '/instalar'],
            ].map(([name, url]) => (
              <Link
                key={url}
                href={url}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 font-semibold hover:bg-cyan-50"
              >
                {name}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <GlobalSearch open={search} onClose={() => setSearch(false)} />
    </>
  );
}
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.85 11.85 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9a11.82 11.82 0 0 0-3.42-8.42ZM12.05 21.8a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88Zm5.42-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.18-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.58-.35Z" />
    </svg>
  );
}
