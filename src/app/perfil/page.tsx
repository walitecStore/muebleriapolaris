'use client';
import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
type Profile = { full_name: string; phone: string; role: string };
export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile>({ full_name: '', phone: '', role: 'user' }),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [passwordMessage, setPasswordMessage] = useState(''),
    [changing, setChanging] = useState(false);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    const db = createClient();
    async function load() {
      try {
        const { data, error } = await db
          .from('profiles')
          .select('full_name,phone,role')
          .eq('id', user!.id)
          .single();
        if (error || !data) throw error;
        let phone = data.phone || '';
        if (!phone) {
          const legacy = await db
            .from('profiles')
            .select('telefono')
            .eq('id', user!.id)
            .maybeSingle();
          phone = legacy.data?.telefono || '';
        }
        if (live) {
          setProfile({ full_name: data.full_name || '', phone, role: data.role || 'user' });
          setError('');
        }
      } catch {
        if (live) setError('No pudimos cargar tu perfil. Recarga la página antes de guardar.');
      } finally {
        if (live) setLoading(false);
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [authLoading, user]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user || saving) return;
    setError('');
    setMessage('');
    if (!profile.full_name.trim() || profile.full_name.trim().length > 100) {
      setError('Escribe un nombre de entre 1 y 100 caracteres.');
      return;
    }
    if (profile.phone && !/^\+?[0-9 ()-]{7,25}$/.test(profile.phone)) {
      setError('Revisa el número de teléfono.');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await createClient()
        .from('profiles')
        .update({ full_name: profile.full_name.trim(), phone: profile.phone.trim() || null })
        .eq('id', user.id)
        .select('id')
        .single();
      if (error || !data) throw error;
      setMessage('Perfil guardado correctamente.');
    } catch {
      setError(
        'No se pudo guardar tu perfil. Tu nombre y teléfono no cambiaron; vuelve a intentar.'
      );
    } finally {
      setSaving(false);
    }
  }
  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (!user || changing) return;
    setPasswordMessage('');
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordMessage('Usa al menos 8 caracteres, una mayúscula y un número.');
      return;
    }
    if (password !== confirm) {
      setPasswordMessage('Las contraseñas no coinciden.');
      return;
    }
    setChanging(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      setPasswordMessage('Contraseña actualizada.');
      setPassword('');
      setConfirm('');
    } catch {
      setPasswordMessage(
        'No se pudo cambiar la contraseña. Comprueba tu sesión o usa Recuperar contraseña.'
      );
    } finally {
      setChanging(false);
    }
  }
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[80vh] max-w-3xl space-y-6 px-5 pb-16 pt-36">
        <div>
          <h1 className="text-3xl font-black">Mi Perfil</h1>
          <p className="mt-2 text-sm text-slate-600">
            Administra tu información y entra a tus paneles.
          </p>
        </div>
        {authLoading || loading ? (
          <p role="status">Cargando perfil…</p>
        ) : !user ? (
          <section className="rounded-3xl border bg-white p-6">
            <p>Inicia sesión para ver y editar tu perfil.</p>
            <Link
              href="/login?next=/perfil"
              className="mt-4 inline-block rounded-full bg-cyan-600 px-6 py-3 font-bold text-white"
            >
              Iniciar sesión
            </Link>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-teal-200 bg-white p-6">
              <h2 className="mb-5 text-xl font-bold">Información personal</h2>
              <form onSubmit={save} className="space-y-4">
                <label className="block text-sm font-semibold" htmlFor="profile-name">
                  Nombre completo
                </label>
                <input
                  id="profile-name"
                  required
                  maxLength={100}
                  autoComplete="name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full rounded-xl border border-teal-200 bg-teal-50 p-3"
                />
                <label className="block text-sm font-semibold" htmlFor="profile-email">
                  Correo electrónico
                </label>
                <input
                  id="profile-email"
                  type="email"
                  readOnly
                  value={user.email || ''}
                  className="w-full rounded-xl border bg-slate-100 p-3"
                />
                <label className="block text-sm font-semibold" htmlFor="profile-phone">
                  Teléfono
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full rounded-xl border border-teal-200 bg-teal-50 p-3"
                />
                {error && (
                  <p role="alert" className="text-sm text-rose-700">
                    {error}
                  </p>
                )}
                {message && (
                  <p role="status" className="text-sm text-emerald-700">
                    {message}
                  </p>
                )}
                <button
                  disabled={saving}
                  className="w-full rounded-full bg-cyan-600 py-3 font-bold text-white disabled:opacity-50"
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </form>
            </section>
            <section className="grid gap-4 sm:grid-cols-2" aria-label="Mis espacios">
              {[
                [
                  'Panel del dueño',
                  '/admin',
                  profile.role === 'admin'
                    ? 'Administrar toda la plataforma'
                    : 'Acceso exclusivo a la cuenta autorizada',
                ],
                ['Vender en Polaris', '/vender', 'Perfil, membresía y publicaciones'],
                ['Mis Pedidos', '/pedidos', 'Compras y entregas'],
                ['Mis Favoritos', '/favoritos', 'Productos guardados'],
                ['Mis Direcciones', '/direcciones', 'Destinos de entrega'],
                ['Instalar Polaris', '/instalar', 'Aplicación para móvil y PC'],
              ].map(([label, href, text]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-2xl border border-teal-200 bg-white p-5"
                >
                  <strong className="text-cyan-900">{label}</strong>
                  <p className="mt-1 text-xs text-slate-500">{text}</p>
                </Link>
              ))}
            </section>
            <form
              onSubmit={changePassword}
              className="space-y-4 rounded-3xl border border-teal-200 bg-white p-6"
            >
              <h2 className="text-xl font-bold">Cambiar contraseña</h2>
              <label htmlFor="new-profile-password" className="block text-sm">
                Nueva contraseña
              </label>
              <input
                id="new-profile-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
              <label htmlFor="confirm-profile-password" className="block text-sm">
                Repetir contraseña
              </label>
              <input
                id="confirm-profile-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
              <p className="text-xs text-slate-500">
                Mínimo 8 caracteres, una mayúscula y un número.
              </p>
              <button
                disabled={changing}
                className="w-full rounded-full bg-teal-900 py-3 font-bold text-white disabled:opacity-50"
              >
                {changing ? 'Actualizando…' : 'Cambiar contraseña'}
              </button>
              {passwordMessage && (
                <p role="status" className="text-sm">
                  {passwordMessage}
                </p>
              )}
              <Link
                href="/recuperar-contrasena"
                className="inline-block text-sm text-cyan-700 underline"
              >
                Recuperar contraseña
              </Link>
            </form>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
