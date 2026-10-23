import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RealCatalog from '@/components/RealCatalog';
export const dynamic = 'force-dynamic';
export default async function SellerStore({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) notFound();
  const { data, error } = await (await createClient()).rpc('seller_public_profile', { p_user: id });
  if (error || !data) notFound();
  return (
    <>
      <Header />
      <main className="min-h-screen pt-36">
        <section className="mx-auto max-w-7xl px-5 py-5">
          <p className="text-sm font-bold text-cyan-700">Vendedor en Polaris</p>
          <h1 className="mt-2 text-3xl font-black">{data.name}</h1>
          <p className="mt-3 max-w-3xl whitespace-pre-line text-slate-600">{data.bio}</p>
          <p className="mt-3 text-sm">
            Las entregas se coordinan según el tamaño de cada producto y las condiciones del pedido.
          </p>
        </section>
        <RealCatalog sellerId={id} />
      </main>
      <Footer />
    </>
  );
}
