import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RealCatalog from '@/components/RealCatalog';
export default async function CategoryPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">
        <h1 className="sr-only">Productos por categoría</h1>
        <RealCatalog key={categoria} category={categoria} />
      </main>
      <Footer />
    </>
  );
}
