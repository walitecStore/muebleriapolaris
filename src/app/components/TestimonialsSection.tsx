'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Review {
  id: number;
  name: string;
  initials: string;
  location: string;
  rating: number;
  title: string;
  text: string;
  product: string;
  productId: number;
  avatarColor: string;
  date: string;
  verified: boolean;
  helpful: number;
  tags: string[];
}

const reviews: Review[] = [
  {
    id: 1,
    name: 'Valentina Morales',
    initials: 'VM',
    location: 'Ciudad de México',
    rating: 5,
    title: 'Superó todas mis expectativas',
    text: 'Compré el Sofá Nórdico Oslo hace 3 meses y sigue luciendo impecable. La calidad de la tela es increíble, muy fácil de limpiar. El proceso por WhatsApp fue súper ágil, me enviaron fotos reales del producto antes de confirmar. Llegó bien embalado y en tiempo.',
    product: 'Sofá Nórdico Oslo',
    productId: 1,
    avatarColor: 'bg-primary',
    date: 'Hace 2 semanas',
    verified: true,
    helpful: 24,
    tags: ['Calidad premium', 'Entrega rápida', 'Fácil de limpiar'],
  },
  {
    id: 2,
    name: 'Rodrigo Espinoza',
    initials: 'RE',
    location: 'Bogotá, Colombia',
    rating: 5,
    title: 'El Polaris Signature es una obra de arte',
    text: 'Me asesoraron perfectamente para elegir el color y el tamaño. El Sofá Polaris Signature llegó en perfectas condiciones, el diseño es exactamente como en las fotos. El azul es precioso, muy profundo. Ya lo recomendé a dos amigos que también compraron.',
    product: 'Sofá Polaris Signature',
    productId: 12,
    avatarColor: 'bg-secondary',
    date: 'Hace 1 mes',
    verified: true,
    helpful: 31,
    tags: ['Diseño exclusivo', 'Color exacto', 'Bien embalado'],
  },
  {
    id: 3,
    name: 'Camila Restrepo',
    initials: 'CR',
    location: 'Santiago, Chile',
    rating: 5,
    title: 'Perfecto para familia con niños',
    text: 'El Sofá Familiar XL es perfecto para mis tres hijos. Muy cómodo, de gran calidad y el servicio fue de primera. Llevamos 5 meses usándolo a diario y no tiene ningún desgaste. La tela resiste muy bien los juegos de los niños. ¡Gracias Mueblería Polaris!',
    product: 'Sofá Familiar XL',
    productId: 10,
    avatarColor: 'bg-accent',
    date: 'Hace 3 semanas',
    verified: true,
    helpful: 18,
    tags: ['Resistente', 'Ideal para niños', 'Gran tamaño'],
  },
  {
    id: 4,
    name: 'Andrés Fuentes',
    initials: 'AF',
    location: 'Guadalajara, México',
    rating: 5,
    title: 'El Chaise Longue cambió mi sala',
    text: 'Dudé mucho antes de comprar por WhatsApp pero la atención fue tan profesional que me convenció. Me mandaron video del sofá, medidas exactas y hasta me ayudaron a elegir el color que mejor combinaba con mi piso. El Chaise Longue Relax es una maravilla.',
    product: 'Sofá Chaise Longue Relax',
    productId: 5,
    avatarColor: 'bg-primary',
    date: 'Hace 5 días',
    verified: true,
    helpful: 12,
    tags: ['Atención personalizada', 'Muy cómodo', 'Buen precio'],
  },
  {
    id: 5,
    name: 'Lucía Vargas',
    initials: 'LV',
    location: 'Lima, Perú',
    rating: 4,
    title: 'Muy buena calidad, entrega puntual',
    text: 'El Sofá Escandinavo Hygge es exactamente lo que buscaba para mi departamento pequeño. Las patas de madera le dan un toque muy elegante. Le doy 4 estrellas porque el tiempo de entrega fue un poco más largo de lo esperado, pero el producto vale cada centavo.',
    product: 'Sofá Escandinavo Hygge',
    productId: 6,
    avatarColor: 'bg-secondary',
    date: 'Hace 2 meses',
    verified: true,
    helpful: 9,
    tags: ['Diseño nórdico', 'Compacto', 'Elegante'],
  },
  {
    id: 6,
    name: 'Marco Delgado',
    initials: 'MD',
    location: 'Buenos Aires, Argentina',
    rating: 5,
    title: 'El Industrial Loft es brutal',
    text: 'Tenía miedo de que el cuero sintético se viera barato pero no, se ve y se siente premium. El Sofá Industrial Loft encaja perfecto en mi loft. La estructura metálica es sólida, no cruje nada. Compré también la mesa de centro y quedó perfecto el conjunto.',
    product: 'Sofá Industrial Loft',
    productId: 4,
    avatarColor: 'bg-accent',
    date: 'Hace 6 días',
    verified: true,
    helpful: 15,
    tags: ['Cuero premium', 'Estructura sólida', 'Estilo urbano'],
  },
];

const ratingDistribution = [
  { stars: 5, count: 412, percent: 82 },
  { stars: 4, count: 68, percent: 14 },
  { stars: 3, count: 15, percent: 3 },
  { stars: 2, count: 4, percent: 1 },
  { stars: 1, count: 1, percent: 0 },
];

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`${sizeClass} ${i < rating ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      Compra verificada
    </span>
  );
}

export default function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [animatedBars, setAnimatedBars] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-on-scroll').forEach((el, i) => {
              setTimeout(() => el.classList.add('revealed'), i * 80);
            });
            setTimeout(() => setAnimatedBars(true), 400);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const filtered = activeFilter
    ? reviews.filter((r) => r.rating === activeFilter)
    : reviews;

  const displayed = filtered.slice(0, visibleCount);

  return (
    <section id="testimonios" className="py-20 bg-background" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-14 reveal-on-scroll">
          <span className="inline-block text-primary font-bold text-sm uppercase tracking-widest mb-3">Reseñas verificadas</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Lo que dicen nuestros <span className="text-gradient-teal">clientes</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Opiniones reales de familias que ya transformaron su hogar con Mueblería Polaris.
          </p>
        </div>

        {/* Rating overview + distribution */}
        <div className="reveal-on-scroll mb-12">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-sm">

            {/* Big score */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-end gap-3">
                <span className="text-7xl font-extrabold text-foreground leading-none">4.9</span>
                <div className="pb-2">
                  <StarRating rating={5} size="lg" />
                  <p className="text-muted-foreground text-sm mt-1.5">de 5.0 posible</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm font-medium">Basado en <strong className="text-foreground">500 reseñas verificadas</strong></p>
              {/* Social proof pills */}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  🛋️ 500+ sofás entregados
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                  ✅ 98% recomendaría
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                  ⚡ Respuesta en &lt;1 hora
                </span>
              </div>
            </div>

            {/* Distribution bars */}
            <div className="space-y-2.5">
              {ratingDistribution.map((row) => (
                <button
                  key={row.stars}
                  onClick={() => setActiveFilter(activeFilter === row.stars ? null : row.stars)}
                  className={`w-full flex items-center gap-3 group transition-all duration-200 rounded-lg px-2 py-1 ${activeFilter === row.stars ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                  aria-label={`Filtrar por ${row.stars} estrellas`}
                >
                  <span className="text-sm font-semibold text-foreground w-4 shrink-0">{row.stars}</span>
                  <svg className="w-3.5 h-3.5 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-700 ease-out"
                      style={{ width: animatedBars ? `${row.percent}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{row.count}</span>
                </button>
              ))}
              {activeFilter && (
                <button
                  onClick={() => setActiveFilter(null)}
                  className="text-xs text-primary underline underline-offset-2 mt-1 hover:text-primary/80 transition-colors"
                >
                  Quitar filtro
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {displayed.map((review, i) => (
            <div
              key={review.id}
              className={`reveal-on-scroll stagger-${(i % 3) + 1} bg-card rounded-2xl border border-border hover:border-primary/30 p-5 sm:p-6 shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 flex flex-col`}
            >
              {/* Top row: stars + verified */}
              <div className="flex items-center justify-between mb-3">
                <StarRating rating={review.rating} size="sm" />
                {review.verified && <VerifiedBadge />}
              </div>

              {/* Review title */}
              <h3 className="font-bold text-foreground text-sm mb-2 leading-snug">{review.title}</h3>

              {/* Review text */}
              <p className="text-foreground/75 text-sm leading-relaxed mb-4 flex-1">{review.text}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {review.tags.map((tag) => (
                  <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>

              {/* Product link */}
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-4 w-fit">
                🛋️ {review.product}
              </div>

              {/* Author row */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className={`w-9 h-9 rounded-full ${review.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                  {review.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground text-sm truncate">{review.name}</div>
                  <div className="text-muted-foreground text-xs">{review.location} · {review.date}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 1.941l-3.68 4.86M7 20H2v-9.5a2 2 0 012-2h.5" />
                  </svg>
                  <span>{review.helpful}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load more / show less */}
        {filtered.length > 3 && (
          <div className="flex justify-center mb-10 reveal-on-scroll">
            {visibleCount < filtered.length ? (
              <button
                onClick={() => setVisibleCount((v) => v + 3)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-all duration-200"
              >
                Ver más reseñas
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setVisibleCount(3)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-border text-muted-foreground font-semibold text-sm hover:border-primary hover:text-primary transition-all duration-200"
              >
                Ver menos
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Bottom trust bar */}
        <div className="reveal-on-scroll bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border border-border rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1">4.9★</div>
              <div className="text-xs text-muted-foreground font-medium">Calificación promedio</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1">500+</div>
              <div className="text-xs text-muted-foreground font-medium">Reseñas verificadas</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1">98%</div>
              <div className="text-xs text-muted-foreground font-medium">Clientes satisfechos</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1">12+</div>
              <div className="text-xs text-muted-foreground font-medium">Modelos reseñados</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}