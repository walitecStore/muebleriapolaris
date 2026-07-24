import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import { catalogCategories } from './catalogoData';

export const metadata: Metadata = {
  title: 'Catálogo de Sofás — Mueblería Polaris',
  description: 'Explora nuestro catálogo completo de sofás: Europeos, Modulares, Seccionales, Sofás Cama, Sets 3-2-1 y Pufs. Más de 200 modelos disponibles.',
  alternates: { canonical: '/catalogo' },
  openGraph: {
    title: 'Catálogo Completo — Mueblería Polaris',
    description: 'Sofás europeos, modulares, seccionales, cama y más. Compra fácil por WhatsApp.',
    images: [{ url: '/assets/images/euro_crema-1784905001176.jpg', width: 1200, height: 630 }],
  },
};

export default function CatalogoPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/20 pt-20">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Catálogo</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <div className="text-center mb-12">
            <span className="inline-block text-primary font-bold text-sm uppercase tracking-widest mb-3">
              Mueblería Polaris
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              Catálogo <span className="text-gradient-teal">Completo</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Descubre nuestra colección completa de sofás. Selecciona una categoría para explorar todos los modelos disponibles.
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {catalogCategories.map((cat) => {
              const filled = cat.products.filter((p) => p.name !== 'Próximamente').length;
              return (
                <Link
                  key={cat.slug}
                  href={`/catalogo/${cat.slug}`}
                  className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden bg-muted">
                    <AppImage
                      src={cat.image}
                      alt={cat.alt}
                      fill
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                        {cat.capacity} modelos
                      </span>
                    </div>
                    {cat.subcatalogs.length > 0 && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                          +{cat.subcatalogs.length} subcatálogos
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="text-lg font-extrabold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {cat.label}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">
                      {cat.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {filled} disponibles ahora
                      </span>
                      <span className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-full group-hover:bg-primary/90 transition-colors">
                        Ver catálogo
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform">
                          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
