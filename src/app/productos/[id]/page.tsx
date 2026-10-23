import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductDetail from '@/components/ProductDetail';
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="min-h-screen pt-32">
        <ProductDetail key={id} id={id} />
      </main>
      <Footer />
    </>
  );
}
