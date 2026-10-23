'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
type Center = {
  district: string;
  active: boolean;
  automatic_shipping: boolean;
  center_reference_name: string;
  center_route_distance_km: number | null;
  base_shipping_price: number | null;
  before_center_adjustment: number;
  after_center_adjustment: number;
  center_tolerance_km: number;
  minimum_shipping_price: number;
  maximum_shipping_price: number | null;
};
const fields: [keyof Center, string][] = [
  ['center_route_distance_km', 'Distancia vial al centro (km, opcional)'],
  ['base_shipping_price', 'Tarifa base S/ (opcional)'],
  ['before_center_adjustment', 'Ajuste antes del centro S/'],
  ['after_center_adjustment', 'Ajuste después del centro S/'],
  ['center_tolerance_km', 'Tolerancia km'],
  ['minimum_shipping_price', 'Mínimo S/'],
  ['maximum_shipping_price', 'Máximo S/ (opcional)'],
];
export default function ShippingSettings() {
  const [rows, setRows] = useState<Center[]>([]),
    [selected, setSelected] = useState<Center | null>(null),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    createClient()
      .from('shipping_district_centers')
      .select('*')
      .order('district')
      .then(({ data, error }) => {
        if (error) setError('No se pudo consultar la cobertura. Aplica la migración de envíos.');
        else setRows(data || []);
      });
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError('');
    setMessage('');
    if (
      selected.maximum_shipping_price !== null &&
      selected.maximum_shipping_price < selected.minimum_shipping_price
    ) {
      setError('El máximo no puede ser menor que el mínimo.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await createClient()
        .from('shipping_district_centers')
        .update(selected)
        .eq('district', selected.district)
        .select('district')
        .single();
      if (error) throw error;
      setRows(rows.map((r) => (r.district === selected.district ? selected : r)));
      setMessage('Tarifa guardada.');
    } catch {
      setError('No se pudo guardar la tarifa. Revisa los importes.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <h1 className="text-3xl font-black">Tarifas y cobertura</h1>
      <p className="text-sm text-slate-500">
        Ajusta tus tarifas comerciales por distrito. El origen de entrega se modifica en{' '}
        <Link href="/admin/configuracion" className="underline">
          Perfil de la tienda
        </Link>
        . Una tarifa vacía usa calibración; no equivale a envío gratis.
      </p>
      <label className="block text-sm font-bold">
        Distrito
        <select
          value={selected?.district || ''}
          onChange={(e) => {
            setSelected(rows.find((r) => r.district === e.target.value) || null);
            setMessage('');
          }}
          className="mt-2 w-full rounded-lg border p-3"
        >
          <option value="">Selecciona un distrito</option>
          {rows.map((r) => (
            <option key={r.district}>{r.district}</option>
          ))}
        </select>
      </label>
      {selected && (
        <form onSubmit={save} className="space-y-5 rounded-2xl border bg-white p-5">
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.active}
              onChange={(e) => setSelected({ ...selected, active: e.target.checked })}
            />
            Distrito activo
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.automatic_shipping}
              onChange={(e) => setSelected({ ...selected, automatic_shipping: e.target.checked })}
            />
            Permitir envío calculado automáticamente
          </label>
          <label className="block text-sm">
            Referencia del centro operativo
            <input
              value={selected.center_reference_name}
              required
              onChange={(e) => setSelected({ ...selected, center_reference_name: e.target.value })}
              className="mt-1 w-full rounded-lg border p-3"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([key, label]) => (
              <label key={key} className="text-sm">
                {label}
                <input
                  type="number"
                  step="any"
                  value={String(selected[key] ?? '')}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      [key]: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  required={
                    ![
                      'base_shipping_price',
                      'maximum_shipping_price',
                      'center_route_distance_km',
                    ].includes(key)
                  }
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>
            ))}
          </div>
          <button
            disabled={busy}
            className="rounded-lg bg-slate-950 px-5 py-3 text-white disabled:opacity-50"
          >
            {busy ? 'Guardando…' : 'Guardar tarifa'}
          </button>
        </form>
      )}
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
    </main>
  );
}
