import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSellerSession } from '@/lib/server/seller';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi tienda | Polaris', robots: { index: false, follow: false } };
export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSellerSession();
  if (!user) redirect('/login?next=/vender');
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white px-5 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <Link className="text-2xl font-black text-cyan-900" href="/">
            Polaris
          </Link>
          <nav aria-label="Mi tienda" className="flex flex-wrap gap-4 text-sm font-semibold">
            {[
              ['Perfil y membresía', '/vender'],
              ['Mis productos', '/vender/productos'],
              ['Ventas y entregas', '/vender/pedidos'],
              ['Estadísticas', '/vender/estadisticas'],
              ['Crear anuncios', '/vender/anuncios'],
              ['Mi cuenta', '/perfil'],
            ].map(([label, url]) => (
              <Link key={url} href={url}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
