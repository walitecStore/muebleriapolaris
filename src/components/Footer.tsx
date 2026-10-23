'use client';
import ReleaseInfo from '@/components/ReleaseInfo';
import Link from 'next/link';
import { useStore } from '@/contexts/StoreContext';
import { publicWebUrl, whatsappLink } from '@/lib/store-profile';
export default function Footer() {
  const store = useStore(),
    wa = whatsappLink(store.whatsapp);
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
        <section>
          <h2 className="text-xl font-black">{store.name}</h2>
          {store.description && <p className="mt-4 text-sm text-slate-400">{store.description}</p>}
          {store.tax_id && <p className="mt-3 text-sm text-slate-400">RUC: {store.tax_id}</p>}
          <div className="mt-5 flex gap-4">
            {[
              ['Instagram', store.instagram_url],
              ['Facebook', store.facebook_url],
            ]
              .filter(([, url]) => publicWebUrl(url))
              .map(([label, url]) => (
                <a
                  key={label}
                  href={publicWebUrl(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-300"
                >
                  {label}
                </a>
              ))}
          </div>
        </section>
        <nav
          aria-label="Información de la tienda"
          className="flex flex-col items-start gap-3 text-sm text-slate-300"
        >
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/politicas/envios">Envíos y cobertura</Link>
          <Link href="/politicas/devoluciones">Garantía y devoluciones</Link>
          <Link href="/politicas/privacidad">Privacidad</Link>
          <Link href="/politicas/terminos">Términos de compra</Link>
          {publicWebUrl(store.complaints_url) && (
            <a href={publicWebUrl(store.complaints_url)} target="_blank" rel="noopener noreferrer">
              Libro de Reclamaciones
            </a>
          )}
        </nav>
        <section className="space-y-3 text-sm text-slate-300">
          <h2 className="font-bold text-white">Contacto</h2>
          {store.address && (
            <p>
              {store.address}
              {store.city && `, ${store.city}`}
            </p>
          )}
          {store.hours && <p className="whitespace-pre-line">{store.hours}</p>}
          {store.phone && <p>{store.phone}</p>}
          {store.email && <p>{store.email}</p>}
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-emerald-300"
            >
              Escribir por WhatsApp ↗
            </a>
          )}
        </section>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {store.name}. Todos los derechos reservados.
      </div>
      <nav
        aria-label="Plataforma"
        className="mx-auto flex max-w-7xl flex-wrap gap-5 px-5 pb-8 text-sm"
      >
        <Link href="/acceso">Mi cuenta</Link>
        <Link href="/vender">Vender en Polaris</Link>
        <Link href="/instalar">Instalar aplicación</Link>
        <Link href="/ofertas">Ofertas</Link>
      </nav>
      <ReleaseInfo />
    </footer>
  );
}
