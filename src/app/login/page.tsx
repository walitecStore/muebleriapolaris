'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect home
  React.useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (err: any) {
      setError(
        err?.message === 'Invalid login credentials' ?'Correo o contraseña incorrectos.' : err?.message ||'Error al iniciar sesión.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-primary/10 border border-border p-8 sm:p-10">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <AppLogo size={52} />
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Iniciar sesión</h1>
              <p className="text-sm text-muted-foreground text-center">
                Bienvenido de vuelta a Mueblería Polaris
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-1.5">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">¿No tienes cuenta?</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Register link */}
            <Link
              href="/register"
              className="flex items-center justify-center w-full py-3 border-2 border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/5 hover:border-primary transition-all duration-200 text-sm"
            >
              Crear cuenta nueva
            </Link>

            {/* Back home */}
            <p className="text-center mt-5 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors font-medium">
                ← Volver al inicio
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
