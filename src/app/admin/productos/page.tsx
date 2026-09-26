'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug?: string | null;
}

interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  stock: number | null;
  is_active: boolean | null;
  subcategory: string | null;
}

interface Subcategory {
  name: string;
  count: number;
}

const CATEGORY_STRUCTURE: Record<string, Subcategory[]> = {
  'Sofás Europeo': [
    { name: 'Europeo en Medida Original', count: 30 },
    { name: 'Europeo Mediano', count: 30 },
    { name: 'Europeo Mini', count: 30 },
    { name: 'Europeo Mini Modular', count: 30 },
  ],
  'Sofás Modulares': [
    { name: 'Modular Fijo', count: 30 },
    { name: 'Modular Suelto', count: 30 },
  ],
  'Sofás Seccionales': [
    { name: 'Seccional Fijo', count: 30 },
    { name: 'Seccionales Sueltos', count: 30 },
    { name: 'Seccionales con Parlantes', count: 30 },
  ],
  'Sofás Cama': [
    { name: 'Sofá Cama Fijo', count: 20 },
    { name: 'Sofás Cama Sueltos', count: 20 },
  ],
  'Sofás 3-2-1': [{ name: 'Sofás 3-2-1-Sueltos', count: 40 }],
  'Pufs y Decorativos': [
    { name: 'Pufs', count: 30 },
    { name: 'Decorativos', count: 30 },
  ],
  'Sofás Reclinables': [],
  Comedores: [],
};

const OFFICIAL_CATEGORIES = [
  'Sofás Europeo',
  'Sofás Modulares',
  'Sofás Seccionales',
  'Sofás Cama',
  'Sofás 3-2-1',
  'Pufs y Decorativos',
  'Sofás Reclinables',
  'Comedores',
];

const CATEGORY_ALIASES: Record<string, string[]> = {
  'Sofás Europeo': [
    'Sofás Europeo',
    'Sofás Europeos',
    'Sofá Europeo',
    'Sofá Europeos',
    'Sofás Modelo Europeo',
    'Sofá Modelo Europeo',
  ],
  'Sofás Modulares': ['Sofás Modulares', 'Sofá Modular', 'Sofás Modular'],
  'Sofás Seccionales': ['Sofás Seccionales', 'Sofá Seccional', 'Sofás Seccional'],
  'Sofás Cama': ['Sofás Cama', 'Sofá Cama'],
  'Sofás 3-2-1': ['Sofás 3-2-1', 'Sofá 3-2-1'],
  'Pufs y Decorativos': ['Pufs y Decorativos', 'Puffs y Decorativos', 'Pufs', 'Puffs'],
  'Sofás Reclinables': [
    'Sofás Reclinables',
    'Sofas Reclinables',
    'Sofá Reclinable',
    'Sofa Reclinable',
    'RECLINABLE',
  ],
  Comedores: ['Comedores', 'Comedor', 'COMEDORES'],
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getCanonicalCategoryName(databaseName: string) {
  const normalizedDatabaseName = normalizeText(databaseName);

  for (const canonicalName of OFFICIAL_CATEGORIES) {
    const aliases = CATEGORY_ALIASES[canonicalName] ?? [];

    const matches = aliases.some((alias) => normalizeText(alias) === normalizedDatabaseName);

    if (matches) {
      return canonicalName;
    }
  }

  return null;
}

export default function AdminProductsPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // =========================================================
  // CARGAR PRODUCTOS Y CATEGORÍAS
  // =========================================================

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError('');

    const [
      { data: productsData, error: productsError },
      { data: categoriesData, error: categoriesError },
    ] = await Promise.all([
      supabase
        .from('products')
        .select(
          `
          id,
          category_id,
          name,
          slug,
          description,
          price,
          image_url,
          stock,
          is_active,
          subcategory
          `
        )
        .order('created_at', {
          ascending: false,
        }),

      supabase.from('categories').select('id, name, slug').order('name', {
        ascending: true,
      }),
    ]);

    if (productsError) {
      console.error('Error obteniendo productos:', productsError);

      setError('No se pudieron cargar los productos.');
    }

    if (categoriesError) {
      console.error('Error obteniendo categorías:', categoriesError);
    }

    setProducts(productsData ?? []);

    setCategories(categoriesData ?? []);

    setLoading(false);
  }

  // =========================================================
  // MAPA DE CATEGORÍAS
  //
  // IMPORTANTE:
  // Una categoría puede tener más de un ID en la base.
  // Por eso usamos SET de IDs y no un solo ID.
  // =========================================================

  const categoryIdsByCanonicalName = useMemo(() => {
    const result = new Map<string, Set<string>>();

    for (const categoryName of OFFICIAL_CATEGORIES) {
      result.set(categoryName, new Set<string>());
    }

    categories.forEach((category) => {
      const canonicalName = getCanonicalCategoryName(category.name);

      const categoryKey = canonicalName ?? category.name;

      if (!result.has(categoryKey)) {
        result.set(categoryKey, new Set<string>());
      }

      const ids = result.get(categoryKey);

      if (ids) {
        ids.add(category.id);
      }
    });

    return result;
  }, [categories]);

  const dashboardCategories = useMemo(
    () => Array.from(categoryIdsByCanonicalName.keys()),
    [categoryIdsByCanonicalName]
  );

  // =========================================================
  // OBTENER NOMBRE CANÓNICO DE UNA CATEGORÍA
  // =========================================================

  function getCategoryName(categoryId: string | null) {
    if (!categoryId) {
      return 'Sin categoría';
    }

    const category = categories.find((item) => item.id === categoryId);

    if (!category) {
      return 'Sin categoría';
    }

    return getCanonicalCategoryName(category.name) ?? category.name;
  }

  // =========================================================
  // CAMBIAR CATEGORÍA
  // =========================================================

  function toggleCategory(categoryName: string) {
    setOpenCategories((previous) => ({
      ...previous,
      [categoryName]: !previous[categoryName],
    }));

    setSelectedCategory(categoryName);

    setSelectedSubcategory(null);
  }

  function selectCategory(categoryName: string) {
    setSelectedCategory(categoryName);

    setSelectedSubcategory(null);
  }

  function selectSubcategory(categoryName: string, subcategoryName: string) {
    setSelectedCategory(categoryName);

    setSelectedSubcategory(subcategoryName);
  }

  // =========================================================
  // FILTRAR PRODUCTOS
  // =========================================================

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      // -----------------------------------------------
      // BUSCADOR
      // -----------------------------------------------

      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.description ?? '').toLowerCase().includes(normalizedSearch) ||
        (product.subcategory ?? '').toLowerCase().includes(normalizedSearch);

      // -----------------------------------------------
      // CATEGORÍA
      // -----------------------------------------------

      let matchesCategory = true;

      if (selectedCategory) {
        const categoryIds = categoryIdsByCanonicalName.get(selectedCategory);

        matchesCategory = Boolean(
          categoryIds && product.category_id && categoryIds.has(product.category_id)
        );
      }

      // -----------------------------------------------
      // SUBCATEGORÍA
      // -----------------------------------------------

      const matchesSubcategory =
        !selectedSubcategory ||
        normalizeText(product.subcategory ?? '') === normalizeText(selectedSubcategory);

      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [
    products,
    search,
    selectedCategory,
    selectedSubcategory,
    categoryIdsByCanonicalName,
    dashboardCategories,
  ]);

  // =========================================================
  // CANTIDAD REAL DE PRODUCTOS POR CATEGORÍA
  // =========================================================

  const officialCategoryProducts = useMemo(() => {
    const result: Record<string, number> = {};

    dashboardCategories.forEach((categoryName) => {
      const categoryIds = categoryIdsByCanonicalName.get(categoryName);

      if (!categoryIds) {
        result[categoryName] = 0;

        return;
      }

      result[categoryName] = products.filter((product) =>
        Boolean(product.category_id && categoryIds.has(product.category_id))
      ).length;
    });

    return result;
  }, [products, categoryIdsByCanonicalName, dashboardCategories]);

  // =========================================================
  // CANTIDAD REAL POR SUBCATEGORÍA
  // =========================================================

  function getSubcategoryProductCount(categoryName: string, subcategoryName: string) {
    const categoryIds = categoryIdsByCanonicalName.get(categoryName);

    if (!categoryIds) {
      return 0;
    }

    return products.filter((product) => {
      const sameCategory = Boolean(product.category_id && categoryIds.has(product.category_id));

      const sameSubcategory =
        normalizeText(product.subcategory ?? '') === normalizeText(subcategoryName);

      return sameCategory && sameSubcategory;
    }).length;
  }

  // =========================================================
  // CAMBIAR ESTADO DEL PRODUCTO
  // =========================================================

  async function toggleProductStatus(product: Product) {
    const newStatus = !product.is_active;

    const { error: updateError } = await supabase
      .from('products')
      .update({
        is_active: newStatus,
      })
      .eq('id', product.id);

    if (updateError) {
      console.error('Error actualizando producto:', updateError);

      alert('No se pudo actualizar el producto.');

      return;
    }

    setProducts((previous) =>
      previous.map((item) =>
        item.id === product.id
          ? {
              ...item,
              is_active: newStatus,
            }
          : item
      )
    );
  }

  // =========================================================
  // ELIMINAR PRODUCTO
  // =========================================================

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(`¿Seguro que deseas eliminar "${product.name}"?`);

    if (!confirmed) {
      return;
    }

    const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id);

    if (deleteError) {
      console.error('Error eliminando producto:', deleteError);

      alert(`No se pudo eliminar el producto. ${deleteError.message || ''}`);

      return;
    }

    setProducts((previous) => previous.filter((item) => item.id !== product.id));

    alert('Producto eliminado correctamente.');
  }

  // =========================================================
  // INTERFAZ
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          ENCABEZADO
      ===================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="text-2xl font-black text-slate-900">Productos</h1>

              <p className="mt-1 text-sm text-slate-500">
                Gestiona el catálogo de productos de Polaris.
              </p>
            </div>
          </div>

          <Link
            href="/admin/productos/nuevo"
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
          >
            <Plus size={18} />
            Nuevo producto
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        {/* =================================================
            RESUMEN DE CATEGORÍAS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {dashboardCategories.map((categoryName) => {
            const isSelected = selectedCategory === categoryName;

            return (
              <button
                key={categoryName}
                type="button"
                onClick={() => selectCategory(categoryName)}
                className={`rounded-2xl border bg-white p-4 text-left transition ${
                  isSelected
                    ? 'border-cyan-400 ring-2 ring-cyan-100'
                    : 'border-slate-200 hover:border-cyan-300'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                    <Package size={18} />
                  </div>

                  <span className="text-lg font-black text-slate-900">
                    {officialCategoryProducts[categoryName] ?? 0}
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-800">{categoryName}</p>
              </button>
            );
          })}
        </div>

        {/* =================================================
            CATÁLOGO
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* BARRA SUPERIOR */}

          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Catálogo</h2>

              <p className="text-sm text-slate-500">
                {filteredProducts.length} producto
                {filteredProducts.length === 1 ? '' : 's'} encontrado
                {filteredProducts.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="relative w-full lg:w-[380px]">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar producto..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
            {/* =================================================
                CATEGORÍAS
            ================================================= */}

            <aside className="border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
              <div className="mb-3">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Categorías
                </p>
              </div>

              <div className="space-y-1">
                {dashboardCategories.map((categoryName) => {
                  const subcategories = CATEGORY_STRUCTURE[categoryName] ?? [];

                  const hasSubcategories = subcategories.length > 0;

                  const isOpen = openCategories[categoryName];

                  const isSelected = selectedCategory === categoryName && !selectedSubcategory;

                  return (
                    <div key={categoryName}>
                      {/* CATEGORÍA */}

                      <div
                        className={`flex items-center rounded-xl transition ${
                          isSelected ? 'bg-cyan-50 text-cyan-700' : 'text-slate-700 hover:bg-white'
                        }`}
                      >
                        {hasSubcategories ? (
                          <button
                            type="button"
                            onClick={() => toggleCategory(categoryName)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center"
                            aria-label={isOpen ? 'Ocultar subcategorías' : 'Mostrar subcategorías'}
                          >
                            {isOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                          </button>
                        ) : (
                          <span className="w-10" />
                        )}

                        <button
                          type="button"
                          onClick={() => selectCategory(categoryName)}
                          className="flex min-h-10 flex-1 items-center justify-between py-2 pr-3 text-left"
                        >
                          <span className="text-sm font-semibold">{categoryName}</span>

                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500">
                            {officialCategoryProducts[categoryName] ?? 0}
                          </span>
                        </button>
                      </div>

                      {/* SUBCATEGORÍAS */}

                      {hasSubcategories && isOpen && (
                        <div className="ml-10 mt-1 space-y-1 border-l border-slate-200 pl-3">
                          {subcategories.map((subcategory) => {
                            const isSubSelected = selectedSubcategory === subcategory.name;

                            const realCount = getSubcategoryProductCount(
                              categoryName,
                              subcategory.name
                            );

                            return (
                              <button
                                key={subcategory.name}
                                type="button"
                                onClick={() => selectSubcategory(categoryName, subcategory.name)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                                  isSubSelected
                                    ? 'bg-cyan-100 font-bold text-cyan-700'
                                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                              >
                                <span>{subcategory.name}</span>

                                <span className="text-[10px] font-bold text-slate-400">
                                  {realCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* =================================================
                TABLA
            ================================================= */}

            <div className="min-w-0 overflow-x-auto">
              {loading ? (
                <div className="flex min-h-[400px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />

                    <p className="text-sm font-semibold text-slate-500">Cargando productos...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex min-h-[400px] items-center justify-center p-6">
                  <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-center">
                    <p className="font-bold text-red-700">{error}</p>

                    <button
                      type="button"
                      onClick={loadProducts}
                      className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Package size={26} />
                  </div>

                  <h3 className="font-black text-slate-800">No hay productos</h3>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    No encontramos productos con los filtros seleccionados.
                  </p>

                  <Link
                    href="/admin/productos/nuevo"
                    className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    <Plus size={16} />
                    Agregar producto
                  </Link>
                </div>
              ) : (
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
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
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50/70"
                      >
                        {/* PRODUCTO */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400">
                                  <Package size={20} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-800">{product.name}</p>

                              <p className="mt-1 max-w-[320px] truncate text-xs text-slate-400">
                                {product.description || 'Sin descripción'}
                              </p>

                              {product.subcategory && (
                                <p className="mt-1 text-[10px] font-semibold text-cyan-600">
                                  {product.subcategory}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* CATEGORÍA */}

                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                              {getCategoryName(product.category_id)}
                            </span>

                            {product.subcategory && (
                              <span className="text-[10px] font-semibold text-slate-400">
                                {product.subcategory}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* PRECIO */}

                        <td className="px-5 py-4">
                          <span className="font-black text-slate-800">
                            S/{' '}
                            {Number(product.price ?? 0).toLocaleString('es-PE', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>

                        {/* STOCK */}

                        <td className="px-5 py-4">
                          <span
                            className={`font-bold ${
                              Number(product.stock ?? 0) <= 0 ? 'text-red-600' : 'text-slate-700'
                            }`}
                          >
                            {product.stock ?? 0}
                          </span>
                        </td>

                        {/* ESTADO */}

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => toggleProductStatus(product)}
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              product.is_active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {product.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>

                        {/* ACCIONES */}

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/productos/${product.id}`}
                              target="_blank"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                              title="Ver producto"
                            >
                              <Eye size={16} />
                            </Link>

                            <Link
                              href={`/admin/productos/${product.id}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                              title="Editar producto"
                            >
                              <Edit size={16} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => deleteProduct(product)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50"
                              title="Eliminar producto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
