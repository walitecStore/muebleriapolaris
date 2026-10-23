'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  is_active: boolean;
  category_id: string | null;
  is_featured: boolean;
};
export default function ProductsManager({ sellerId }: { sellerId?: string }) {
  const base = sellerId ? '/vender/productos' : '/admin/productos';
  const [rows, setRows] = useState<Product[]>([]),
    [categories, setCategories] = useState<{ id: string; name: string }[]>([]),
    [category, setCategory] = useState(''),
    [stock, setStock] = useState('all'),
    [search, setSearch] = useState(''),
    [query, setQuery] = useState(''),
    [page, setPage] = useState(0),
    [count, setCount] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    createClient()
      .from('categories')
      .select('id,name')
      .order('name')
      .then(({ data }) => setCategories(data || []));
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    let q = createClient()
      .from('products')
      .select('id,name,sku,price,sale_price,stock,is_active,category_id,is_featured', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .order('id')
      .range(page * 24, page * 24 + 23);
    if (sellerId) q = q.eq('seller_id', sellerId);
    if (category) q = q.eq('category_id', category);
    if (stock === 'low') q = q.lte('stock', 5).eq('is_active', true);
    if (stock === 'empty') q = q.eq('stock', 0);
    if (stock === 'archived') q = q.eq('is_active', false);
    if (query.trim()) q = q.ilike('name', `%${query.trim().replace(/[%_]/g, '')}%`);
    q.then(({ data, error, count }) => {
      if (!live) return;
      if (error) setError('No se pudieron cargar los productos.');
      else {
        setRows(data || []);
        setCount(count || 0);
      }
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [category, stock, query, page, refresh, sellerId]);
  async function toggle(p: Product) {
    if (
      !confirm(
        p.is_active
          ? '¿Ocultar el producto de la tienda? Se conservará el historial.'
          : '¿Volver a publicar este producto?'
      )
    )
      return;
    const { error } = await createClient()
      .from('products')
      .update({ is_active: !p.is_active })
      .eq('id', p.id)
      .select('id')
      .single();
    if (error) setError('No se pudo cambiar la visibilidad.');
    else setRefresh((x) => x + 1);
  }
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Productos e inventario</h1>
          <p className="mt-2 text-sm text-slate-500">
            Edita tus productos y controla existencias sin borrar el historial.
          </p>
        </div>
        <Link
          href={`${base}/nuevo`}
          className="self-start rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
        >
          ＋ Agregar producto
        </Link>
      </header>
      <section className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4">
        <input
          aria-label="Buscar producto por nombre"
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 rounded-lg border p-3"
        />
        <select
          aria-label="Filtrar categoría"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border p-3"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar inventario"
          value={stock}
          onChange={(e) => {
            setStock(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border p-3"
        >
          <option value="all">Todo el inventario</option>
          <option value="low">Stock bajo (≤ 5)</option>
          <option value="empty">Agotados</option>
          <option value="archived">Ocultos</option>
        </select>
      </section>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">
          {error}
          <button onClick={() => setRefresh((x) => x + 1)} className="ml-3 underline">
            Reintentar
          </button>
        </p>
      )}
      {loading ? (
        <p role="status">Cargando inventario…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                {['Producto', 'Precio', 'Stock', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="p-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-4">
                    <Link href={`${base}/${p.id}`} className="font-bold text-cyan-800">
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {p.sku || 'Sin SKU'}
                      {p.is_featured ? ' · Destacado' : ''}
                    </p>
                  </td>
                  <td className="p-4">S/ {Number(p.sale_price ?? p.price).toFixed(2)}</td>
                  <td className={`p-4 font-bold ${p.stock <= 5 ? 'text-amber-700' : ''}`}>
                    {p.stock}
                  </td>
                  <td className="p-4">{p.is_active ? 'Publicado' : 'Oculto'}</td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      <Link href={`${base}/${p.id}`} className="font-bold text-cyan-700">
                        Editar
                      </Link>
                      <button onClick={() => void toggle(p)}>
                        {p.is_active ? 'Ocultar' : 'Publicar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="p-8 text-slate-500">No hay productos en esta selección.</p>
          )}
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <button
          disabled={page === 0 || loading}
          onClick={() => setPage((x) => x - 1)}
          className="rounded-lg border px-4 py-2 disabled:opacity-40"
        >
          Anterior
        </button>
        <span>
          {count} productos · Página {page + 1}
        </span>
        <button
          disabled={(page + 1) * 24 >= count || loading}
          onClick={() => setPage((x) => x + 1)}
          className="rounded-lg border px-4 py-2 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </main>
  );
}
