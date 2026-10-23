'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
export default function DailyWheel() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false),
    [angle, setAngle] = useState(0),
    [message, setMessage] = useState('');
  async function spin() {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await createClient().rpc('claim_daily_coupon');
      if (error) throw error;
      const coupon = Array.isArray(data) ? data[0] : data;
      setAngle((a) => a + 1080 + (Number(coupon.amount) / 5 - 1) * 120);
      setTimeout(() => {
        localStorage.setItem('polaris_coupon', JSON.stringify(coupon));
        window.dispatchEvent(new Event('polaris:coupon'));
        setMessage(
          `Tu cupón de hoy: S/${coupon.amount}. Úsalo antes de ${new Date(coupon.expires_at).toLocaleString('es-PE')}. ${coupon.used_order_id ? 'Ya fue utilizado.' : 'Se guardó para el carrito.'}`
        );
        setBusy(false);
      }, 2200);
    } catch {
      setMessage('No se pudo obtener el cupón. Comprueba tu sesión y vuelve a intentar.');
      setBusy(false);
    }
  }
  return (
    <section
      id="ruleta"
      className="scroll-mt-24 bg-gradient-to-br from-cyan-950 to-teal-800 px-5 py-16 text-white"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
        <div className="relative mx-auto grid h-64 w-64 place-items-center">
          <div className="absolute -top-3 z-10 text-4xl text-amber-300">▼</div>
          <div
            style={{
              transform: `rotate(${angle}deg)`,
              background:
                'conic-gradient(#0891b2 0deg 120deg,#fbbf24 120deg 240deg,#14b8a6 240deg 360deg)',
              transition: 'transform 2.2s cubic-bezier(.15,.7,.2,1)',
            }}
            className="relative h-full w-full rounded-full border-8 border-white shadow-2xl"
          >
            <span className="absolute right-5 top-16 font-black text-slate-950">S/5</span>
            <span className="absolute bottom-10 left-24 font-black text-slate-950">S/10</span>
            <span className="absolute left-5 top-16 font-black text-slate-950">S/15</span>
          </div>
          <span className="absolute rounded-full bg-white p-5 font-black text-cyan-900">
            Polaris
          </span>
        </div>
        <div>
          <p className="font-bold uppercase tracking-widest text-amber-300">Un cupón cada día</p>
          <h2 className="mt-3 text-3xl font-black">Gira y descubre tu descuento</h2>
          <p className="my-5 text-sm leading-relaxed text-cyan-50">
            Cupones de S/5, S/10 o S/15, con la misma probabilidad. Mínimo S/150 en productos
            participantes de hasta S/60. Vigencia: 24 horas; un uso por cupón. Se aplica el mayor
            entre tu cupón y el descuento por monto, sin sumarlos.
          </p>
          {user ? (
            <button
              onClick={spin}
              disabled={busy}
              className="rounded-full bg-amber-300 px-8 py-3 font-black text-slate-950 disabled:opacity-60"
            >
              {busy ? 'Girando…' : 'Girar mi ruleta'}
            </button>
          ) : (
            <Link
              href="/login?next=/#ruleta"
              className="inline-block rounded-full bg-amber-300 px-8 py-3 font-black text-slate-950"
            >
              Ingresar para girar
            </Link>
          )}
          {message && (
            <p role="status" className="mt-4 rounded-xl bg-white/10 p-4 text-sm">
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
