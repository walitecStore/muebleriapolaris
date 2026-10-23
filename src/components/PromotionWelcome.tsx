'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import type { CatalogProduct } from '@/components/ProductCard';
type Offer = CatalogProduct & { salePriceValue: number | null; regularPriceValue: number };
export default function PromotionWelcome() {
  const [show, setShow] = useState(false),
    [product, setProduct] = useState<Offer | null>(null),
    [eligible, setEligible] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      fetch('/api/products?onSale=true', { signal: c.signal }).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/api/products?offers=true', { signal: c.signal }).then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([sales, offers]) => {
        const sale = sales?.products?.find(
          (p: Offer) => p.salePriceValue !== null && p.salePriceValue < p.regularPriceValue
        );
        setProduct(sale || offers?.products?.[0] || null);
        setEligible(!!offers?.products?.length);
        try {
          if (
            (sale || offers?.products?.length) &&
            !sessionStorage.getItem('polaris_offer_welcome')
          )
            setShow(true);
        } catch {
          /* Optional local session storage. */
        }
      })
      .catch(() => {});
    return () => c.abort();
  }, []);
  function close() {
    setShow(false);
    try {
      sessionStorage.setItem('polaris_offer_welcome', '1');
    } catch {
      /* Optional local session storage. */
    }
  }
  useEffect(() => {
    if (!show) return;
    closeButton.current?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [show]);
  if (!show || !product) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-5"
      onClick={close}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-title"
        className="relative max-h-[90vh] max-w-md overflow-y-auto rounded-3xl bg-white p-8 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButton}
          onClick={close}
          aria-label="Cerrar promoción"
          className="absolute right-4 top-3 p-2 text-xl"
        >
          ×
        </button>
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">Ofertas Polaris</p>
        <h2 id="offer-title" className="my-4 text-3xl font-black">
          {product.salePriceValue !== null && product.salePriceValue < product.regularPriceValue
            ? 'Dale un vistazo a esta oferta'
            : 'S/10 menos por cada S/150'}
        </h2>
        <p className="font-bold">{product.name}</p>
        <p className="my-3 text-2xl font-black text-cyan-600">{product.price}</p>
        {eligible && (
          <p className="mb-6 text-sm text-slate-600">
            También puedes armar una compra con productos participantes de hasta S/60: S/10 menos
            por cada S/150. No incluye envío; se aplica el descuento mayor sin acumular cupones.
          </p>
        )}
        <Link
          onClick={close}
          href={product.salePriceValue !== null ? '/productos/' + product.id : '/ofertas'}
          className="inline-block rounded-full bg-cyan-600 px-7 py-3 font-bold text-white"
        >
          {product.salePriceValue !== null ? 'Ver producto' : 'Ver productos en oferta'}
        </Link>
        <button onClick={close} className="mt-4 block w-full text-sm text-slate-500">
          Seguir explorando
        </button>
      </section>
    </div>
  );
}
