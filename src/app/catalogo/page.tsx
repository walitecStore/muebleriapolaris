import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RealCatalog from '@/components/RealCatalog';
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">
        <h1 className="sr-only">Catálogo de productos</h1>
        <RealCatalog searchTerm={typeof search === 'string' ? search.slice(0, 100) : ''} />
      </main>
      <Footer />
    </>
  );
}
