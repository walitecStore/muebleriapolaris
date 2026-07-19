'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import { WhatsAppIcon } from '@/components/Header';
import { sofaProducts, colorMap, type SofaReview } from '@/app/components/catalogData';

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`${sizeClass} ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
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

function ReviewCard({ review }: { review: SofaReview }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${review.avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {review.initials}
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{review.name}</p>
            <p className="text-xs text-muted-foreground">{review.location}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StarRating rating={review.rating} />
          <span className="text-xs text-muted-foreground">{review.date}</span>
        </div>
      </div>
      {review.verified && <VerifiedBadge />}
      <div>
        <p className="font-bold text-foreground text-sm mb-1">{review.title}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{review.text}</p>
      </div>
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span key={tag} className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">¿Fue útil?</span>
        <button className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors px-2 py-0.5 rounded-full hover:bg-primary/10">
          👍 {review.helpful}
        </button>
      </div>
    </div>
  );
}

export default function ProductPage() {
  const params = useParams();
  const productId = Number(params?.id);
  const sofa = sofaProducts.find((p) => p.id === productId);

  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!sofa) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🛋️</div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">Producto no encontrado</h1>
            <p className="text-muted-foreground mb-6">El sofá que buscas no existe o fue removido.</p>
            <Link
              href="/#catalogo"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors"
            >
              ← Ver catálogo completo
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const gallery = sofa.gallery ?? [sofa.image];
  const whatsappMsg = encodeURIComponent(
    `Hola Mueblería Polaris! Me interesa el ${sofa.name} (SKU: ${sofa.sku ?? sofa.id}), precio ${sofa.price}. ¿Pueden darme más información y disponibilidad?`
  );
  const whatsappUrl = `https://wa.me/15550000000?text=${whatsappMsg}`;

  const relatedSofas = sofaProducts
    .filter((p) => p.id !== sofa.id && (p.style === sofa.style || p.color === sofa.color))
    .slice(0, 3);

  return (
    <>
      <Header />
      <main className="pt-20 sm:pt-24 pb-20 min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors font-medium">Inicio</Link>
            <span>/</span>
            <Link href="/#catalogo" className="hover:text-primary transition-colors font-medium">Catálogo</Link>
            <span>/</span>
            <span className="text-foreground font-semibold truncate max-w-[200px]">{sofa.name}</span>
          </nav>
        </div>

        {/* Product Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={heroRef}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-start">

            {/* Gallery */}
            <div className="flex flex-col gap-4 animate-in-up">
              {/* Main image */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-border shadow-lg">
                <AppImage
                  src={gallery[activeImage]}
                  alt={`${sofa.name} — vista ${activeImage + 1} de ${gallery.length}`}
                  fill
                  className="object-cover w-full h-full transition-opacity duration-300"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow">
                    {sofa.style}
                  </span>
                  <span className="bg-white/90 text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                    {sofa.seats}
                  </span>
                </div>
                {sofa.id === 12 && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow">
                      ⭐ Exclusivo
                    </span>
                  </div>
                )}
                {/* Image counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {activeImage + 1} / {gallery.length}
                </div>
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        activeImage === idx
                          ? 'border-primary shadow-md shadow-primary/20 scale-105'
                          : 'border-border hover:border-primary/50'
                      }`}
                      aria-label={`Ver imagen ${idx + 1}`}
                    >
                      <AppImage
                        src={img}
                        alt={`${sofa.name} miniatura ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col gap-6 animate-in-up-delay-1">
              {/* Name & rating */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Mueblería Polaris</span>
                  {sofa.availability && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ {sofa.availability}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-3">
                  {sofa.name}
                </h1>
                {sofa.rating && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <StarRating rating={sofa.rating} size="md" />
                    <span className="font-bold text-foreground">{sofa.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">({sofa.reviewCount} reseñas)</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="text-4xl font-extrabold text-primary">{sofa.price}</span>
                <span className="text-sm font-semibold text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
                  🚚 Envío gratis
                </span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-base leading-relaxed border-l-4 border-primary/30 pl-4">
                {sofa.description}
              </p>

              {/* Color & seats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">Color:</span>
                  <span
                    className="w-5 h-5 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: colorMap[sofa.color] }}
                    title={sofa.color}
                  />
                  <span className="text-sm font-bold text-foreground">{sofa.color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">Plazas:</span>
                  <span className="text-sm font-bold text-foreground">{sofa.seats}</span>
                </div>
                {sofa.sku && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">SKU:</span>
                    <span className="text-sm font-mono text-muted-foreground">{sofa.sku}</span>
                  </div>
                )}
              </div>

              {/* Features */}
              {sofa.features && sofa.features.length > 0 && (
                <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Características principales</p>
                  <ul className="space-y-2">
                    {sofa.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <svg className="w-4 h-4 text-secondary shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* WhatsApp CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 flex-1 px-6 py-4 bg-[#25D366] text-white font-bold text-base rounded-2xl hover:bg-[#25D366]/90 transition-all duration-200 hover:shadow-xl hover:shadow-[#25D366]/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  Consultar por WhatsApp
                </a>
                <a
                  href={`https://wa.me/15550000000?text=${encodeURIComponent(`Hola! Quiero comprar el ${sofa.name} (${sofa.price}). ¿Cómo procedo?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-secondary text-secondary-foreground font-bold text-base rounded-2xl hover:bg-secondary/90 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  Comprar ahora
                </a>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🛡️', label: 'Garantía 2 años' },
                  { icon: '🚚', label: 'Envío gratis' },
                  { icon: '↩️', label: '30 días devolución' },
                ].map((badge) => (
                  <div key={badge.label} className="flex flex-col items-center gap-1 bg-muted/50 rounded-xl p-3 border border-border text-center">
                    <span className="text-xl">{badge.icon}</span>
                    <span className="text-xs font-semibold text-muted-foreground leading-tight">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Specs & Reviews */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
          {/* Tab buttons */}
          <div className="flex gap-1 bg-muted/50 rounded-2xl p-1.5 border border-border w-fit mb-8">
            {(['specs', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white text-primary shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'specs' ? '📐 Especificaciones' : `⭐ Reseñas (${sofa.reviews?.length ?? 0})`}
              </button>
            ))}
          </div>

          {/* Specs Tab */}
          {activeTab === 'specs' && sofa.specs && (
            <div className="animate-in-up">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                  <h2 className="font-extrabold text-foreground text-lg">Especificaciones técnicas</h2>
                  <p className="text-muted-foreground text-sm mt-0.5">Medidas y materiales del {sofa.name}</p>
                </div>
                <div className="divide-y divide-border">
                  {Object.entries(sofa.specs).map(([key, value], idx) => (
                    <div
                      key={key}
                      className={`flex items-center justify-between px-6 py-4 gap-4 ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/20'}`}
                    >
                      <span className="text-sm font-semibold text-muted-foreground min-w-[140px]">{key}</span>
                      <span className="text-sm font-bold text-foreground text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="animate-in-up">
              {sofa.reviews && sofa.reviews.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {/* Rating summary */}
                  <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <span className="text-6xl font-extrabold text-foreground leading-none">
                        {sofa.rating?.toFixed(1) ?? '—'}
                      </span>
                      <StarRating rating={sofa.rating ?? 0} size="md" />
                      <span className="text-sm text-muted-foreground">{sofa.reviewCount} reseñas</span>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                          ✅ Compras verificadas
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                          🛋️ Clientes reales
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                          ⚡ Respuesta en &lt;1 hora
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {sofa.reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>

                  {/* CTA to leave review via WhatsApp */}
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-foreground">¿Ya compraste este sofá?</p>
                      <p className="text-muted-foreground text-sm mt-0.5">Comparte tu experiencia y ayuda a otros clientes</p>
                    </div>
                    <a
                      href={`https://wa.me/15550000000?text=${encodeURIComponent(`Hola! Quiero dejar una reseña del ${sofa.name} que compré.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#25D366] text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#25D366]/90 transition-all shrink-0"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      Dejar reseña
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="font-bold text-foreground mb-1">Sé el primero en opinar</p>
                  <p className="text-muted-foreground text-sm mb-5">Comparte tu experiencia con este sofá</p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#25D366]/90 transition-all"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    Contactar por WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedSofas.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-foreground">También te puede interesar</h2>
              <p className="text-muted-foreground text-sm mt-1">Sofás similares en estilo o color</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedSofas.map((related) => (
                <Link
                  key={related.id}
                  href={`/productos/${related.id}`}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <AppImage
                      src={related.image}
                      alt={`${related.name} — sofá ${related.style.toLowerCase()} color ${related.color.toLowerCase()}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                        {related.style}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">{related.name}</h3>
                    <p className="text-muted-foreground text-xs mb-3 flex-1">{related.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-extrabold text-primary">{related.price}</span>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                        Ver más →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom WhatsApp sticky bar (mobile) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-border px-4 py-3 shadow-2xl">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full px-6 py-3.5 bg-[#25D366] text-white font-bold text-base rounded-2xl hover:bg-[#25D366]/90 transition-all"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Consultar por WhatsApp — {sofa.price}
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
