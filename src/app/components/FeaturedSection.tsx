'use client';

import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import { WhatsAppIcon } from '@/components/Header';
import { sofaProducts } from './catalogData';

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

export default function FeaturedSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-on-scroll').forEach((el, i) => {
              setTimeout(() => el.classList.add('revealed'), i * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="destacados" className="py-20 bg-background" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14 reveal-on-scroll">
          <span className="inline-block text-primary font-bold text-sm uppercase tracking-widest mb-3">Selección especial</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Sofás{' '}
            <span className="text-gradient-teal">Destacados</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Los modelos más populares de nuestra colección, elegidos por nuestros clientes.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((sofa, i) => (
            <div
              key={sofa.id}
              className={`reveal-on-scroll stagger-${i + 1} card-hover bg-card rounded-2xl overflow-hidden border border-border shadow-sm`}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                <AppImage
                  src={sofa.image}
                  alt={`${sofa.name} — sofá ${sofa.style.toLowerCase()} en color ${sofa.color.toLowerCase()}, ${sofa.seats}`}
                  fill
                  className="object-cover w-full h-full"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                    {sofa.style}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-foreground text-base leading-tight">{sofa.name}</h3>
                  <span
                    className="color-swatch shrink-0"
                    style={{ backgroundColor: colorMap[sofa.color] || '#ccc' }}
                    title={sofa.color}
                  />
                </div>
                <p className="text-muted-foreground text-sm mb-1">{sofa.seats}</p>
                <p className="text-muted-foreground text-xs mb-4 line-clamp-2">{sofa.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-extrabold text-primary">{sofa.price}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href={`#producto-${sofa.id}`}
                    className="block text-center px-4 py-2.5 border-2 border-primary text-primary font-bold text-sm rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  >
                    Ver Detalles
                  </a>
                  <a
                    href={`https://wa.me/15550000000?text=Hola%20Muebler%C3%ADa%20Polaris!%20Me%20interesa%20el%20sof%C3%A1%20${encodeURIComponent(sofa.name)}%2C%20%C2%BFpueden%20darme%20m%C3%A1s%20informaci%C3%B3n%3F`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white font-bold text-sm rounded-xl hover:bg-[#25D366]/90 transition-all duration-200"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    Comprar por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 reveal-on-scroll">
          <a
            href="#catalogo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 text-sm sm:text-base"
          >
            Ver catálogo completo
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}