'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useStoreUpdates } from '@/hooks/useStoreUpdates';
import ProductCard, { type CatalogProduct as Product } from '@/components/ProductCard';
import { saveSearch } from '@/lib/discovery';
type Category = { id: string; name: string; slug: string };
export default function RealCatalog({
  featured = false,
  category,
  offers = false,
  searchTerm = '',
  favoriteIds,
  sellerId,
}: {
  featured?: boolean;
  category?: string;
  offers?: boolean;
  searchTerm?: string;
  favoriteIds?: string[];
  sellerId?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]),
    [categories, setCategories] = useState<Category[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [search, setSearch] = useState(searchTerm),
    [term, setTerm] = useState(searchTerm),
    [page, setPage] = useState(0),
    [more, setMore] = useState(false),
    [reload, setReload] = useState(0);
  const refreshCatalog = useCallback(() => {
    setPage(0);
    setReload((value) => value + 1);
  }, []);
  useStoreUpdates(refreshCatalog);
  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(search.trim());
      setPage(0);
      saveSearch(search);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError('');
    fetch(
      `/api/products?active=true&page=${page}${featured ? '&featured=true' : ''}${category ? '&category=' + encodeURIComponent(category) : ''}${offers ? '&offers=true' : ''}${term ? '&search=' + encodeURIComponent(term) : ''}${favoriteIds ? '&ids=' + favoriteIds.join(',') : ''}${sellerId ? '&seller=' + sellerId : ''}`,
      { signal: c.signal, cache: 'no-store' }
    )
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error('No pudimos cargar los productos. Inténtalo nuevamente.');
        return data;
      })
      .then((data) => {
        setProducts((p) => (page === 0 ? data.products : [...p, ...data.products]));
        setCategories(data.categories);
        setMore(data.hasMore === true);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [page, category, featured, reload, term, offers, favoriteIds, sellerId]);
  const visible = products;
  return (
    <section
      id={featured ? 'destacados' : 'catalogo'}
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6"
    >
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
            Colección Polaris
          </p>
          <h2 className="mt-2 text-3xl font-black">
            {offers
              ? 'Arma tu oferta: S/10 menos por cada S/150'
              : favoriteIds
                ? 'Tus favoritos'
                : featured
                  ? 'Productos destacados'
                  : categories.find((c) => c.slug === category)?.name || 'Nuestro catálogo'}
          </h2>
        </div>
        {featured ? (
          <Link href="/catalogo" className="font-bold text-cyan-700">
            Ver todo el catálogo →
          </Link>
        ) : (
          <input
            aria-label="Buscar productos"
            placeholder="Buscar producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border px-4 py-3"
          />
        )}
      </div>
      {!featured && (
        <nav aria-label="Categorías" className="mb-6 flex gap-2 overflow-x-auto">
          <Link
            href="/catalogo"
            className="whitespace-nowrap rounded-full border px-4 py-2 text-sm"
          >
            Todos
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/catalogo/${c.slug}`}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${category === c.slug ? 'bg-slate-950 text-white' : ''}`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}
      {error ? (
        <div role="alert" className="rounded-xl bg-rose-50 p-5 text-rose-800">
          {error}
          <button onClick={() => setReload((x) => x + 1)} className="ml-3 underline">
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {!loading && !visible.length && (
            <p className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
              {search
                ? 'No encontramos productos para esa búsqueda.'
                : 'No hay productos disponibles en esta selección.'}
            </p>
          )}
          {loading && (
            <p role="status" className="py-8 text-center text-slate-500">
              Cargando productos…
            </p>
          )}
          {more && !loading && (
            <button
              onClick={() => setPage((x) => x + 1)}
              className="mx-auto mt-8 block rounded-xl border px-6 py-3 font-semibold"
            >
              Cargar más productos
            </button>
          )}
        </>
      )}
    </section>
  );
}
