'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

/* =========================================================
   TIPOS
========================================================= */

interface Product {
  id: string;
  categoryId: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  imageUrl: string | null;
  images: string[];
  stock: number;
  isActive: boolean;
  subcategory: string | null;
  categoryName: string;

  colorPrincipal: string | null;
  colores: string[];
  colorConfianza: number;

  videoUrl: string | null;
  videoPortadaUrl: string | null;

  clasificacion: number;
  reviewCount: number;
  destacado: boolean;
  masVendido: boolean;
  ordenDestacado: number;
  favoritos: number;
  visitas: number;
}

/* =========================================================
   CATEGORÍAS OFICIALES
========================================================= */

const OFFICIAL_CATEGORIES = [
  'Sofás Europeo',
  'Sofás Modulares',
  'Sofás Seccionales',
  'Sofás Cama',
  'Sofás 3-2-1',
  'Pufs y Decorativos',
] as const;

type OfficialCategory = (typeof OFFICIAL_CATEGORIES)[number];

const CATEGORY_STRUCTURE: Record<
  OfficialCategory,
  string[]
> = {
  'Sofás Europeo': [
    'Europeo Mediano',
    'Europeo Mini',
    'Europeo Mini Modular',
  ],

  'Sofás Modulares': [
    'Modular Suelto',
  ],

  'Sofás Seccionales': [
    'Seccionales Sueltos',
    'Seccionales con Parlantes',
  ],

  'Sofás Cama': [
    'Sofás Cama Sueltos',
  ],

  'Sofás 3-2-1': [
    'Sofás 3-2-1-Sueltos',
  ],

  'Pufs y Decorativos': [],
};

/* =========================================================
   ALIAS DE CATEGORÍAS
========================================================= */

const CATEGORY_ALIASES: Record<
  OfficialCategory,
  string[]
> = {
  'Sofás Europeo': [
    'sofás europeo',
    'sofás europeos',
    'sofá europeo',
    'sofá europeos',
    'sofás modelo europeo',
    'sofá modelo europeo',
    'europea',
    'europa',
    'europeo',
  ],

  'Sofás Modulares': [
    'sofás modulares',
    'sofá modular',
    'sofás modular',
    'modular',
    'modulares',
  ],

  'Sofás Seccionales': [
    'sofás seccionales',
    'sofá seccional',
    'sofás seccional',
    'seccional',
    'seccionales',
    'sectional',
    'parlante',
    'parlantes',
  ],

  'Sofás Cama': [
    'sofás cama',
    'sofá cama',
    'sofa cama',
    'cama',
  ],

  'Sofás 3-2-1': [
    'sofás 3-2-1',
    'sofá 3-2-1',
    '3_2_1',
    '3-2-1',
    '3 2 1',
  ],

  'Pufs y Decorativos': [
    'pufs',
    'puffs',
    'puf',
    'puff',
    'decorativos',
  ],
};

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function readString(
  row: Record<string, any>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = row[key];

    if (
      typeof value === 'string' &&
      value.trim() !== ''
    ) {
      return value.trim();
    }
  }

  return null;
}

function readNumber(
  row: Record<string, any>,
  ...keys: string[]
): number {
  for (const key of keys) {
    const value = row[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== ''
    ) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function readBoolean(
  row: Record<string, any>,
  fallback: boolean,
  ...keys: string[]
): boolean {
  for (const key of keys) {
    if (typeof row[key] === 'boolean') {
      return row[key];
    }
  }

  return fallback;
}

function readStringArray(
  row: Record<string, any>,
  ...keys: string[]
): string[] {
  for (const key of keys) {
    const value = row[key];

    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string =>
          typeof item === 'string' &&
          item.trim() !== '',
      );
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item): item is string =>
              typeof item === 'string' &&
              item.trim() !== '',
          );
        }
      } catch {
        return [];
      }
    }
  }

  return [];
}

/* =========================================================
   CATEGORÍA CANÓNICA
========================================================= */

function canonicalCategory(
  value: string | null,
): OfficialCategory | null {
  if (!value) {
    return null;
  }

  const normalized = normalizeText(value);

  for (const category of OFFICIAL_CATEGORIES) {
    const aliases =
      CATEGORY_ALIASES[category];

    if (
      aliases.some(
        (alias) =>
          normalizeText(alias) === normalized,
      )
    ) {
      return category;
    }
  }

  return null;
}

/* =========================================================
   DETECCIÓN AUTOMÁTICA DE CATEGORÍA
========================================================= */

function inferCategory(
  row: Record<string, any>,
): OfficialCategory | 'Sin categoría' {
  const explicitCategory = readString(
    row,
    'categoria',
    'categoría',
    'categoria_nombre',
    'nombre_categoria',
    'category_name',
    'category',
  );

  const subcategory = readString(
    row,
    'subcategoría',
    'subcategoria',
    'subcategory',
  );

  const shippingCategory = readString(
    row,
    'categoría_de_envío',
    'categoria_de_envio',
    'shipping_category',
  );

  const name = readString(
    row,
    'nombre',
    'name',
  );

  const slug = readString(
    row,
    'babosa',
    'slug',
  );

  const direct =
    canonicalCategory(
      explicitCategory,
    );

  if (direct) {
    return direct;
  }

  const text = normalizeText(
    [
      explicitCategory ?? '',
      subcategory ?? '',
      shippingCategory ?? '',
      name ?? '',
      slug ?? '',
    ].join(' '),
  );

  /*
   * El orden importa.
   * Primero comprobamos 3-2-1 y categorías especiales.
   */

  if (
    /3[\s_-]*2[\s_-]*1/.test(text) ||
    text.includes('3_2_1')
  ) {
    return 'Sofás 3-2-1';
  }

  if (
    text.includes('puf') ||
    text.includes('puff') ||
    text.includes('decorativ')
  ) {
    return 'Pufs y Decorativos';
  }

  if (
    text.includes('seccional') ||
    text.includes('sectional') ||
    text.includes('parlante')
  ) {
    return 'Sofás Seccionales';
  }

  if (
    text.includes('modular') ||
    text.includes('modulares')
  ) {
    return 'Sofás Modulares';
  }

  if (
    text.includes('cama') ||
    text.includes('sofa cama')
  ) {
    return 'Sofás Cama';
  }

  if (
    text.includes('europe') ||
    text.includes('europeo') ||
    text.includes('europea') ||
    text.includes('europa')
  ) {
    return 'Sofás Europeo';
  }

  return 'Sin categoría';
}

/* =========================================================
   NORMALIZAR PRODUCTO REAL DE SUPABASE
========================================================= */

function normalizeProduct(
  row: Record<string, any>,
): Product {
  const images = readStringArray(
    row,
    'imágenes',
    'imagenes',
    'images',
  );

  const imageUrl =
    readString(
      row,
      'URL de la imagen',
      'url_de_la_imagen',
      'image_url',
    ) ??
    images[0] ??
    null;

  const colors = readStringArray(
    row,
    'colores',
    'colors',
  );

  return {
    id:
      readString(
        row,
        'identificación',
        'identificacion',
        'id',
      ) ?? '',

    categoryId: readString(
      row,
      'ID de categoría',
      'id_de_categoria',
      'category_id',
    ),

    name:
      readString(
        row,
        'nombre',
        'name',
      ) ?? 'Producto sin nombre',

    slug: readString(
      row,
      'babosa',
      'slug',
    ),

    description: readString(
      row,
      'descripción',
      'descripcion',
      'description',
    ),

    price: readNumber(
      row,
      'precio',
      'price',
    ),

    imageUrl,

    images,

    stock: readNumber(
      row,
      'existencias',
      'stock',
    ),

    isActive: readBoolean(
      row,
      true,
      'está_activo',
      'esta_activo',
      'is_active',
    ),

    subcategory: readString(
      row,
      'subcategoría',
      'subcategoria',
      'subcategory',
    ),

    categoryName: inferCategory(row),

    colorPrincipal: readString(
      row,
      'color_principal',
    ),

    colores: colors,

    colorConfianza: readNumber(
      row,
      'color_confianza',
    ),

    videoUrl: readString(
      row,
      'URL del video',
      'url_del_video',
      'video_url',
    ),

    videoPortadaUrl: readString(
      row,
      'video_portada_url',
    ),

    clasificacion: readNumber(
      row,
      'clasificación',
      'clasificacion',
    ),

    reviewCount: readNumber(
      row,
      'recuento_de_revisiones',
      'review_count',
    ),

    destacado: readBoolean(
      row,
      false,
      'destacado',
    ),

    masVendido: readBoolean(
      row,
      false,
      'mas_vendido',
    ),

    ordenDestacado: readNumber(
      row,
      'orden_destacado',
    ),

    favoritos: readNumber(
      row,
      'favoritos',
    ),

    visitas: readNumber(
      row,
      'visitas',
    ),
  };
}

/* =========================================================
   PÁGINA
========================================================= */

export default function AdminProductsPage() {
  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const [selectedSubcategory, setSelectedSubcategory] =
    useState<string | null>(null);

  const [openCategories, setOpenCategories] =
    useState<Record<string, boolean>>({});

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  /* =======================================================
     CARGAR PRODUCTOS
  ======================================================= */

  const loadProducts = useCallback(
    async () => {
      setLoading(true);
      setError('');

      try {
        /*
         * IMPORTANTE:
         * No usamos order() con columnas que podrían no existir.
         * No consultamos la tabla categorías.
         */
        const {
          data,
          error: productsError,
        } = await supabase
          .from('products')
          .select('*');

        if (productsError) {
          console.error(
            'ERROR OBTENIENDO PRODUCTOS:',
            productsError,
          );

          throw new Error(
            productsError.message ||
              'No se pudieron obtener los productos.',
          );
        }

        const normalized =
          (data ?? [])
            .map(
              (row: Record<string, any>) =>
                normalizeProduct(row),
            )
            .filter(
              (product) =>
                product.id !== '',
            )
            .sort(
              (a, b) =>
                a.name.localeCompare(
                  b.name,
                  'es',
                ),
            );

        setProducts(normalized);

        console.info(
          `PRODUCTOS CARGADOS CORRECTAMENTE: ${normalized.length}`,
        );
      } catch (err: any) {
        console.error(
          'ERROR OBTENIENDO PRODUCTOS:',
          err,
        );

        setProducts([]);

        setError(
          err?.message ||
            'No se pudieron cargar los productos.',
        );
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  /* =======================================================
     FILTROS
  ======================================================= */

  const filteredProducts =
    useMemo(() => {
      const query =
        normalizeText(search);

      return products.filter(
        (product) => {
          const searchableText =
            normalizeText(
              [
                product.name,
                product.description ?? '',
                product.categoryName,
                product.subcategory ?? '',
                product.colorPrincipal ?? '',
                product.slug ?? '',
              ].join(' '),
            );

          const matchesSearch =
            !query ||
            searchableText.includes(
              query,
            );

          const matchesCategory =
            !selectedCategory ||
            product.categoryName ===
              selectedCategory;

          const matchesSubcategory =
            !selectedSubcategory ||
            normalizeText(
              product.subcategory ??
                '',
            ) ===
              normalizeText(
                selectedSubcategory,
              );

          return (
            matchesSearch &&
            matchesCategory &&
            matchesSubcategory
          );
        },
      );
    }, [
      products,
      search,
      selectedCategory,
      selectedSubcategory,
    ]);

  /* =======================================================
     CONTADORES
  ======================================================= */

  const categoryCounts =
    useMemo(() => {
      const result: Record<
        string,
        number
      > = {};

      for (const category of OFFICIAL_CATEGORIES) {
        result[category] =
          products.filter(
            (product) =>
              product.categoryName ===
              category,
          ).length;
      }

      return result;
    }, [products]);

  function getSubcategoryCount(
    category: string,
    subcategory: string,
  ) {
    return products.filter(
      (product) =>
        product.categoryName ===
          category &&
        normalizeText(
          product.subcategory ??
            '',
        ) ===
          normalizeText(
            subcategory,
          ),
    ).length;
  }

  /* =======================================================
     SELECCIONAR CATEGORÍA
  ======================================================= */

  function selectCategory(
    category: string,
  ) {
    setSelectedCategory(
      category,
    );

    setSelectedSubcategory(
      null,
    );
  }

  function toggleCategory(
    category: string,
  ) {
    setOpenCategories(
      (previous) => ({
        ...previous,
        [category]:
          !previous[category],
      }),
    );

    selectCategory(
      category,
    );
  }

  function selectSubcategory(
    category: string,
    subcategory: string,
  ) {
    setSelectedCategory(
      category,
    );

    setSelectedSubcategory(
      subcategory,
    );

    setOpenCategories(
      (previous) => ({
        ...previous,
        [category]: true,
      }),
    );
  }

  function clearFilters() {
    setSearch('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  }

  /* =======================================================
     CAMBIAR ESTADO
  ======================================================= */

  async function toggleProductStatus(
    product: Product,
  ) {
    if (updatingId) {
      return;
    }

    setUpdatingId(product.id);

    const newStatus =
      !product.isActive;

    try {
      /*
       * ESTA ES LA COLUMNA REAL QUE
       * CONFIRMAMOS EN SUPABASE.
       */
      const { error } =
        await supabase
          .from('products')
          .update({
            'está_activo':
              newStatus,
          })
          .eq(
            'identificación',
            product.id,
          );

      if (error) {
        console.error(
          'ERROR ACTUALIZANDO ESTADO:',
          error,
        );

        alert(
          error.message ||
            'No se pudo actualizar el estado.',
        );

        return;
      }

      setProducts(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              product.id
                ? {
                    ...item,
                    isActive:
                      newStatus,
                  }
                : item,
          ),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /* =======================================================
     ELIMINAR PRODUCTO
  ======================================================= */

  async function deleteProduct(
    product: Product,
  ) {
    if (deletingId) {
      return;
    }

    const confirmed =
      window.confirm(
        `¿Estás seguro de eliminar "${product.name}"?\n\nEsta acción no se puede deshacer.`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);

    try {
      /*
       * IDENTIFICACIÓN es la clave
       * primaria real de products.
       */
      const { error } =
        await supabase
          .from('products')
          .delete()
          .eq(
            'identificación',
            product.id,
          );

      if (error) {
        console.error(
          'ERROR ELIMINANDO PRODUCTO:',
          error,
        );

        alert(
          error.message ||
            'No se pudo eliminar el producto.',
        );

        return;
      }

      setProducts(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              product.id,
          ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =======================================================
     FORMATO DE PRECIO
  ======================================================= */

  function formatPrice(
    price: number,
  ) {
    return price.toLocaleString(
      'es-PE',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    );
  }

  /* =======================================================
     IMAGEN
  ======================================================= */

  function getProductImage(
    product: Product,
  ) {
    return (
      product.imageUrl ||
      product.images[0] ||
      null
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">

          <div className="flex items-center gap-3">

            <Link
              href="/admin"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
              title="Volver al Dashboard"
            >
              <ArrowLeft
                size={18}
              />
            </Link>

            <div>
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                Productos
              </h1>

              <p className="hidden text-sm text-slate-500 sm:block">
                Gestiona el catálogo inteligente de Mueblería Polaris.
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                void loadProducts()
              }
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-50"
              title="Actualizar productos"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? 'animate-spin'
                    : ''
                }
              />
            </button>

            <Link
              href="/admin/productos/nuevo"
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <Plus
                size={18}
              />
              <span className="hidden sm:inline">
                Nuevo producto
              </span>
            </Link>

          </div>

        </div>

      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">

        {/* =================================================
            MENSAJE DE ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">

            <div>
              <p className="font-black">
                No se pudieron cargar los productos.
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="shrink-0 rounded-lg p-1 hover:bg-red-100"
            >
              <X size={18} />
            </button>

          </div>
        )}

        {/* =================================================
            RESUMEN DE CATEGORÍAS
        ================================================= */}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">

          {OFFICIAL_CATEGORIES.map(
            (category) => {
              const selected =
                selectedCategory ===
                category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    selectCategory(
                      category,
                    )
                  }
                  className={`rounded-2xl border bg-white p-4 text-left transition ${
                    selected
                      ? 'border-cyan-400 ring-2 ring-cyan-100'
                      : 'border-slate-200 hover:border-cyan-300 hover:shadow-sm'
                  }`}
                >

                  <div className="mb-3 flex items-center justify-between">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                      <Package
                        size={18}
                      />
                    </div>

                    <span className="text-xl font-black text-slate-900">
                      {categoryCounts[
                        category
                      ] ?? 0}
                    </span>

                  </div>

                  <p className="text-xs font-bold leading-tight text-slate-700 sm:text-sm">
                    {category}
                  </p>

                </button>
              );
            },
          )}

        </div>

        {/* =================================================
            CONTENEDOR PRINCIPAL
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* =================================================
              BARRA DE BÚSQUEDA
          ================================================= */}

          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Catálogo
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredProducts.length}{' '}
                producto
                {filteredProducts.length ===
                1
                  ? ''
                  : 's'}{' '}
                encontrado
                {filteredProducts.length ===
                1
                  ? ''
                  : 's'}
              </p>
            </div>

            <div className="relative w-full lg:max-w-[420px]">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Buscar sofá, categoría, color..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
              />

            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr]">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">

              <div className="mb-3 flex items-center justify-between">

                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Categorías
                </p>

                {(selectedCategory ||
                  selectedSubcategory ||
                  search) && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-700"
                  >
                    Limpiar
                  </button>
                )}

              </div>

              <div className="space-y-1">

                {OFFICIAL_CATEGORIES.map(
                  (category) => {
                    const subcategories =
                      CATEGORY_STRUCTURE[
                        category
                      ];

                    const hasSubcategories =
                      subcategories.length >
                      0;

                    const isOpen =
                      Boolean(
                        openCategories[
                          category
                        ],
                      );

                    const selected =
                      selectedCategory ===
                        category &&
                      !selectedSubcategory;

                    return (
                      <div
                        key={category}
                      >

                        <div
                          className={`flex items-center rounded-xl transition ${
                            selected
                              ? 'bg-cyan-50'
                              : 'hover:bg-white'
                          }`}
                        >

                          {hasSubcategories ? (
                            <button
                              type="button"
                              onClick={() =>
                                toggleCategory(
                                  category,
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center text-slate-400"
                              aria-label={
                                isOpen
                                  ? 'Cerrar categoría'
                                  : 'Abrir categoría'
                              }
                            >
                              {isOpen ? (
                                <ChevronDown
                                  size={17}
                                />
                              ) : (
                                <ChevronRight
                                  size={17}
                                />
                              )}
                            </button>
                          ) : (
                            <div className="w-10" />
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              selectCategory(
                                category,
                              )
                            }
                            className="flex flex-1 items-center justify-between py-2.5 pr-3 text-left"
                          >

                            <span
                              className={`text-sm font-bold ${
                                selected
                                  ? 'text-cyan-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              {category}
                            </span>

                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-500">
                              {categoryCounts[
                                category
                              ] ?? 0}
                            </span>

                          </button>

                        </div>

                        {hasSubcategories &&
                          isOpen && (
                            <div className="ml-10 mt-1 space-y-1 border-l border-slate-200 pl-2">

                              {subcategories.map(
                                (
                                  subcategory,
                                ) => {
                                  const subSelected =
                                    selectedSubcategory ===
                                    subcategory;

                                  const count =
                                    getSubcategoryCount(
                                      category,
                                      subcategory,
                                    );

                                  return (
                                    <button
                                      key={
                                        subcategory
                                      }
                                      type="button"
                                      onClick={() =>
                                        selectSubcategory(
                                          category,
                                          subcategory,
                                        )
                                      }
                                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                                        subSelected
                                          ? 'bg-cyan-100 text-cyan-700'
                                          : 'text-slate-500 hover:bg-white hover:text-slate-700'
                                      }`}
                                    >

                                      <span>
                                        {
                                          subcategory
                                        }
                                      </span>

                                      <span className="text-[10px] text-slate-400">
                                        {count}
                                      </span>

                                    </button>
                                  );
                                },
                              )}

                            </div>
                          )}

                      </div>
                    );
                  },
                )}

              </div>

            </aside>

            {/* =================================================
                TABLA
            ================================================= */}

            <div className="min-w-0">

              {loading ? (
                <div className="flex min-h-[450px] flex-col items-center justify-center">

                  <RefreshCw
                    size={34}
                    className="animate-spin text-cyan-600"
                  />

                  <p className="mt-4 font-bold text-slate-700">
                    Cargando productos...
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Conectando con Supabase
                  </p>

                </div>
              ) : filteredProducts.length ===
                0 ? (
                <div className="flex min-h-[450px] flex-col items-center justify-center px-6 text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Package
                      size={28}
                    />
                  </div>

                  <h3 className="mt-4 text-lg font-black text-slate-800">
                    No hay productos
                  </h3>

                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    No encontramos productos con los filtros actuales.
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">

                    {(selectedCategory ||
                      selectedSubcategory ||
                      search) && (
                      <button
                        type="button"
                        onClick={
                          clearFilters
                        }
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Limpiar filtros
                      </button>
                    )}

                    <Link
                      href="/admin/productos/nuevo"
                      className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700"
                    >
                      <Plus
                        size={16}
                      />
                      Nuevo producto
                    </Link>

                  </div>

                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[950px] border-collapse">

                    <thead>

                      <tr className="border-b border-slate-200 bg-slate-50/80">

                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Producto
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Categoría
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Precio
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Stock
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Estado
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                          Acciones
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {filteredProducts.map(
                        (product) => {
                          const image =
                            getProductImage(
                              product,
                            );

                          return (
                            <tr
                              key={
                                product.id
                              }
                              className="border-b border-slate-100 transition hover:bg-slate-50/70"
                            >

                              {/* PRODUCTO */}

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-3">

                                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">

                                    {image ? (
                                      <img
                                        src={
                                          image
                                        }
                                        alt={
                                          product.name
                                        }
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                                        <Package
                                          size={
                                            22
                                          }
                                        />
                                      </div>
                                    )}

                                  </div>

                                  <div className="min-w-0">

                                    <p className="max-w-[300px] truncate font-bold text-slate-800">
                                      {
                                        product.name
                                      }
                                    </p>

                                    <p className="mt-1 max-w-[320px] truncate text-xs text-slate-400">
                                      {product.description ||
                                        'Sin descripción'}
                                    </p>

                                    {product.colorPrincipal && (
                                      <div className="mt-1 flex items-center gap-2">

                                        <span className="text-[10px] font-semibold text-slate-400">
                                          Color:
                                        </span>

                                        <span className="text-[10px] font-bold text-cyan-600">
                                          {
                                            product.colorPrincipal
                                          }
                                        </span>

                                        {product.colorConfianza >
                                          0 && (
                                          <span className="text-[9px] text-slate-400">
                                            {Math.round(
                                              product.colorConfianza *
                                                100,
                                            )}
                                            %
                                          </span>
                                        )}

                                      </div>
                                    )}

                                  </div>

                                </div>

                              </td>

                              {/* CATEGORÍA */}

                              <td className="px-5 py-4">

                                <div className="flex flex-col items-start gap-1">

                                  <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">
                                    {
                                      product.categoryName
                                    }
                                  </span>

                                  {product.subcategory && (
                                    <span className="text-[10px] font-semibold text-slate-400">
                                      {
                                        product.subcategory
                                      }
                                    </span>
                                  )}

                                </div>

                              </td>

                              {/* PRECIO */}

                              <td className="px-5 py-4">

                                <span className="font-black text-slate-800">
                                  S/{' '}
                                  {formatPrice(
                                    product.price,
                                  )}
                                </span>

                              </td>

                              {/* STOCK */}

                              <td className="px-5 py-4">

                                <span
                                  className={`font-black ${
                                    product.stock <=
                                    0
                                      ? 'text-red-600'
                                      : product.stock <=
                                          3
                                        ? 'text-amber-600'
                                        : 'text-slate-700'
                                  }`}
                                >
                                  {
                                    product.stock
                                  }
                                </span>

                              </td>

                              {/* ESTADO */}

                              <td className="px-5 py-4">

                                <button
                                  type="button"
                                  disabled={
                                    updatingId ===
                                    product.id
                                  }
                                  onClick={() =>
                                    void toggleProductStatus(
                                      product,
                                    )
                                  }
                                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                                    product.isActive
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  } ${
                                    updatingId ===
                                    product.id
                                      ? 'cursor-wait opacity-50'
                                      : ''
                                  }`}
                                >
                                  {updatingId ===
                                  product.id
                                    ? 'Guardando...'
                                    : product.isActive
                                      ? 'Activo'
                                      : 'Inactivo'}
                                </button>

                              </td>

                              {/* ACCIONES */}

                              <td className="px-5 py-4">

                                <div className="flex justify-end gap-2">

                                  <Link
                                    href={`/productos/${product.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                    title="Ver producto"
                                  >
                                    <Eye
                                      size={
                                        16
                                      }
                                    />
                                  </Link>

                                  <Link
                                    href={`/admin/productos/${product.id}`}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                    title="Editar producto"
                                  >
                                    <Edit
                                      size={
                                        16
                                      }
                                    />
                                  </Link>

                                  <button
                                    type="button"
                                    disabled={
                                      deletingId ===
                                      product.id
                                    }
                                    onClick={() =>
                                      void deleteProduct(
                                        product,
                                      )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                                    title="Eliminar producto"
                                  >
                                    {deletingId ===
                                    product.id ? (
                                      <RefreshCw
                                        size={
                                          16
                                        }
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Trash2
                                        size={
                                          16
                                        }
                                      />
                                    )}
                                  </button>

                                </div>

                              </td>

                            </tr>
                          );
                        },
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}