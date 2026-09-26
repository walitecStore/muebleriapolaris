'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';

import {
  sofaProducts,
  styleOptions,
  colorOptions,
  seatsOptions,
  colorMap,
  type SofaProduct,
} from './catalogData';

import { useCart } from './CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';

type SortOption = 'recommended' | 'popular' | 'rating' | 'price-low' | 'price-high' | 'newest';

type PriceRange = 'all' | '0-500' | '500-1000' | '1000-1500' | '1500-2000' | '2000+';

const CATEGORY_OPTIONS = [
  'Sofás Europeo',
  'Sofás Modulares',
  'Sofás Seccionales',
  'Sofás Cama',
  'Sofás 3-2-1',
  'Pufs y Decorativos',
] as const;

type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

const CATEGORY_ALIASES: Record<CategoryOption, string[]> = {
  'Sofás Europeo': [
    'Sofás Europeo',
    'Sofas Europeo',
    'Sofá Europeo',
    'Sofa Europeo',
    'Sofás Europeos',
    'Sofas Europeos',
    'Europeo',
    'EUROPA',
    'europeo',
    'europa',
  ],
  'Sofás Modulares': [
    'Sofás Modulares',
    'Sofas Modulares',
    'Sofá Modular',
    'Sofa Modular',
    'Modulares',
    'Modular',
    'MODULAR',
  ],
  'Sofás Seccionales': [
    'Sofás Seccionales',
    'Sofas Seccionales',
    'Sofá Seccional',
    'Sofa Seccional',
    'Seccionales',
    'Seccional',
    'SECCIONAL',
  ],
  'Sofás Cama': ['Sofás Cama', 'Sofas Cama', 'Sofá Cama', 'Sofa Cama', 'Cama', 'CAMA'],
  'Sofás 3-2-1': [
    'Sofás 3-2-1',
    'Sofas 3-2-1',
    'Sofá 3-2-1',
    'Sofa 3-2-1',
    '3-2-1',
    '3 2 1',
    '3_2_1',
  ],
  'Pufs y Decorativos': [
    'Pufs y Decorativos',
    'Puffs y Decorativos',
    'Puf y Decorativos',
    'Puff y Decorativos',
    'Pufs',
    'Puffs',
    'Puf',
    'Puff',
    'PUFS_DECORATIVOS',
  ],
};

const PRICE_OPTIONS: { value: PriceRange; label: string }[] = [
  { value: 'all', label: 'Todos los precios' },
  { value: '0-500', label: 'Hasta S/ 500' },
  { value: '500-1000', label: 'S/ 500 – S/ 1,000' },
  { value: '1000-1500', label: 'S/ 1,000 – S/ 1,500' },
  { value: '1500-2000', label: 'S/ 1,500 – S/ 2,000' },
  { value: '2000+', label: 'Más de S/ 2,000' },
];

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getCanonicalCategory(value: unknown): CategoryOption | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  for (const category of CATEGORY_OPTIONS) {
    if (CATEGORY_ALIASES[category].some((alias) => normalizeText(alias) === normalized)) {
      return category;
    }
  }

  return null;
}

function categoriesMatch(productCategory: unknown, selectedCategory: unknown): boolean {
  if (!selectedCategory) return true;

  const selected = getCanonicalCategory(selectedCategory);
  const product = getCanonicalCategory(productCategory);

  if (selected && product) return selected === product;

  return normalizeText(productCategory) === normalizeText(selectedCategory);
}

function parsePrice(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const text = String(value ?? '')
    .replace(/s\/?/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
}

function matchesPriceRange(price: number, range: PriceRange): boolean {
  switch (range) {
    case '0-500':
      return price <= 500;
    case '500-1000':
      return price > 500 && price <= 1000;
    case '1000-1500':
      return price > 1000 && price <= 1500;
    case '1500-2000':
      return price > 1500 && price <= 2000;
    case '2000+':
      return price > 2000;
    default:
      return true;
  }
}

function getSearchText(sofa: SofaProduct): string {
  return normalizeText(
    [
      sofa.name,
      sofa.category,
      sofa.style,
      sofa.color,
      sofa.seats,
      sofa.description,
      sofa.sku,
      ...(sofa.features ?? []),
      ...Object.values(sofa.specs ?? {}),
    ].join(' ')
  );
}

function getSimilarityScore(source: SofaProduct, candidate: SofaProduct): number {
  if (source.id === candidate.id) return -1;

  let score = 0;

  if (normalizeText(source.category) === normalizeText(candidate.category)) score += 30;
  if (normalizeText(source.style) === normalizeText(candidate.style)) score += 25;
  if (normalizeText(source.color) === normalizeText(candidate.color)) score += 20;
  if (normalizeText(source.seats) === normalizeText(candidate.seats)) score += 15;

  const sourcePrice = parsePrice(source.price);
  const candidatePrice = parsePrice(candidate.price);

  if (sourcePrice > 0 && candidatePrice > 0) {
    const difference = Math.abs(sourcePrice - candidatePrice) / sourcePrice;
    score += Math.max(0, 15 - difference * 15);
  }

  score += Math.min(Number(candidate.rating ?? 0) * 2, 10);

  return score;
}

function getCommercialBadge(sofa: SofaProduct): string {
  const reviews = Number(sofa.reviewCount ?? 0);
  const rating = Number(sofa.rating ?? 0);

  if (reviews >= 100) return '🔥 Más vendido';
  if (rating >= 4.9) return '⭐ Mejor valorado';
  if (sofa.id >= 23) return '🆕 Nuevo';

  return '';
}

function getProductScore(sofa: SofaProduct): number {
  const rating = Number(sofa.rating ?? 0);
  const reviews = Number(sofa.reviewCount ?? 0);
  const price = parsePrice(sofa.price);

  // Recomendación comercial equilibrada:
  // valoración + cantidad de reseñas + disponibilidad + precio razonable.
  const ratingScore = rating * 25;
  const reviewScore = Math.min(reviews, 200) * 0.25;
  const availabilityScore = normalizeText(sofa.availability).includes('stock') ? 15 : 0;
  const priceScore = price > 0 ? Math.max(0, 10 - price / 500) : 0;

  return ratingScore + reviewScore + availabilityScore + priceScore;
}

function productMatchesColor(sofa: SofaProduct, selectedColors: string[]): boolean {
  if (!selectedColors.length) return true;

  const productColor = normalizeText(sofa.color);

  return selectedColors.some((color) => {
    const wanted = normalizeText(color);

    if (productColor === wanted) return true;

    // Sinónimos útiles para búsqueda comercial.
    const synonyms: Record<string, string[]> = {
      azul: ['celeste', 'turquesa', 'azul marino'],
      beige: ['arena', 'crema', 'marfil', 'camel', 'marron'],
      gris: ['gris perla', 'gris oscuro', 'marengo'],
      verde: ['oliva', 'esmeralda'],
      rojo: ['vino', 'bordo', 'granate'],
      negro: ['carbon', 'grafito'],
      blanco: ['nube', 'hueso'],
    };

    return (synonyms[wanted] ?? []).some((alias) => productColor.includes(normalizeText(alias)));
  });
}

export default function CatalogSection() {
  const catalogRef = useRef<HTMLDivElement>(null);

  // Los hooks de contexto se ejecutan UNA SOLA VEZ en el componente padre.
  // Esto evita cambios en el orden de hooks cuando cambia la cantidad de productos filtrados.
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite, loading: favoritesLoading } = useFavorites();
  const { user } = useAuth();

  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeStyles, setActiveStyles] = useState<string[]>([]);
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [activeSeats, setActiveSeats] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [catalogProducts, setCatalogProducts] = useState<SofaProduct[]>(sofaProducts);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSource, setCatalogSource] = useState<'api' | 'local'>('local');
  const [visibleCount, setVisibleCount] = useState(12);

  const [showFilters, setShowFilters] = useState(false);
  const [showFinder, setShowFinder] = useState(false);
  const [finderColor, setFinderColor] = useState('');
  const [finderSeats, setFinderSeats] = useState('');
  const [finderStyle, setFinderStyle] = useState('');
  const [finderBudget, setFinderBudget] = useState<PriceRange>('all');

  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [recommendationSourceId, setRecommendationSourceId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('polaris_recent_products') ?? '[]');
      if (Array.isArray(saved))
        setRecentIds(saved.filter((id) => Number.isFinite(Number(id))).map(Number));
    } catch {
      setRecentIds([]);
    }
  }, []);

  useEffect(() => {
    // No usamos AbortController aquí porque en desarrollo React/Next.js puede
    // ejecutar el efecto, desmontarlo y volverlo a montar por Strict Mode.
    // Abortar la primera petición puede generar el mensaje:
    // "signal is aborted without reason".
    // En su lugar usamos una bandera para ignorar respuestas tardías.
    let cancelled = false;

    async function loadCatalog() {
      if (cancelled) return;

      setCatalogLoading(true);

      try {
        const response = await fetch('/api/products?active=true', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();

        const incoming = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.products)
            ? payload.products
            : [];

        if (!incoming.length) {
          throw new Error('No hay productos en la API');
        }

        // Si el componente ya fue desmontado, no actualizamos su estado.
        if (cancelled) return;

        setCatalogProducts(incoming as SofaProduct[]);
        setCatalogSource('api');
      } catch (error) {
        // Si el efecto ya fue limpiado, no mostramos fallback ni cambiamos estado.
        if (cancelled) return;

        console.warn(
          '[CatalogSection] No se pudo cargar /api/products. Se usará el catálogo local.',
          error
        );

        // Fallback seguro: la tienda sigue funcionando aunque la API esté
        // temporalmente indisponible o todavía se esté configurando.
        setCatalogProducts(sofaProducts);
        setCatalogSource('local');
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFilter = useCallback(
    (value: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      setter(
        current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
      );
    },
    []
  );

  const clearAll = useCallback(() => {
    setSearch('');
    setActiveCategory('');
    setActiveStyles([]);
    setActiveColors([]);
    setActiveSeats([]);
    setPriceRange('all');
    setMinRating(0);
    setSortBy('recommended');
    setVisibleCount(12);
    setFinderColor('');
    setFinderSeats('');
    setFinderStyle('');
    setFinderBudget('all');
  }, []);

  const applyFinder = useCallback(() => {
    setActiveColors(finderColor ? [finderColor] : []);
    setActiveSeats(finderSeats ? [finderSeats] : []);
    setActiveStyles(finderStyle ? [finderStyle] : []);
    setPriceRange(finderBudget);
    setShowFinder(false);

    window.setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [finderBudget, finderColor, finderSeats, finderStyle]);

  const filtered = useMemo(() => {
    const query = normalizeText(search);

    const result = catalogProducts.filter((sofa) => {
      const searchOk = !query || getSearchText(sofa).includes(query);
      const categoryOk = categoriesMatch(sofa.category, activeCategory);
      const styleOk = !activeStyles.length || activeStyles.includes(sofa.style);
      const colorOk = productMatchesColor(sofa, activeColors);
      const seatsOk = !activeSeats.length || activeSeats.includes(sofa.seats);
      const priceOk = matchesPriceRange(parsePrice(sofa.price), priceRange);
      const ratingOk = Number(sofa.rating ?? 0) >= minRating;

      return searchOk && categoryOk && styleOk && colorOk && seatsOk && priceOk && ratingOk;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0);
        case 'rating':
          return Number(b.rating ?? 0) - Number(a.rating ?? 0);
        case 'price-low':
          return parsePrice(a.price) - parsePrice(b.price);
        case 'price-high':
          return parsePrice(b.price) - parsePrice(a.price);
        case 'newest':
          return b.id - a.id;
        default:
          return getProductScore(b) - getProductScore(a);
      }
    });
  }, [
    search,
    activeCategory,
    activeStyles,
    activeColors,
    activeSeats,
    priceRange,
    minRating,
    sortBy,
    catalogProducts,
  ]);

  useEffect(() => {
    setVisibleCount(12);
  }, [
    search,
    activeCategory,
    activeStyles,
    activeColors,
    activeSeats,
    priceRange,
    minRating,
    sortBy,
  ]);

  const recentProducts = useMemo(
    () =>
      recentIds
        .map((id) => catalogProducts.find((sofa) => sofa.id === id))
        .filter(Boolean) as SofaProduct[],
    [recentIds, catalogProducts]
  );

  const recommendationSource = useMemo(
    () =>
      recommendationSourceId
        ? (catalogProducts.find((sofa) => sofa.id === recommendationSourceId) ?? null)
        : null,
    [recommendationSourceId, catalogProducts]
  );

  const recommendations = useMemo(() => {
    if (!recommendationSource) return [];

    return [...catalogProducts]
      .map((sofa) => ({
        sofa,
        score: getSimilarityScore(recommendationSource, sofa),
      }))
      .filter((item) => item.score >= 25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.sofa);
  }, [recommendationSource, catalogProducts]);

  const hasFilters =
    Boolean(search) ||
    Boolean(activeCategory) ||
    activeStyles.length > 0 ||
    activeColors.length > 0 ||
    activeSeats.length > 0 ||
    priceRange !== 'all' ||
    minRating > 0;

  return (
    <section id="catalogo" ref={catalogRef} className="py-16 sm:py-20 bg-muted/30 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Encabezado */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="inline-block text-primary font-bold text-xs sm:text-sm uppercase tracking-widest mb-3">
            Catálogo inteligente
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-3">
            Encuentra tu <span className="text-gradient-teal">sofá ideal</span>
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Busca por nombre, color, estilo, plazas, precio o características. El catálogo prioriza
            productos populares y mejor valorados.
          </p>
        </div>

        {/* Buscador + acciones */}
        <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-sm mb-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                🔎
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Busca sofá, color, estilo, SKU, material..."
                className="w-full h-12 rounded-2xl border border-border bg-white pl-11 pr-10 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                aria-label="Buscar productos"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-12 rounded-2xl border border-border bg-white px-4 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              aria-label="Ordenar productos"
            >
              <option value="recommended">✨ Recomendados</option>
              <option value="popular">🔥 Más vendidos</option>
              <option value="rating">⭐ Mejor valorados</option>
              <option value="price-low">💰 Precio menor</option>
              <option value="price-high">💎 Precio mayor</option>
              <option value="newest">🆕 Más recientes</option>
            </select>

            <button
              type="button"
              onClick={() => setShowFinder(true)}
              className="h-12 rounded-2xl bg-primary text-primary-foreground px-5 font-extrabold text-sm hover:bg-primary/90 transition-all"
            >
              🤖 Encuentra mi sofá
            </button>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="h-12 rounded-2xl border border-primary text-primary px-5 font-extrabold text-sm hover:bg-primary/5 transition-all"
            >
              ⚙️ {showFilters ? 'Ocultar filtros' : 'Filtros'}
            </button>
          </div>

          {/* Categorías rápidas */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => {
                setActiveCategory('');
                setVisibleCount(12);
                setRecommendationSourceId(null);
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-extrabold border transition-all ${
                !activeCategory
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              Todos
            </button>
            {CATEGORY_OPTIONS.map((category) => {
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setActiveCategory(isActive ? '' : category);
                    setVisibleCount(12);
                    setRecommendationSourceId(null);
                  }}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-extrabold border transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white border-border text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {category.replace('Sofás ', '')}
                </button>
              );
            })}
          </div>

          {showFilters && (
            <div className="mt-5 pt-5 border-t border-border space-y-5">
              <FilterGroup title="Estilo">
                {styleOptions.map((style) => (
                  <FilterButton
                    key={style}
                    active={activeStyles.includes(style)}
                    onClick={() => toggleFilter(style, activeStyles, setActiveStyles)}
                  >
                    {style}
                  </FilterButton>
                ))}
              </FilterGroup>

              <FilterGroup title="Color">
                {colorOptions.map((color) => (
                  <FilterButton
                    key={color}
                    active={activeColors.includes(color)}
                    onClick={() => toggleFilter(color, activeColors, setActiveColors)}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: colorMap[color] }}
                    />
                    {color}
                  </FilterButton>
                ))}
              </FilterGroup>

              <FilterGroup title="Plazas">
                {seatsOptions.map((seat) => (
                  <FilterButton
                    key={seat}
                    active={activeSeats.includes(seat)}
                    onClick={() => toggleFilter(seat, activeSeats, setActiveSeats)}
                  >
                    {seat}
                  </FilterButton>
                ))}
              </FilterGroup>

              <FilterGroup title="Presupuesto">
                {PRICE_OPTIONS.map((option) => (
                  <FilterButton
                    key={option.value}
                    active={priceRange === option.value}
                    onClick={() => setPriceRange(option.value)}
                  >
                    {option.label}
                  </FilterButton>
                ))}
              </FilterGroup>

              <FilterGroup title="Valoración mínima">
                {[0, 4, 4.5, 4.8].map((rating) => (
                  <FilterButton
                    key={rating}
                    active={minRating === rating}
                    onClick={() => setMinRating(rating)}
                  >
                    {rating === 0 ? 'Todas' : `⭐ ${rating}+`}
                  </FilterButton>
                ))}
              </FilterGroup>
            </div>
          )}
        </div>

        {/* Chips activos */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs font-bold text-muted-foreground">Filtros:</span>

            {search && <ActiveChip label={`“${search}”`} onRemove={() => setSearch('')} />}

            {activeCategory && (
              <ActiveChip
                label={activeCategory.replace('Sofás ', '')}
                onRemove={() => setActiveCategory('')}
              />
            )}

            {activeStyles.map((item) => (
              <ActiveChip
                key={`style-${item}`}
                label={item}
                onRemove={() => toggleFilter(item, activeStyles, setActiveStyles)}
              />
            ))}

            {activeColors.map((item) => (
              <ActiveChip
                key={`color-${item}`}
                label={item}
                onRemove={() => toggleFilter(item, activeColors, setActiveColors)}
              />
            ))}

            {activeSeats.map((item) => (
              <ActiveChip
                key={`seat-${item}`}
                label={item}
                onRemove={() => toggleFilter(item, activeSeats, setActiveSeats)}
              />
            ))}

            {priceRange !== 'all' && (
              <ActiveChip
                label={PRICE_OPTIONS.find((item) => item.value === priceRange)?.label ?? ''}
                onRemove={() => setPriceRange('all')}
              />
            )}

            {minRating > 0 && (
              <ActiveChip label={`⭐ ${minRating}+`} onRemove={() => setMinRating(0)} />
            )}

            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-bold text-muted-foreground underline hover:text-foreground"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Contador + recomendación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <p className="text-sm text-muted-foreground font-medium">
            Mostrando <span className="font-extrabold text-foreground">{filtered.length}</span> de{' '}
            <span className="font-extrabold text-foreground">{catalogProducts.length}</span> modelos
          </p>

          <div className="flex items-center gap-2">
            {catalogLoading && (
              <span className="text-xs font-bold text-muted-foreground">
                Actualizando catálogo...
              </span>
            )}
            {!catalogLoading && catalogSource === 'api' && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded-full px-3 py-2">
                ● Catálogo actualizado
              </span>
            )}
            {!catalogLoading && catalogSource === 'local' && (
              <span className="text-xs font-bold text-muted-foreground bg-muted rounded-full px-3 py-2">
                Catálogo disponible
              </span>
            )}
            {!hasFilters && (
              <div className="hidden sm:block text-xs font-bold text-primary bg-primary/10 rounded-full px-3 py-2">
                ✨ Ordenado para ayudarte a comprar mejor
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl text-center py-20 px-6">
            <div className="text-6xl mb-4">🛋️</div>
            <p className="text-foreground font-extrabold text-xl mb-2">
              No encontramos un sofá con esos criterios
            </p>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Prueba otro color, presupuesto o término de búsqueda.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="px-7 py-3 rounded-full bg-primary text-primary-foreground font-extrabold hover:bg-primary/90"
            >
              Ver todo el catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filtered.slice(0, visibleCount).map((sofa, index) => (
              <CatalogCard
                key={`catalog-${String(sofa.id)}`}
                sofa={sofa}
                rank={index}
                added={addedProductId === sofa.id}
                favorite={isFavorite(String(sofa.id), sofa.name)}
                favoritesLoading={favoritesLoading}
                loggedIn={Boolean(user)}
                onAdd={() => {
                  addItem({
                    id: String(sofa.id),
                    name: sofa.name,
                    price: sofa.price,
                    image: sofa.image,
                    alt: `${sofa.name} — ${sofa.style} ${sofa.color} ${sofa.seats}`,
                  });
                  setAddedProductId(sofa.id);
                  window.setTimeout(() => setAddedProductId(null), 1600);
                }}
                onFavorite={async () => {
                  if (!user || favoritesLoading) return;
                  await toggleFavorite(String(sofa.id), sofa.name);
                }}
                onViewed={() => {
                  const next = [sofa.id, ...recentIds.filter((id) => id !== sofa.id)].slice(0, 8);

                  setRecentIds(next);
                  setRecommendationSourceId(sofa.id);

                  try {
                    localStorage.setItem('polaris_recent_products', JSON.stringify(next));
                  } catch {
                    // No bloquear la navegación si localStorage está deshabilitado.
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Recomendaciones inteligentes */}
        {recommendationSource && recommendations.length > 0 && (
          <section className="mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-primary">
                  Para ti
                </p>
                <h3 className="text-2xl font-extrabold text-foreground mt-1">
                  También te puede interesar
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Seleccionamos modelos parecidos a{' '}
                  <span className="font-bold text-foreground">{recommendationSource.name}</span>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRecommendationSourceId(null)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Ocultar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendations.map((sofa) => (
                <RecommendationCard
                  key={`recommendation-${String(sofa.id)}`}
                  sofa={sofa}
                  badge={getCommercialBadge(sofa)}
                  added={addedProductId === sofa.id}
                  favorite={isFavorite(String(sofa.id), sofa.name)}
                  favoritesLoading={favoritesLoading}
                  loggedIn={Boolean(user)}
                  onAdd={() => {
                    addItem({
                      id: String(sofa.id),
                      name: sofa.name,
                      price: sofa.price,
                      image: sofa.image,
                      alt: `${sofa.name} — ${sofa.style} ${sofa.color}`,
                    });
                    setAddedProductId(sofa.id);
                    window.setTimeout(() => setAddedProductId(null), 1500);
                  }}
                  onFavorite={async () => {
                    if (!user || favoritesLoading) return;
                    await toggleFavorite(String(sofa.id), sofa.name);
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Vistos recientemente */}
        {!hasFilters && recentProducts.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-primary">
                  Para continuar
                </p>
                <h3 className="text-2xl font-extrabold text-foreground mt-1">
                  Vistos recientemente
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRecentIds([]);
                  localStorage.removeItem('polaris_recent_products');
                }}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-3">
              {recentProducts.map((sofa) => (
                <Link
                  key={sofa.id}
                  href={`/productos/${sofa.id}`}
                  className="shrink-0 w-56 bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-32 bg-muted">
                    <AppImage
                      src={sofa.image}
                      alt={sofa.name}
                      fill
                      className="object-cover"
                      sizes="224px"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-foreground line-clamp-1">{sofa.name}</p>
                    <p className="text-primary font-extrabold mt-1">{sofa.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Asistente "Encuentra mi sofá" */}
      {showFinder && (
        <FinderModal
          color={finderColor}
          seats={finderSeats}
          style={finderStyle}
          budget={finderBudget}
          setColor={setFinderColor}
          setSeats={setFinderSeats}
          setStyle={setFinderStyle}
          setBudget={setFinderBudget}
          onClose={() => setShowFinder(false)}
          onApply={applyFinder}
        />
      )}
    </section>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all ${
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-md'
          : 'bg-white border-border text-muted-foreground hover:border-primary hover:text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-primary/60"
        aria-label={`Quitar ${label}`}
      >
        ×
      </button>
    </span>
  );
}

function FinderModal({
  color,
  seats,
  style,
  budget,
  setColor,
  setSeats,
  setStyle,
  setBudget,
  onClose,
  onApply,
}: {
  color: string;
  seats: string;
  style: string;
  budget: PriceRange;
  setColor: (value: string) => void;
  setSeats: (value: string) => void;
  setStyle: (value: string) => void;
  setBudget: (value: PriceRange) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finder-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-primary">
                Asistente Polaris
              </p>
              <h3 id="finder-title" className="text-2xl font-extrabold text-foreground mt-1">
                Encuentra tu sofá ideal
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Elige tus preferencias y filtraremos el catálogo.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white border border-border text-muted-foreground hover:text-foreground"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <FinderSelect
            label="¿Qué estilo prefieres?"
            value={style}
            onChange={setStyle}
            options={['', ...styleOptions]}
            emptyLabel="Cualquier estilo"
          />

          <FinderSelect
            label="¿Qué color buscas?"
            value={color}
            onChange={setColor}
            options={['', ...colorOptions]}
            emptyLabel="Cualquier color"
          />

          <FinderSelect
            label="¿Cuántas plazas necesitas?"
            value={seats}
            onChange={setSeats}
            options={['', ...seatsOptions]}
            emptyLabel="Cualquier tamaño"
          />

          <FinderSelect
            label="¿Cuál es tu presupuesto?"
            value={budget}
            onChange={(value) => setBudget(value as PriceRange)}
            options={PRICE_OPTIONS.map((item) => item.value)}
            labels={Object.fromEntries(PRICE_OPTIONS.map((item) => [item.value, item.label]))}
            emptyLabel="Cualquier precio"
          />

          <button
            type="button"
            onClick={onApply}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold hover:bg-primary/90 transition-all"
          >
            🔎 Mostrar sofás compatibles
          </button>
        </div>
      </div>
    </div>
  );
}

function FinderSelect({
  label,
  value,
  onChange,
  options,
  emptyLabel,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  emptyLabel: string;
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-extrabold text-foreground mb-2">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-11 rounded-xl border border-border bg-white px-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
      >
        <option value="">{emptyLabel}</option>
        {options.filter(Boolean).map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function RecommendationCard({
  sofa,
  badge,
  added,
  favorite,
  favoritesLoading,
  loggedIn,
  onAdd,
  onFavorite,
}: {
  sofa: SofaProduct;
  badge: string;
  added: boolean;
  favorite: boolean;
  favoritesLoading: boolean;
  loggedIn: boolean;
  onAdd: () => void;
  onFavorite: () => void | Promise<void>;
}) {
  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
      <div className="relative h-44 bg-muted">
        <Link href={`/productos/${sofa.id}`} className="block w-full h-full">
          <AppImage
            src={sofa.image}
            alt={sofa.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        </Link>

        {badge && (
          <span className="absolute top-3 left-3 bg-white/95 text-foreground text-[11px] font-extrabold px-2.5 py-1.5 rounded-full shadow">
            {badge}
          </span>
        )}

        <button
          type="button"
          onClick={onFavorite}
          disabled={favoritesLoading}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center hover:scale-110 transition-transform"
          aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={favorite}
        >
          <svg
            viewBox="0 0 24 24"
            fill={favorite ? '#ef4444' : 'none'}
            stroke={favorite ? '#ef4444' : '#374151'}
            strokeWidth={2}
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <Link href={`/productos/${sofa.id}`} className="hover:text-primary">
          <h4 className="font-extrabold text-foreground line-clamp-2">{sofa.name}</h4>
        </Link>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-yellow-500">★</span>
          <span className="text-xs font-bold">{Number(sofa.rating ?? 0).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({Number(sofa.reviewCount ?? 0)})</span>
        </div>

        <div className="flex items-end justify-between gap-3 mt-4">
          <span className="text-xl font-extrabold text-primary">{sofa.price}</span>
          <button
            type="button"
            onClick={onAdd}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold ${added ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            {added ? '✓ Agregado' : '🛒 Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}

function CatalogCard({
  sofa,
  rank,
  onViewed,
  added,
  favorite,
  favoritesLoading,
  loggedIn,
  onAdd,
  onFavorite,
}: {
  sofa: SofaProduct;
  rank: number;
  onViewed: () => void;
  added: boolean;
  favorite: boolean;
  favoritesLoading: boolean;
  loggedIn: boolean;
  onAdd: () => void;
  onFavorite: () => void | Promise<void>;
}) {
  const rating = Number(sofa.rating ?? 0);
  const reviewCount = Number(sofa.reviewCount ?? 0);
  const badge =
    sofa.id === 12
      ? '⭐ Exclusivo'
      : getCommercialBadge(sofa) || (rank < 3 ? '✨ Recomendado' : '');

  return (
    <article className="catalog-card card-hover bg-card rounded-2xl overflow-hidden border border-border shadow-sm flex flex-col">
      <div className="relative h-56 overflow-hidden bg-muted group">
        <Link href={`/productos/${sofa.id}`} onClick={onViewed} className="block w-full h-full">
          <AppImage
            src={sofa.image}
            alt={`${sofa.name} — ${sofa.style}, ${sofa.color}, ${sofa.seats}`}
            fill
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>

        {badge && (
          <span className="absolute top-3 left-3 bg-white/95 text-foreground text-[11px] font-extrabold px-2.5 py-1.5 rounded-full shadow">
            {badge}
          </span>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!loggedIn || favoritesLoading) return;
            void onFavorite();
          }}
          disabled={favoritesLoading}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 shadow flex items-center justify-center hover:scale-110 transition-transform"
          aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={favorite}
        >
          <svg
            viewBox="0 0 24 24"
            fill={favorite ? '#ef4444' : 'none'}
            stroke={favorite ? '#ef4444' : '#374151'}
            strokeWidth={2}
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/productos/${sofa.id}`} onClick={onViewed} className="hover:text-primary">
          <h3 className="font-extrabold text-base sm:text-lg text-foreground line-clamp-2">
            {sofa.name}
          </h3>
        </Link>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sofa.description}</p>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-[11px] font-bold">
            {sofa.category}
          </span>
          {sofa.subcategory && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              {sofa.subcategory}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-yellow-500">★</span>
          <span className="text-xs font-bold">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
          {sofa.color && <span className="text-xs text-muted-foreground">• {sofa.color}</span>}
        </div>

        <div className="flex items-end justify-between gap-3 mt-auto pt-5">
          <div>
            <span className="block text-xs text-muted-foreground">Precio</span>
            <span className="text-xl font-extrabold text-primary">{sofa.price}</span>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onAdd();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${added ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            {added ? '✓ Agregado' : '🛒 Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}
