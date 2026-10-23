import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LegalContent from '@/components/LegalContent';
const types = ['privacidad', 'terminos', 'envios', 'devoluciones'];
export default async function PolicyPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (!types.includes(tipo)) notFound();
  return (
    <>
      <Header />
      <main className="min-h-screen px-5 pb-16 pt-32">
        <LegalContent type={tipo} />
      </main>
      <Footer />
    </>
  );
}
