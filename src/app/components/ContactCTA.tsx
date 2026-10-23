'use client';
import { useStore } from '@/contexts/StoreContext';
import { whatsappLink } from '@/lib/store-profile';
export default function ContactCTA() {
  const store = useStore(),
    wa = whatsappLink(store.whatsapp);
  return (
    <section id="contacto" className="bg-slate-50 px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
        <div>
          <p className="text-sm font-bold text-cyan-700">CONTÁCTANOS</p>
          <h2 className="mt-3 text-4xl font-black">Te ayudamos a elegir</h2>
          <p className="mt-4 text-slate-600">
            Consulta disponibilidad, materiales y opciones de entrega con nuestro equipo.
          </p>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white"
            >
              Escribir por WhatsApp
            </a>
          )}
        </div>
        <div className="space-y-3 rounded-2xl border bg-white p-6">
          <h3 className="text-xl font-bold">{store.name}</h3>
          {store.address && (
            <p>
              {store.address} {store.city}
            </p>
          )}
          {store.phone && <p>{store.phone}</p>}
          {store.email && <p>{store.email}</p>}
          {store.hours && (
            <p className="whitespace-pre-line text-sm text-slate-600">{store.hours}</p>
          )}
        </div>
      </div>
    </section>
  );
}
