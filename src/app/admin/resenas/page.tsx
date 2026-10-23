'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
type Review = {
  id: string;
  name: string;
  rating: number;
  title: string;
  text: string;
  status: string;
  product_id: string;
  created_at: string;
};
export default function Reviews() {
  const [rows, setRows] = useState<Review[]>([]),
    [filter, setFilter] = useState('pending'),
    [page, setPage] = useState(0),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0),
    [busy, setBusy] = useState('');
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    createClient()
      .from('product_reviews')
      .select('id,name,rating,title,text,status,product_id,created_at')
      .eq('status', filter)
      .order('created_at', { ascending: false })
      .range(page * 20, page * 20 + 19)
      .then(({ data, error }) => {
        if (!live) return;
        if (error) setError('No se pudieron cargar las reseñas.');
        else setRows(data || []);
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [filter, page, refresh]);
  async function moderate(id: string, status: string) {
    setBusy(id);
    const { error } = await createClient()
      .from('product_reviews')
      .update({ status })
      .eq('id', id)
      .select('id')
      .single();
    if (error) setError('No se pudo actualizar la reseña.');
    else setRefresh((x) => x + 1);
    setBusy('');
  }
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <h1 className="text-3xl font-black">Reseñas de productos</h1>
      <p className="text-sm text-slate-500">Revisa los comentarios antes de hacerlos públicos.</p>
      <select
        aria-label="Estado de reseñas"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setPage(0);
        }}
        className="rounded-lg border p-3"
      >
        <option value="pending">Por revisar</option>
        <option value="published">Publicadas</option>
        <option value="rejected">Rechazadas</option>
      </select>
      {error && (
        <p role="alert" className="text-rose-700">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Cargando reseñas…</p>
      ) : (
        rows.map((r) => (
          <article key={r.id} className="space-y-3 rounded-2xl border bg-white p-5">
            <h2 className="font-bold">
              {r.title} · {r.rating}/5
            </h2>
            <p className="text-xs text-slate-500">
              {r.name} ·{' '}
              {new Date(r.created_at).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}
            </p>
            <p>{r.text}</p>
            <div className="flex gap-4">
              {filter !== 'published' && (
                <button
                  disabled={busy === r.id}
                  onClick={() => void moderate(r.id, 'published')}
                  className="text-sm font-bold text-emerald-700"
                >
                  Publicar
                </button>
              )}
              {filter !== 'rejected' && (
                <button
                  disabled={busy === r.id}
                  onClick={() => void moderate(r.id, 'rejected')}
                  className="text-sm text-rose-700"
                >
                  Rechazar
                </button>
              )}
            </div>
          </article>
        ))
      )}
      {!loading && !rows.length && (
        <p className="text-slate-500">No hay reseñas en esta selección.</p>
      )}
      <div className="flex justify-between">
        <button
          disabled={page === 0 || loading}
          onClick={() => setPage((x) => x - 1)}
          className="rounded-lg border p-3 disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          disabled={rows.length < 20 || loading}
          onClick={() => setPage((x) => x + 1)}
          className="rounded-lg border p-3 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </main>
  );
}
