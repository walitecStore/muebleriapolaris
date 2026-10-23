'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { useCart } from '@/app/components/CartContext';
type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  stock: number;
  category: string;
  category_id: string;
  isFeatured: boolean;
  description: string;
};
type Category = { id: string; name: string; slug: string };
export default function RealCatalog({
  featured = false,
  category,
}: {
  featured?: boolean;
  category?: string;
}) {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]),
    [categories, setCategories] = useState<Category[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [search, setSearch] = useState(''),
    [page, setPage] = useState(0),
    [more, setMore] = useState(false),
    [reload, setReload] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError('');
    fetch(
      `/api/products?active=true&page=${page}${featured ? '&featured=true' : ''}${category ? '&category=' + encodeURIComponent(category) : ''}`,
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
  }, [page, category, featured, reload]);
  const visible = products.filter((p) =>
    p.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
  );
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
            {featured
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
            aria-label="Buscar en los productos cargados"
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
              <article key={p.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <Link href={`/productos/${p.id}`} className="relative block h-56 bg-slate-100">
                  <AppImage
                    src={p.image}
                    alt={p.name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw"
                  />
                </Link>
                <div className="space-y-3 p-5">
                  <p className="text-xs text-slate-500">{p.category}</p>
                  <h3 className="font-bold">
                    <Link href={`/productos/${p.id}`}>{p.name}</Link>
                  </h3>
                  <p className="text-xl font-black">{p.price}</p>
                  <p className={`text-xs ${p.stock > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {p.stock > 0 ? 'Disponible' : 'Agotado'}
                  </p>
                  <button
                    disabled={p.stock < 1}
                    onClick={() =>
                      addItem({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        image: p.image,
                        alt: p.name,
                      })
                    }
                    className="w-full rounded-xl bg-slate-950 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {p.stock > 0 ? 'Agregar al carrito' : 'Sin existencias'}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!loading && !visible.length && (
            <p className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
              {search
                ? 'No hay coincidencias en los productos cargados.'
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
