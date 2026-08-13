'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { sofaProducts } from './catalogData';
import { useCart } from './CartContext';

const featured = sofaProducts.slice(0, 4);

const colorMap: Record<string, string> = {
  Gris: '#9ca3af',
  Beige: '#d2b48c',
  Azul: '#3b82f6',
  Verde: '#22c55e',
  Rojo: '#ef4444',
  Negro: '#1f2937',
  Blanco: '#f9fafb',
};

function ProductCard({
  sofa,
  index,
}: {
  sofa: (typeof sofaProducts)[0];
  index: number;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    for (let i = 0; i < qty; i += 1) {
      addItem({
        id: String(sofa.id),
        name: sofa.name,
        price: sofa.price,
        image: sofa.image,
        alt: `${sofa.name} — sofá ${sofa.style.toLowerCase()} en color ${sofa.color.toLowerCase()}`,
      });
    }

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1800);
  }

  return (
    <article
      className={`reveal-on-scroll stagger-${index + 1} card-hover bg-card rounded-2xl overflow-hidden border border-border shadow-sm flex flex-col`}
    >
      {/* Imagen */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <Link
          href={`/productos/${sofa.id}`}
          aria-label={`Ver detalles de ${sofa.name}`}
          className="block h-full w-full"
        >
          <AppImage
            src={sofa.image}
            alt={`${sofa.name} — sofá ${sofa.style.toLowerCase()} en color ${sofa.color.toLowerCase()}, ${sofa.seats}`}
            fill
            className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </Link>

        <div className="absolute top-3 left-3">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {sofa.style}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span className="bg-white/95 backdrop-blur-sm text-foreground text-[10px] font-extrabold px-2.5 py-1.5 rounded-full shadow-sm">
            ⭐ Destacado
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <Link
            href={`/productos/${sofa.id}`}
            className="min-w-0 hover:text-primary transition-colors"
          >
            <h3 className="font-bold text-foreground text-base leading-tight line-clamp-2">
              {sofa.name}
            </h3>
          </Link>

          <span
            className="color-swatch shrink-0 mt-0.5"
            style={{ backgroundColor: colorMap[sofa.color] || '#ccc' }}
            title={`Color: ${sofa.color}`}
            aria-label={`Color ${sofa.color}`}
          />
        </div>

        <p className="text-muted-foreground text-sm mb-1">
          {sofa.seats}
        </p>

        <p className="text-muted-foreground text-xs mb-4 line-clamp-2">
          {sofa.description}
        </p>

        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-xl font-extrabold text-primary">
            {sofa.price}
          </span>

          {Number(sofa.rating ?? 0) > 0 && (
            <span className="text-xs font-bold text-foreground">
              ⭐ {Number(sofa.rating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Selector de cantidad */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground font-medium">
            Cantidad:
          </span>

          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-2.5 py-1 text-foreground hover:bg-muted transition-colors text-sm font-bold"
              aria-label="Reducir cantidad"
            >
              −
            </button>

            <span className="px-3 py-1 text-sm font-bold text-foreground border-x border-border min-w-[2rem] text-center">
              {qty}
            </span>

            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="px-2.5 py-1 text-foreground hover:bg-muted transition-colors text-sm font-bold"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
        </div>

        {/* Acciones: sin WhatsApp */}
        <div className="grid grid-cols-1 gap-2 mt-auto">
          <button
            type="button"
            onClick={handleAdd}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition-all duration-200 ${
              added
                ? 'bg-green-500 text-white'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            aria-label={`Agregar ${qty} unidad${qty !== 1 ? 'es' : ''} de ${sofa.name} al carrito`}
          >
            {added ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                ¡Agregado!
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Agregar al carrito
              </>
            )}
          </button>

          <Link
            href={`/productos/${sofa.id}`}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-primary text-primary font-bold text-sm rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Ver detalles
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function FeaturedSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target
              .querySelectorAll('.reveal-on-scroll')
              .forEach((el, i) => {
                window.setTimeout(() => {
                  el.classList.add('revealed');
                }, i * 100);
              });

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="destacados"
      className="py-20 bg-background"
      ref={ref}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Encabezado */}
        <div className="text-center mb-14 reveal-on-scroll">
          <span className="inline-block text-primary font-bold text-sm uppercase tracking-widest mb-3">
            Selección especial
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Sofás{' '}
            <span className="text-gradient-teal">
              Destacados
            </span>
          </h2>

          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Los modelos más populares de nuestra colección, elegidos por
            nuestros clientes.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((sofa, i) => (
            <ProductCard
              key={sofa.id}
              sofa={sofa}
              index={i}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 reveal-on-scroll">
          <Link
            href="#catalogo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 text-sm sm:text-base"
          >
            Ver catálogo completo

            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}