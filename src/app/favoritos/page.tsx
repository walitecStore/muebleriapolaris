'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RealCatalog from '@/components/RealCatalog';
import { useFavorites } from '@/contexts/FavoritesContext';
export default function Favorites() {
  const { favorites, loading, error } = useFavorites();
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">
        <h1 className="sr-only">Favoritos</h1>
        {error && (
          <p role="alert" className="p-5 text-rose-700">
            {error}
          </p>
        )}
        {loading ? (
          <p className="p-10">Cargando favoritos…</p>
        ) : favorites.length ? (
          <RealCatalog favoriteIds={favorites} />
        ) : (
          <p className="p-10 text-center">
            Guarda productos con el corazón para encontrarlos aquí. Puedes hacerlo sin iniciar
            sesión.
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
