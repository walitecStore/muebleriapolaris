'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Address = {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip_code: string | null;
  country: string;
  is_default: boolean;
};
const initial = { label: 'Casa', street: '', city: '', state: '', zip_code: '', country: 'Peru' };

export default function AddressesPage() {
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await createClient()
      .from('addresses')
      .select('id,label,street,city,state,zip_code,country,is_default')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (queryError) setError(queryError.message);
    else setAddresses((data ?? []) as Address[]);
    setLoading(false);
  }, [user]);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    const isDefault = addresses.length === 0;
    const supabase = createClient();
    if (isDefault)
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    const { error: insertError } = await supabase
      .from('addresses')
      .insert({ user_id: user.id, ...form, is_default: isDefault });
    setSaving(false);
    if (insertError) setError(insertError.message);
    else {
      setForm(initial);
      await load();
    }
  }
  async function setDefault(id: string) {
    if (!user) return;
    const supabase = createClient();
    setError('');
    const { error: clearError } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
    const { error: setErrorResult } = clearError
      ? { error: clearError }
      : await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    if (setErrorResult) setError(setErrorResult.message);
    else await load();
  }
  async function remove(id: string) {
    const { error: deleteError } = await createClient().from('addresses').delete().eq('id', id);
    if (deleteError) setError(deleteError.message);
    else await load();
  }
  if (authLoading || loading)
    return (
      <>
        <Header />
        <main className="min-h-screen pt-28 text-center">Cargando direcciones...</main>
        <Footer />
      </>
    );
  if (!user)
    return (
      <>
        <Header />
        <main className="min-h-screen px-4 pt-32 text-center">
          <h1 className="text-3xl font-extrabold">Tus direcciones</h1>
          <p className="mt-3 text-muted-foreground">
            Inicia sesion para guardar direcciones de entrega.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground"
          >
            Iniciar sesion
          </Link>
        </main>
        <Footer />
      </>
    );
  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 px-4 pb-16 pt-28">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <section>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Cuenta Polaris
            </p>
            <h1 className="mt-2 text-3xl font-extrabold">Direcciones de entrega</h1>
            <div className="mt-6 space-y-3">
              {addresses.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border bg-white p-6 text-sm text-muted-foreground">
                  Aun no tienes direcciones guardadas.
                </p>
              ) : (
                addresses.map((address) => (
                  <article
                    key={address.id}
                    className="rounded-2xl border border-border bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex gap-2">
                          <h2 className="font-extrabold">{address.label}</h2>
                          {address.is_default && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {address.street}
                          <br />
                          {address.city}, {address.state}
                          <br />
                          {address.country} {address.zip_code ?? ''}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 text-xs font-bold">
                        <button
                          onClick={() => void setDefault(address.id)}
                          disabled={address.is_default}
                          className="text-primary disabled:text-muted-foreground"
                        >
                          Usar como principal
                        </button>
                        <button onClick={() => void remove(address.id)} className="text-red-600">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
          <section className="h-fit rounded-3xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold">Nueva direccion</h2>
            <form onSubmit={save} className="mt-5 space-y-3">
              {(['label', 'street', 'city', 'state', 'zip_code', 'country'] as const).map(
                (field) => (
                  <input
                    key={field}
                    required={field !== 'zip_code'}
                    value={form[field]}
                    onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                    placeholder={
                      {
                        label: 'Etiqueta: Casa, Oficina',
                        street: 'Direccion',
                        city: 'Ciudad',
                        state: 'Departamento / provincia',
                        zip_code: 'Codigo postal',
                        country: 'Pais',
                      }[field]
                    }
                    className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                )
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                disabled={saving}
                className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar direccion'}
              </button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
