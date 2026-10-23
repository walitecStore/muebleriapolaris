'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
type Category = { id: string; name: string; slug: string; description: string | null };
const blank = { name: '', slug: '', description: '' };
export default function Categories() {
  const [rows, setRows] = useState<Category[]>([]),
    [form, setForm] = useState(blank),
    [id, setId] = useState<string | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function load() {
    const { data, error } = await createClient()
      .from('categories')
      .select('id,name,slug,description')
      .order('name');
    if (error) setError('No se pudieron cargar las categorías.');
    else setRows(data || []);
  }
  useEffect(() => {
    void load();
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const payload = { ...form, name: form.name.trim(), slug: form.slug.trim() };
      if (!payload.name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug))
        throw new Error(
          'Usa un nombre y un identificador con letras minúsculas, números y guiones.'
        );
      const query = id
        ? createClient().from('categories').update(payload).eq('id', id)
        : createClient().from('categories').insert(payload);
      const { error } = await query;
      if (error) throw new Error('No se pudo guardar. Comprueba que el identificador sea único.');
      setId(null);
      setForm(blank);
      setMessage('Categoría guardada.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <h1 className="text-3xl font-black">Categorías</h1>
      <p className="text-sm text-slate-500">Organiza tus productos sin eliminar su historial.</p>
      <form onSubmit={save} className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">{id ? 'Editar categoría' : 'Nueva categoría'}</h2>
        {[
          ['name', 'Nombre'],
          ['slug', 'Identificador (ej. sofas-modulares)'],
          ['description', 'Descripción'],
        ].map(([k, label]) => (
          <label key={k} className="text-sm">
            {label}
            <input
              required={k !== 'description'}
              value={form[k as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              maxLength={300}
              className="mt-1 w-full rounded-lg border p-3"
            />
          </label>
        ))}
        <div className="flex items-end gap-3">
          <button disabled={busy} className="rounded-lg bg-slate-950 px-5 py-3 text-white">
            {busy ? 'Guardando…' : 'Guardar categoría'}
          </button>
          {id && (
            <button
              type="button"
              onClick={() => {
                setId(null);
                setForm(blank);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
      {error && (
        <p role="alert" className="text-rose-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-emerald-700">
          {message}
        </p>
      )}
      <div className="divide-y rounded-2xl border bg-white">
        {rows.map((r) => (
          <div key={r.id} className="flex justify-between gap-3 p-5">
            <div>
              <h2 className="font-bold">{r.name}</h2>
              <p className="text-sm text-slate-500">{r.slug}</p>
            </div>
            <button
              onClick={() => {
                setId(r.id);
                setForm({ name: r.name, slug: r.slug, description: r.description || '' });
              }}
              className="text-sm font-bold text-cyan-700"
            >
              Editar
            </button>
          </div>
        ))}
        {!rows.length && <p className="p-5 text-slate-500">No hay categorías para mostrar.</p>}
      </div>
    </main>
  );
}
