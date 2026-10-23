import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RealCatalog from '@/components/RealCatalog';
export default function Offers() {
  return (
    <>
      <Header />
      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-5 pt-8">
          <h1 className="text-3xl font-black">Más productos, más ahorro</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Elige productos participantes de hasta S/60. Por cada S/150 acumulados, ahorra S/10:
            S/300 → S/20; S/450 → S/30. No incluye envío. Si usas un cupón de la ruleta, se aplica
            el descuento mayor; no se suman.
          </p>
        </div>
        <RealCatalog offers />
      </main>
      <Footer />
    </>
  );
}
