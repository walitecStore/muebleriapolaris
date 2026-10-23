'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard, { type CatalogProduct } from '@/components/ProductCard';
import { readSearches, HISTORY_KEY } from '@/lib/discovery';
export default function Discovery() {
  const [terms, setTerms] = useState<string[]>([]),
    [products, setProducts] = useState<CatalogProduct[]>([]);
  useEffect(() => {
    const refresh = () => setTerms(readSearches());
    refresh();
    window.addEventListener('polaris:searches', refresh);
    return () => window.removeEventListener('polaris:searches', refresh);
  }, []);
  const term = terms[0];
  useEffect(() => {
    if (!term) {
      setProducts([]);
      return;
    }
    const c = new AbortController();
    fetch('/api/products?search=' + encodeURIComponent(term), { signal: c.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setProducts(d?.products?.slice(0, 4) || []))
      .catch(() => {});
    return () => c.abort();
  }, [term]);
  if (!terms.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black">Inspirado en tus búsquedas</h2>
        <button
          onClick={() => {
            localStorage.removeItem(HISTORY_KEY);
            setTerms([]);
            setProducts([]);
          }}
          className="text-xs underline"
        >
          Borrar historial
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Se guarda únicamente en este navegador. Puedes borrarlo cuando quieras.
      </p>
      <div className="my-5 flex flex-wrap gap-2">
        {terms.map((t) => (
          <Link
            key={t}
            href={'/catalogo?search=' + encodeURIComponent(t)}
            className="rounded-full border px-3 py-2 text-sm"
          >
            {t}
          </Link>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
