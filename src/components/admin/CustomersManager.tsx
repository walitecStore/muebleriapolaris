'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
type Customer = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
};
export default function CustomersManager() {
  const [rows, setRows] = useState<Customer[]>([]),
    [page, setPage] = useState(0),
    [count, setCount] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    createClient()
      .from('profiles')
      .select('id,full_name,email,phone,created_at', { count: 'exact' })
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .order('id')
      .range(page * 25, page * 25 + 24)
      .then(({ data, error, count }) => {
        if (!live) return;
        if (error) setError('No se pudieron cargar los clientes.');
        else {
          setRows(data || []);
          setCount(count || 0);
        }
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [page]);
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <h1 className="text-3xl font-black">Clientes</h1>
      <p className="text-sm text-slate-500">
        Datos de contacto y acceso a los pedidos de cada cliente.
      </p>
      {error && (
        <p role="alert" className="text-rose-700">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Cargando clientes…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr>
                {['Cliente', 'Teléfono', 'Registro', 'Pedidos'].map((h) => (
                  <th key={h} className="p-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-4">
                    <strong>{c.full_name || 'Sin nombre'}</strong>
                    <p className="text-slate-500">{c.email}</p>
                  </td>
                  <td className="p-4">{c.phone || '—'}</td>
                  <td className="p-4">
                    {new Date(c.created_at).toLocaleDateString('es-PE', {
                      timeZone: 'America/Lima',
                    })}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/admin/pedidos?cliente=${c.id}`}
                      className="font-bold text-cyan-700"
                    >
                      Ver pedidos →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="p-6 text-slate-500">No hay clientes para mostrar.</p>}
        </div>
      )}
      <div className="flex justify-between text-sm">
        <button
          disabled={page === 0 || loading}
          onClick={() => setPage((x) => x - 1)}
          className="rounded-lg border px-4 py-2 disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="p-2">
          {count} clientes · Página {page + 1}
        </span>
        <button
          disabled={(page + 1) * 25 >= count || loading}
          onClick={() => setPage((x) => x + 1)}
          className="rounded-lg border px-4 py-2 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </main>
  );
}
