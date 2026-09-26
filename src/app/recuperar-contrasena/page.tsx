'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';

export default function PasswordRecoveryPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const { error: requestError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/restablecer-contrasena`,
    });
    setLoading(false);
    if (requestError) setError(requestError.message);
    else setSent(true);
  }
  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 px-4 pb-16 pt-28">
        <section className="mx-auto max-w-md rounded-3xl border border-border bg-white p-8 shadow-xl">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Cuenta Polaris</p>
          <h1 className="mt-2 text-3xl font-extrabold text-foreground">Recupera tu contrasena</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Te enviaremos un enlace seguro para crear una nueva contrasena.
          </p>
          {sent ? (
            <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              Revisa tu correo y sigue el enlace para continuar.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-primary"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                disabled={loading}
                className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          )}
          <Link
            href="/login"
            className="mt-6 block text-center text-sm font-bold text-primary hover:underline"
          >
            Volver a iniciar sesion
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
