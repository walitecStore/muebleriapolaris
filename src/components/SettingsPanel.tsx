'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Theme = 'light' | 'dark' | 'auto';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<Theme>('auto');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [notifPromo, setNotifPromo] = useState(true);
  const [notifNuevos, setNotifNuevos] = useState(true);
  const [notifPedidos, setNotifPedidos] = useState(true);

  useEffect(() => {
    if (!user || !isOpen) return;
    const supabase = createClient();
    supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setTheme((data.theme as Theme) || 'auto');
        setNotifPromo(data.notif_promociones ?? true);
        setNotifNuevos(data.notif_nuevos_productos ?? true);
        setNotifPedidos(data.notif_estado_pedidos ?? true);
      }
    });
  }, [user, isOpen]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  async function saveSettings() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('settings').upsert(
      { user_id: user.id, theme, notif_promociones: notifPromo, notif_nuevos_productos: notifNuevos, notif_estado_pedidos: notifPedidos },
      { onConflict: 'user_id' }
    );
    setSaving(false);
    setSaveMsg('¡Guardado!');
    setTimeout(() => setSaveMsg(''), 2000);
  }

  async function handleSignOut() {
    await signOut();
    onClose();
    router.push('/');
  }

  const menuItems = [
    { icon: '👤', label: 'Mi Perfil', href: '/perfil' },
    { icon: '📦', label: 'Mis Pedidos', href: '/pedidos' },
    { icon: '❤️', label: 'Mis Favoritos', href: '/favoritos' },
    { icon: '📍', label: 'Direcciones', href: '/perfil#direcciones' },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]" onClick={onClose} aria-hidden="true" />
      )}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[90] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Panel de ajustes"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-lg font-extrabold text-foreground">Ajustes</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors" aria-label="Cerrar">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* User info */}
          {user ? (
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-extrabold text-lg">
                  {user.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{user.user_metadata?.full_name || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 border-b border-border">
              <Link href="/login" onClick={onClose} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all text-sm">
                Iniciar sesión
              </Link>
            </div>
          )}

          {/* Cuenta */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Cuenta</p>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-semibold text-foreground"
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                  <svg className="w-4 h-4 text-muted-foreground ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Apariencia */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Apariencia</p>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'auto'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold ${
                    theme === t ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg">{t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '🌓'}</span>
                  {t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Auto'}
                </button>
              ))}
            </div>
          </div>

          {/* Notificaciones */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Notificaciones</p>
            <div className="space-y-3">
              {[
                { label: 'Promociones', value: notifPromo, set: setNotifPromo },
                { label: 'Nuevos productos', value: notifNuevos, set: setNotifNuevos },
                { label: 'Estado de pedidos', value: notifPedidos, set: setNotifPedidos },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{n.label}</span>
                  <button
                    onClick={() => n.set(!n.value)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${n.value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    aria-label={`${n.label} ${n.value ? 'activado' : 'desactivado'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${n.value ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Seguridad */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Seguridad</p>
            <Link href="/perfil#seguridad" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-semibold text-foreground">
              <span>🔒</span> Cambiar contraseña
              <svg className="w-4 h-4 text-muted-foreground ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Información */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Información</p>
            <div className="space-y-1">
              <a href="/#contacto" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-semibold text-foreground">
                <span>📄</span> Política de privacidad
              </a>
              <a href="/#contacto" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-semibold text-foreground">
                <span>📋</span> Términos de uso
              </a>
              <a href="https://wa.me/51916832791" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-semibold text-foreground">
                <span>💬</span> Contacto
              </a>
            </div>
          </div>

          {/* Save + Logout */}
          <div className="px-5 py-4 space-y-2">
            {user && (
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all text-sm disabled:opacity-60"
              >
                {saving ? 'Guardando...' : saveMsg || 'Guardar preferencias'}
              </button>
            )}
            {user && (
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-all text-sm"
              >
                🚪 Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
