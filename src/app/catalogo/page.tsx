import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RealCatalog from '@/components/RealCatalog';
export default function CatalogPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">
        <h1 className="sr-only">Catálogo de productos</h1>
        <RealCatalog />
      </main>
      <Footer />
    </>
  );
}
