'use client';
import { useEffect, useState } from 'react';
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
let deferredInstall: InstallEvent | null = null;
export default function InstallApp({ silent = false }: { silent?: boolean }) {
  const [event, setEvent] = useState<InstallEvent | null>(null),
    [installed, setInstalled] = useState(false);
  useEffect(() => {
    setEvent(deferredInstall);
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    const handler = (e: Event) => {
      e.preventDefault();
      deferredInstall = e as InstallEvent;
      setEvent(deferredInstall);
    };
    const done = () => {
      setInstalled(true);
      deferredInstall = null;
      setEvent(null);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', done);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', done);
    };
  }, []);
  if (silent) return null;
  return (
    <section className="rounded-3xl border bg-white p-6">
      <h2 className="text-xl font-bold">
        {installed ? 'Polaris ya está instalada' : 'Polaris en tu móvil y computadora'}
      </h2>
      <p className="my-4 text-slate-600">
        Abre la tienda desde tu pantalla de inicio. Tus pedidos y pagos necesitan conexión a
        internet.
      </p>
      {event && (
        <button
          onClick={async () => {
            await event.prompt();
            const choice = await event.userChoice;
            if (choice.outcome === 'accepted') setInstalled(true);
            deferredInstall = null;
            setEvent(null);
          }}
          className="rounded-full bg-cyan-600 px-6 py-3 font-bold text-white"
        >
          Instalar Polaris
        </button>
      )}
      {!event && !installed && (
        <ol className="list-inside list-decimal space-y-3 text-sm text-slate-700">
          <li>
            Android y PC: abre el menú de Chrome o Edge y elige «Instalar aplicación» o «Añadir a
            pantalla de inicio».
          </li>
          <li>iPhone/iPad: en Safari, pulsa Compartir → Añadir a pantalla de inicio.</li>
        </ol>
      )}
      <p className="mt-5 text-xs text-slate-500">
        La versión para Google Play se publicará cuando estén listas la cuenta de desarrollador, la
        verificación del dominio y la revisión de la tienda.
      </p>
    </section>
  );
}
