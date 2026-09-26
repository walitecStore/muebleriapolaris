'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contrasenas no coinciden.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (updateError) setError(updateError.message);
    else router.replace('/perfil');
  }
  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 px-4 pb-16 pt-28">
        <section className="mx-auto max-w-md rounded-3xl border border-border bg-white p-8 shadow-xl">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Seguridad</p>
          <h1 className="mt-2 text-3xl font-extrabold text-foreground">Nueva contrasena</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nueva contrasena"
              className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-primary"
            />
            <input
              type="password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Confirmar contrasena"
              className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-primary"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60"
            >
              {loading ? 'Actualizando...' : 'Guardar contrasena'}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
