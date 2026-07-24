'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
}

export default function PerfilPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile>({ full_name: '', phone: null, avatar_url: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase.from('profiles').select('full_name, phone, avatar_url').eq('id', user.id).maybeSingle();
    if (data) setProfile({ full_name: data.full_name || '', phone: data.phone || '', avatar_url: data.avatar_url || null });
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.from('profiles').upsert(
      { id: user.id, full_name: profile.full_name, phone: profile.phone, email: user.email || '' },
      { onConflict: 'id' }
    );
    setSaving(false);
    if (err) { setError(err.message); } else { setMsg('¡Perfil guardado!'); setTimeout(() => setMsg(''), 2500); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { setPwMsg('La contraseña debe tener al menos 6 caracteres.'); return; }
    setChangingPw(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (err) { setPwMsg(err.message); } else { setPwMsg('¡Contraseña actualizada!'); setNewPassword(''); }
    setTimeout(() => setPwMsg(''), 3000);
  }

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-10 text-center shadow-xl">
            <div className="text-6xl mb-4">👤</div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">Mi Perfil</h1>
            <p className="text-muted-foreground mb-6">Inicia sesión para ver y editar tu perfil.</p>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all">
              Iniciar sesión
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-foreground mb-1">👤 Mi Perfil</h1>
            <p className="text-muted-foreground text-sm">Administra tu información personal</p>
          </div>

          {/* Profile form */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="font-extrabold text-foreground text-lg mb-5">Información personal</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Tu nombre completo"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-muted-foreground text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+51 999 999 999"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {msg && <p className="text-green-600 text-sm font-semibold">{msg}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>

          {/* Change password */}
          <div id="seguridad" className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="font-extrabold text-foreground text-lg mb-5">🔒 Cambiar contraseña</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              {pwMsg && <p className={`text-sm font-semibold ${pwMsg.includes('!') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>}
              <button
                type="submit"
                disabled={changingPw}
                className="w-full px-6 py-3 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-all disabled:opacity-60"
              >
                {changingPw ? 'Actualizando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/pedidos" className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:border-primary hover:shadow-sm transition-all">
              <span className="text-2xl">📦</span>
              <div>
                <p className="font-bold text-foreground text-sm">Mis Pedidos</p>
                <p className="text-xs text-muted-foreground">Ver historial</p>
              </div>
            </Link>
            <Link href="/favoritos" className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:border-primary hover:shadow-sm transition-all">
              <span className="text-2xl">❤️</span>
              <div>
                <p className="font-bold text-foreground text-sm">Mis Favoritos</p>
                <p className="text-xs text-muted-foreground">Ver guardados</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
