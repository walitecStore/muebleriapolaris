'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardSidebar from '@/components/admin/DashboardSidebar';
import { createClient } from '@/lib/supabase/client';

type RequestRow = {
  id: string;
  order_id: string;
  request_type: string;
  quantity: number;
  reason: string;
  description: string | null;
  status: string;
  refund_amount: number;
  provider_refund_id: string | null;
  created_at: string;
};

export default function ReturnsAdminPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const { data, error: queryError } = await createClient()
      .from('return_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (queryError) setError(queryError.message);
    else setRows((data ?? []) as RequestRow[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: string, status: string) {
    const reference =
      status === 'refunded'
        ? window.prompt('Referencia real de confirmación del reembolso:')
        : null;
    if (status === 'refunded' && !reference?.trim()) return;
    const note = window.prompt('Nota administrativa (opcional):') || null;
    const { error } = await createClient().rpc('review_return_request', {
      p_request_id: id,
      p_status: status,
      p_admin_note: note,
      p_provider_refund_id: reference,
    });
    if (error) setError(error.message);
    else await load();
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-black">Devoluciones y reembolsos</h1>
        <p className="mt-2 text-slate-600">
          Aprobar no registra una devolución monetaria. “Reembolsado” exige una referencia de
          confirmación.
        </p>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
        <div className="mt-6 space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-black">Pedido {row.order_id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-slate-600">
                    {row.request_type} · {row.quantity} unidad(es) · S/{' '}
                    {Number(row.refund_amount).toFixed(2)}
                  </p>
                  <p className="mt-2">{row.reason}</p>
                  {row.description && <p className="text-sm text-slate-500">{row.description}</p>}
                </div>
                <strong>{row.status}</strong>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {['under_review', 'approved', 'rejected', 'refunded', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    disabled={row.status === status}
                    onClick={() => void review(row.id, status)}
                    className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
