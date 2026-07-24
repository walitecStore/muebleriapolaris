'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import { getCategoryBySlug, buildWhatsAppUrl, type CatalogProduct, type CatalogCategory,  } from '../catalogoData';

const ITEMS_PER_PAGE = 12;

// ─── Product Card ──────────────────────────────────────────
function ProductCard({ product }: { product: CatalogProduct }) {
  const isPlaceholder = product.name === 'Próximamente';
  const waUrl = buildWhatsAppUrl(product.name);

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-muted">
        <AppImage
          src={product.image}
          alt={product.alt}
          fill
          className={`object-cover w-full h-full transition-transform duration-500 ${isPlaceholder ? 'opacity-40' : 'group-hover:scale-105'}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {isPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white/90 backdrop-blur-sm text-foreground text-sm font-bold px-4 py-2 rounded-full">
              Próximamente
            </span>
          </div>
        )}
        {product.previousPrice && !isPlaceholder && (
          <div className="absolute top-3 left-3">
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">OFERTA</span>
          </div>
        )}
        {product.color && !isPlaceholder && (
          <div className="absolute top-3 right-3">
            <span className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              {product.color}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.measures && !isPlaceholder && (
          <p className="text-xs text-muted-foreground mb-2">{product.measures}</p>
        )}
        {product.material && !isPlaceholder && (
          <p className="text-xs text-muted-foreground mb-3">{product.material}</p>
        )}

        <div className="mt-auto">
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-extrabold text-primary">{product.price}</span>
            {product.previousPrice && (
              <span className="text-sm text-muted-foreground line-through">{product.previousPrice}</span>
            )}
          </div>

          {/* WhatsApp Button */}
          {!isPlaceholder && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20b858] text-white text-sm font-bold py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#25D366]/30"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Solicitar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────
function Pagination({
  total,
  page,
  perPage,
  onChange,
}: {
  total: number;
  page: number;
  perPage: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Anterior
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
              page === p
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'border border-border text-muted-foreground hover:text-foreground hover:border-primary'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Siguiente
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function CategoriaPage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = Array.isArray(params.categoria) ? params.categoria[0] : (params.categoria as string) ?? '';

  // Determine if this is a subcatalog view: URL pattern /catalogo/[cat]/[sub]
  // Since this is a single [categoria] segment, subcatalog is handled via query
  const [activeSubSlug, setActiveSubSlug] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const category = getCategoryBySlug(rawSlug);

  // Determine active product list
  const activeSub = activeSubSlug
    ? category?.subcatalogs.find((s) => s.slug === activeSubSlug)
    : null;
  const activeProducts: CatalogProduct[] = activeSub
    ? activeSub.products
    : category?.products ?? [];

  // Unique filter options
  const colorOptions = useMemo(() => {
    const vals = activeProducts.map((p) => p.color).filter(Boolean) as string[];
    return [...new Set(vals)].sort();
  }, [activeProducts]);

  const materialOptions = useMemo(() => {
    const vals = activeProducts.map((p) => p.material).filter(Boolean) as string[];
    return [...new Set(vals)].sort();
  }, [activeProducts]);

  // Filter + search
  const filtered = useMemo(() => {
    return activeProducts.filter((p) => {
      if (p.name === 'Próximamente') return true; // always show placeholders
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.color?.toLowerCase().includes(q) ?? false) ||
        (p.material?.toLowerCase().includes(q) ?? false) ||
        p.category.toLowerCase().includes(q);
      const matchColor = !filterColor || p.color === filterColor;
      const matchMaterial = !filterMaterial || p.material === filterMaterial;
      let matchPrice = true;
      if (filterPrice && p.price !== 'Consultar') {
        const num = parseFloat(p.price.replace(/[^0-9.]/g, '').replace(',', ''));
        if (filterPrice === 'bajo') matchPrice = num < 1000;
        else if (filterPrice === 'medio') matchPrice = num >= 1000 && num < 2000;
        else if (filterPrice === 'alto') matchPrice = num >= 2000;
      }
      return matchSearch && matchColor && matchMaterial && matchPrice;
    });
  }, [activeProducts, search, filterColor, filterMaterial, filterPrice]);

  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, filterColor, filterMaterial, filterPrice, activeSubSlug]);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

  if (!category) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center pt-20">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground mb-4">Categoría no encontrada</p>
            <Link href="/catalogo" className="text-primary hover:underline">← Volver al catálogo</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const currentLabel = activeSub ? activeSub.label : category.label;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/20 pt-20" ref={topRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/catalogo" className="hover:text-primary transition-colors">Catálogo</Link>
            <span>/</span>
            {activeSub ? (
              <>
                <button onClick={() => setActiveSubSlug(null)} className="hover:text-primary transition-colors">
                  {category.label}
                </button>
                <span>/</span>
                <span className="text-foreground font-semibold">{activeSub.label}</span>
              </>
            ) : (
              <span className="text-foreground font-semibold">{category.label}</span>
            )}
          </nav>

          {/* Back button */}
          <button
            onClick={() => {
              if (activeSub) { setActiveSubSlug(null); }
              else { router.push('/catalogo'); }
            }}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            {activeSub ? `Volver a ${category.label}` : 'Volver al Catálogo'}
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-2">
              {currentLabel}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
              {category.description}
            </p>
          </div>

          {/* Subcatalog Buttons */}
          {!activeSub && category.subcatalogs.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-8">
              {category.subcatalogs.map((sub) => (
                <button
                  key={sub.slug}
                  onClick={() => setActiveSubSlug(sub.slug)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M2 3a1 1 0 00-1 1v1a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H2zM2 9a1 1 0 000 2h16a1 1 0 000-2H2zM2 15a1 1 0 000 2h16a1 1 0 000-2H2z" />
                  </svg>
                  {sub.label}
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{sub.capacity}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search + Filters */}
          <div className="bg-card rounded-2xl border border-border p-5 mb-8 shadow-sm">
            {/* Search */}
            <div className="relative mb-4">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre, color, material..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-3">
              {/* Color */}
              {colorOptions.length > 0 && (
                <select
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="">Todos los colores</option>
                  {colorOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              {/* Material */}
              {materialOptions.length > 0 && (
                <select
                  value={filterMaterial}
                  onChange={(e) => setFilterMaterial(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="">Todos los materiales</option>
                  {materialOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              )}

              {/* Price */}
              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="">Todos los precios</option>
                <option value="bajo">Hasta S/999</option>
                <option value="medio">S/1,000 – S/1,999</option>
                <option value="alto">S/2,000 a más</option>
              </select>

              {/* Clear */}
              {(filterColor || filterMaterial || filterPrice || search) && (
                <button
                  onClick={() => { setFilterColor(''); setFilterMaterial(''); setFilterPrice(''); setSearch(''); }}
                  className="px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-all"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">{Math.min(paginated.length, filtered.length)}</span> de{' '}
              <span className="font-bold text-foreground">{filtered.length}</span> productos
            </p>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Capacidad total: {activeSub ? activeSub.capacity : category.capacity} modelos
            </p>
          </div>

          {/* Product Grid */}
          {paginated.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🛋️</div>
              <p className="text-foreground font-bold text-xl mb-2">No encontramos productos</p>
              <p className="text-muted-foreground text-sm mb-6">Prueba con otros filtros o términos de búsqueda</p>
              <button
                onClick={() => { setSearch(''); setFilterColor(''); setFilterMaterial(''); setFilterPrice(''); }}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-colors"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginated.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            total={filtered.length}
            page={page}
            perPage={ITEMS_PER_PAGE}
            onChange={(p) => { setPage(p); scrollTop(); }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
