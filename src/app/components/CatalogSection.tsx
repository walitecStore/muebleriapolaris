'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { WhatsAppIcon } from '@/components/Header';
import {
  sofaProducts,
  styleOptions,
  colorOptions,
  seatsOptions,
  colorMap,
  type SofaProduct,
} from './catalogData';
import { useAutoColor } from './useAutoColor';
import { useCart } from './CartContext';

export default function CatalogSection() {
  const [activeStyles, setActiveStyles] = useState<string[]>([]);
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [activeSeats, setActiveSeats] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const toggleFilter = (
    value: string,
    arr: string[],
    setArr: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const clearAll = () => {
    setActiveStyles([]);
    setActiveColors([]);
    setActiveSeats([]);
  };

  const filtered = sofaProducts.filter((s) => {
    const styleOk = activeStyles.length === 0 || activeStyles.includes(s.style);
    const colorOk = activeColors.length === 0 || activeColors.includes(s.color);
    const seatsOk = activeSeats.length === 0 || activeSeats.includes(s.seats);
    return styleOk && colorOk && seatsOk;
  });

  const hasFilters = activeStyles.length > 0 || activeColors.length > 0 || activeSeats.length > 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.catalog-card').forEach((el, i) => {
              const card = el as HTMLElement;
              card.style.transitionDelay = `${i * 60}ms`;
              card.classList.add('revealed');
            });
          }
        });
      },
      { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="catalogo" className="py-20 bg-muted/30" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-primary font-bold text-sm uppercase tracking-widest mb-3">Todos los modelos</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Catálogo <span className="text-gradient-teal">Completo</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Filtra por estilo, color o número de plazas para encontrar el sofá perfecto.
          </p>
          <div className="mt-6">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-4 rounded-full text-base font-extrabold hover:bg-primary/90 transition-all duration-200 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5"
            >
              🛋️ Ver Catálogo por Categorías
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 mb-10 shadow-sm">
          {/* Style filters */}
          <div className="mb-5">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Estilo</div>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleFilter(s, activeStyles, setActiveStyles)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                    activeStyles.includes(s)
                      ? 'filter-btn-active shadow-md'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary bg-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color filters */}
          <div className="mb-5">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Color</div>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleFilter(c, activeColors, setActiveColors)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                    activeColors.includes(c)
                      ? 'filter-btn-active shadow-md'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary bg-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300 shrink-0"
                    style={{ backgroundColor: colorMap[c] }}
                  />
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Seats filters */}
          <div className="mb-5">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Plazas</div>
            <div className="flex flex-wrap gap-2">
              {seatsOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleFilter(s, activeSeats, setActiveSeats)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                    activeSeats.includes(s)
                      ? 'filter-btn-active shadow-md'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary bg-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Active chips + clear */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground font-medium">Filtros activos:</span>
              {[...activeStyles, ...activeColors, ...activeSeats].map((chip) => (
                <span
                  key={chip}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  {chip}
                  <button
                    onClick={() => {
                      if (activeStyles.includes(chip)) toggleFilter(chip, activeStyles, setActiveStyles);
                      else if (activeColors.includes(chip)) toggleFilter(chip, activeColors, setActiveColors);
                      else if (activeSeats.includes(chip)) toggleFilter(chip, activeSeats, setActiveSeats);
                    }}
                    className="hover:text-primary/60 transition-colors ml-0.5"
                    aria-label={`Quitar filtro ${chip}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-2 transition-colors"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground text-sm font-medium">
            Mostrando <span className="font-bold text-foreground">{filtered.length}</span> de {sofaProducts.length} modelos
          </p>
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🛋️</div>
            <p className="text-foreground font-bold text-xl mb-2">No encontramos modelos</p>
            <p className="text-muted-foreground text-sm mb-6">Prueba combinando otros filtros</p>
            <button
              onClick={clearAll}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-colors"
            >
              Ver todos los sofás
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((sofa) => (
              <CatalogCard key={sofa.id} sofa={sofa} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CatalogCard({ sofa }: { sofa: SofaProduct }) {
  const [liked, setLiked] = useState(false);
  const { color: autoColor, loading: colorLoading } = useAutoColor(sofa.image);
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      id: String(sofa.id),
      name: sofa.name,
      price: sofa.price,
      image: sofa.image,
      alt: `${sofa.name} — sofá ${sofa.style.toLowerCase()} en color ${sofa.color.toLowerCase()}`,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div
      id={`producto-${sofa.id}`}
      className="catalog-card reveal-on-scroll card-hover bg-card rounded-2xl overflow-hidden border border-border shadow-sm flex flex-col"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-muted group">
        <Link href={`/productos/${sofa.id}`} className="block w-full h-full">
          <AppImage
            src={sofa.image}
            alt={`${sofa.name} — sofá ${sofa.style.toLowerCase()} color ${sofa.color.toLowerCase()}, ${sofa.seats}`}
            fill
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>

        {/* Hover overlay with action buttons */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 pointer-events-none group-hover:pointer-events-auto">
          {/* Like button */}
          <button
            onClick={(e) => { e.preventDefault(); setLiked((v) => !v); }}
            className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200"
            aria-label="Me gusta"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={liked ? '#ef4444' : 'none'}
              stroke={liked ? '#ef4444' : '#374151'}
              strokeWidth={2}
              className="w-6 h-6 transition-colors duration-200"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>

          {/* View button */}
          <Link
            href={`/productos/${sofa.id}`}
            className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200"
            aria-label="Ver producto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#374151"
              strokeWidth={2}
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 ${
              added ? 'bg-green-500' : 'bg-white/90 hover:bg-primary'
            }`}
            aria-label="Agregar al carrito"
            title="Agregar al carrito"
          >
            {added ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
          </button>
        </div>

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
            {sofa.style}
          </span>
          <span className="bg-white/90 text-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
            {sofa.seats}
          </span>
        </div>
        {sofa.id === 12 && (
          <div className="absolute top-3 right-3">
            <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
              ⭐ Exclusivo
            </span>
          </div>
        )}

        {/* Cart icon always visible at bottom-right */}
        <button
          onClick={handleAddToCart}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-10 ${
            added
              ? 'bg-green-500 scale-110' :'bg-white/90 backdrop-blur-sm hover:bg-primary hover:scale-110'
          }`}
          aria-label="Agregar al carrito"
          title="Agregar al carrito"
        >
          {added ? (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/productos/${sofa.id}`} className="hover:text-primary transition-colors">
            <h3 className="font-bold text-foreground text-base leading-tight">{sofa.name}</h3>
          </Link>
          {/* Auto color indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            {colorLoading ? (
              <span className="w-3 h-3 rounded-full bg-muted animate-pulse" />
            ) : autoColor ? (
              <>
                <span
                  className="color-swatch"
                  style={{ backgroundColor: `rgb(${autoColor.r},${autoColor.g},${autoColor.b})` }}
                  title={autoColor.name}
                />
                <span className="text-xs text-muted-foreground">{autoColor.emoji} {autoColor.name}</span>
              </>
            ) : (
              <>
                <span
                  className="color-swatch"
                  style={{ backgroundColor: colorMap[sofa.color] }}
                  title={sofa.color}
                />
                <span className="text-xs text-muted-foreground">{sofa.color}</span>
              </>
            )}
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-4 leading-relaxed flex-1">{sofa.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-extrabold text-primary">{sofa.price}</span>
          <span className="text-xs text-secondary font-semibold bg-secondary/10 px-2.5 py-1 rounded-full">
            Envío gratis
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/productos/${sofa.id}`}
            className="flex items-center justify-center flex-1 px-3 py-2.5 border border-primary text-primary font-bold text-sm rounded-xl hover:bg-primary hover:text-white transition-all duration-200"
          >
            Ver detalles
          </Link>
          <a
            href={`https://wa.me/15550000000?text=Hola%20Muebler%C3%ADa%20Polaris!%20Me%20interesa%20el%20sof%C3%A1%20${encodeURIComponent(sofa.name)}%2C%20%C2%BFpueden%20darme%20m%C3%A1s%20informaci%C3%B3n%3F`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 bg-[#25D366] text-white font-bold text-sm rounded-xl hover:bg-[#25D366]/90 transition-all duration-200 hover:shadow-lg hover:shadow-[#25D366]/20"
          >
            <WhatsAppIcon className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}