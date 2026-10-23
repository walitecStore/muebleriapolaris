import { redirect } from 'next/navigation';
import Link from 'next/link';
import OwnerBootstrap from '@/components/OwnerBootstrap';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getAdminSession } from '@/lib/server/admin';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Acceso del dueño | Polaris',
  robots: { index: false, follow: false },
};
export default async function OwnerAccess() {
  const { user, isAdmin } = await getAdminSession();
  if (!user) redirect('/login?next=/admin');
  if (isAdmin) redirect('/admin');
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[80vh] max-w-2xl px-5 pb-16 pt-36">
        <section className="space-y-5 rounded-3xl border border-teal-200 bg-white p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">
            Panel del dueño
          </p>
          <h1 className="text-3xl font-black">Tu cuenta aún no está autorizada como dueña</h1>
          <p>
            Ingresaste como <strong>{user.email}</strong>. La sesión es válida, pero esta cuenta no
            tiene el permiso para administrar toda la plataforma.
          </p>
          <p className="text-sm text-slate-600">
            La autorización del dueño se asigna de forma independiente. Una membresía de S/50
            habilita el panel de vendedor; no convierte una cuenta en dueña.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/perfil"
              className="rounded-full bg-cyan-600 px-5 py-3 font-bold text-white"
            >
              Volver a Mi Perfil
            </Link>
            <Link href="/vender" className="rounded-full border px-5 py-3 font-semibold">
              Panel del vendedor
            </Link>
          </div>
          <OwnerBootstrap userId={user.id} />
        </section>
      </main>
      <Footer />
    </>
  );
}
