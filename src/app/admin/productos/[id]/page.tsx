'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ImagePlus,
  Package,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
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
  images: string[] | null;
  stock: number | null;
  is_active: boolean;
  subcategory: string | null;
}

/*
|--------------------------------------------------------------------------
| CATEGORÍAS OFICIALES DE POLARIS
|--------------------------------------------------------------------------
*/

const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
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

const OFFICIAL_CATEGORIES = Object.keys(
  CATEGORY_SUBCATEGORIES,
);

/*
|--------------------------------------------------------------------------
| NORMALIZAR TEXTO
|--------------------------------------------------------------------------
*/

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/*
|--------------------------------------------------------------------------
| IDENTIFICAR CATEGORÍA REAL
|
| Esto permite reconocer:
|
| Sofás Europeo
| Sofas Europeo
| Sofá Europeo
| Sofás Modelo Europeo
| etc.
|--------------------------------------------------------------------------
*/

function getCanonicalCategory(
  categoryName: string,
): string | null {
  const normalized = normalizeText(categoryName);

  if (
    normalized.includes('europeo')
  ) {
    return 'Sofás Europeo';
  }

  if (
    normalized.includes('modular')
  ) {
    return 'Sofás Modulares';
  }

  if (
    normalized.includes('seccional')
  ) {
    return 'Sofás Seccionales';
  }

  if (
    normalized.includes('cama')
  ) {
    return 'Sofás Cama';
  }

  if (
    normalized.includes('3 2 1')
  ) {
    return 'Sofás 3-2-1';
  }

  if (
    normalized.includes('puf')
  ) {
    return 'Pufs y Decorativos';
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| SLUG
|--------------------------------------------------------------------------
*/

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();

  const productId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | ESTADOS
  |--------------------------------------------------------------------------
  */

  const [product, setProduct] =
    useState<Product | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [name, setName] =
    useState('');

  const [categoryId, setCategoryId] =
    useState('');

  const [subcategory, setSubcategory] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [price, setPrice] =
    useState('');

  const [stock, setStock] =
    useState('');

  const [imageUrl, setImageUrl] =
    useState('');

  const [isActive, setIsActive] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | CATEGORÍA SELECCIONADA
  |--------------------------------------------------------------------------
  */

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === categoryId,
    );

  const selectedCanonicalCategory =
    selectedCategory
      ? getCanonicalCategory(
          selectedCategory.name,
        )
      : null;

  const availableSubcategories =
    selectedCanonicalCategory
      ? CATEGORY_SUBCATEGORIES[
          selectedCanonicalCategory
        ] ?? []
      : [];

  /*
  |--------------------------------------------------------------------------
  | CARGAR PRODUCTO + CATEGORÍAS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!productId) {
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      /*
      |----------------------------------------------------------
      | PRODUCTO
      |----------------------------------------------------------
      */

      const {
        data: productData,
        error: productError,
      } = await supabase
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
            images,
            stock,
            is_active,
            subcategory
          `,
        )
        .eq('id', productId)
        .single();

      if (productError) {
        console.error(
          'Error obteniendo producto:',
          productError,
        );

        if (!cancelled) {
          setError(
            'No se pudo cargar el producto.',
          );
          setLoading(false);
        }

        return;
      }

      /*
      |----------------------------------------------------------
      | CATEGORÍAS
      |----------------------------------------------------------
      */

      const {
        data: categoriesData,
        error: categoriesError,
      } = await supabase
        .from('categories')
        .select(
          'id, name, slug',
        )
        .order('name', {
          ascending: true,
        });

      if (categoriesError) {
        console.error(
          'Error obteniendo categorías:',
          categoriesError,
        );
      }

      if (cancelled) {
        return;
      }

      const loadedProduct =
        productData as Product;

      const loadedCategories =
        (categoriesData ?? []) as Category[];

      setProduct(loadedProduct);

      setCategories(
        loadedCategories,
      );

      /*
      |----------------------------------------------------------
      | CARGAR CAMPOS
      |----------------------------------------------------------
      */

      setName(
        loadedProduct.name ?? '',
      );

      setCategoryId(
        loadedProduct.category_id ?? '',
      );

      setSubcategory(
        loadedProduct.subcategory ?? '',
      );

      setDescription(
        loadedProduct.description ?? '',
      );

      setPrice(
        loadedProduct.price !== null &&
        loadedProduct.price !== undefined
          ? String(
              loadedProduct.price,
            )
          : '',
      );

      setStock(
        loadedProduct.stock !== null &&
        loadedProduct.stock !== undefined
          ? String(
              loadedProduct.stock,
            )
          : '',
      );

      setImageUrl(
        loadedProduct.image_url ?? '',
      );

      setIsActive(
        loadedProduct.is_active ?? true,
      );

      setLoading(false);
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [productId, supabase]);

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR CATEGORÍA
  |--------------------------------------------------------------------------
  */

  function handleCategoryChange(
    value: string,
  ) {
    setCategoryId(value);

    const category =
      categories.find(
        (item) =>
          item.id === value,
      );

    const canonical =
      category
        ? getCanonicalCategory(
            category.name,
          )
        : null;

    const subcategories =
      canonical
        ? CATEGORY_SUBCATEGORIES[
            canonical
          ] ?? []
        : [];

    /*
    | Si la categoría cambia,
    | la subcategoría anterior
    | deja de ser válida.
    */

    if (
      !subcategories.includes(
        subcategory,
      )
    ) {
      setSubcategory('');
    }
  }

  /*
  |--------------------------------------------------------------------------
  | GUARDAR CAMBIOS
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !productId ||
      saving
    ) {
      return;
    }

    setError('');
    setSuccess('');

    const cleanName =
      name.trim();

    const cleanDescription =
      description.trim();

    const cleanImageUrl =
      imageUrl.trim();

    const cleanSubcategory =
      subcategory.trim();

    const numericPrice =
      Number(price);

    const numericStock =
      Number(stock);

    /*
    |----------------------------------------------------------
    | VALIDACIONES
    |----------------------------------------------------------
    */

    if (!cleanName) {
      setError(
        'Ingresa el nombre del producto.',
      );
      return;
    }

    if (!categoryId) {
      setError(
        'Selecciona una categoría.',
      );
      return;
    }

    if (
      availableSubcategories.length > 0 &&
      !cleanSubcategory
    ) {
      setError(
        'Selecciona una subcategoría.',
      );
      return;
    }

    if (
      price === '' ||
      !Number.isFinite(
        numericPrice,
      ) ||
      numericPrice < 0
    ) {
      setError(
        'Ingresa un precio válido.',
      );
      return;
    }

    if (
      stock === '' ||
      !Number.isFinite(
        numericStock,
      ) ||
      numericStock < 0
    ) {
      setError(
        'Ingresa un stock válido.',
      );
      return;
    }

    setSaving(true);

    /*
    |----------------------------------------------------------
    | SLUG
    |----------------------------------------------------------
    */

    const slug =
      createSlug(cleanName);

    /*
    |----------------------------------------------------------
    | IMÁGENES
    |----------------------------------------------------------
    */

    const currentImages =
      product?.images ?? [];

    let updatedImages =
      currentImages;

    if (cleanImageUrl) {
      if (
        currentImages.length === 0
      ) {
        updatedImages = [
          cleanImageUrl,
        ];
      } else {
        updatedImages = [
          cleanImageUrl,
          ...currentImages.filter(
            (image) =>
              image !==
              cleanImageUrl,
          ),
        ];
      }
    }

    /*
    |----------------------------------------------------------
    | ACTUALIZAR SUPABASE
    |----------------------------------------------------------
    */

    const {
      data: updatedProduct,
      error: updateError,
    } = await supabase
      .from('products')
      .update({
        category_id:
          categoryId,

        name:
          cleanName,

        slug,

        description:
          cleanDescription ||
          null,

        price:
          numericPrice,

        image_url:
          cleanImageUrl ||
          null,

        images:
          updatedImages,

        stock:
          Math.floor(
            numericStock,
          ),

        is_active:
          isActive,

        subcategory:
          cleanSubcategory ||
          null,
      })
      .eq(
        'id',
        productId,
      )
      .select(
        `
          id,
          category_id,
          name,
          slug,
          description,
          price,
          image_url,
          images,
          stock,
          is_active,
          subcategory
        `,
      )
      .single();

    /*
    |----------------------------------------------------------
    | ERROR
    |----------------------------------------------------------
    */

    if (updateError) {
      console.error(
        'Error actualizando producto:',
        updateError,
      );

      setError(
        updateError.message ||
          'No se pudieron guardar los cambios.',
      );

      setSaving(false);

      return;
    }

    /*
    |----------------------------------------------------------
    | ÉXITO
    |----------------------------------------------------------
    */

    setProduct(
      updatedProduct as Product,
    );

    setSuccess(
      'Cambios guardados correctamente.',
    );

    setSaving(false);

    /*
    | Volver al catálogo
    | después de un momento.
    */

    setTimeout(() => {
      router.push(
        '/admin/productos',
      );

      router.refresh();
    }, 900);
  }

  /*
  |--------------------------------------------------------------------------
  | CARGANDO
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />

            <p className="font-semibold text-slate-600">
              Cargando producto...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCTO NO ENCONTRADO
  |--------------------------------------------------------------------------
  */

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle
                size={28}
              />
            </div>

            <h1 className="text-xl font-black text-slate-800">
              Producto no encontrado
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              No encontramos el
              producto solicitado.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  '/admin/productos',
                )
              }
              className="mt-6 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
            >
              Volver a productos
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | INTERFAZ
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-slate-50">
      {/* CABECERA */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <button
            type="button"
            onClick={() =>
              router.push(
                '/admin/productos',
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            title="Volver a productos"
          >
            <ArrowLeft
              size={19}
            />
          </button>

          <div>
            <h1 className="text-xl font-black text-slate-900">
              Editar producto
            </h1>

            <p className="text-xs text-slate-500">
              Gestiona la información
              del producto de Polaris.
            </p>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}

      <div className="mx-auto max-w-7xl px-6 py-6">
        <form
          onSubmit={
            handleSubmit
          }
          className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]"
        >
          {/* INFORMACIÓN */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
                <Package
                  size={20}
                />
              </div>

              <div>
                <h2 className="font-black text-slate-800">
                  Información del producto
                </h2>

                <p className="text-xs text-slate-500">
                  Datos principales
                  del sofá.
                </p>
              </div>
            </div>

            {/* NOMBRE */}

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Nombre del producto
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="Ej. Sofá Modular Europeo"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            {/* CATEGORÍA */}

            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Categoría
              </label>

              <select
                value={
                  categoryId
                }
                onChange={(event) =>
                  handleCategoryChange(
                    event.target
                      .value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="">
                  Selecciona una categoría
                </option>

                {OFFICIAL_CATEGORIES.map(
                  (
                    officialName,
                  ) => {
                    const matchingCategory =
                      categories.find(
                        (
                          category,
                        ) =>
                          getCanonicalCategory(
                            category.name,
                          ) ===
                          officialName,
                      );

                    if (
                      !matchingCategory
                    ) {
                      return null;
                    }

                    return (
                      <option
                        key={
                          matchingCategory.id
                        }
                        value={
                          matchingCategory.id
                        }
                      >
                        {
                          officialName
                        }
                      </option>
                    );
                  },
                )}
              </select>
            </div>

            {/* SUBCATEGORÍA */}

            {selectedCanonicalCategory &&
              availableSubcategories.length >
                0 && (
                <div className="mt-5">
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Subcategoría
                  </label>

                  <select
                    value={
                      subcategory
                    }
                    onChange={(
                      event,
                    ) =>
                      setSubcategory(
                        event.target
                          .value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="">
                      Selecciona una subcategoría
                    </option>

                    {availableSubcategories.map(
                      (
                        item,
                      ) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {item}
                        </option>
                      ),
                    )}
                  </select>

                  <p className="mt-2 text-xs text-slate-400">
                    Selecciona el
                    catálogo al
                    que pertenece
                    este producto.
                  </p>
                </div>
              )}

            {/* DESCRIPCIÓN */}

            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Descripción
              </label>

              <textarea
                value={
                  description
                }
                onChange={(
                  event,
                ) =>
                  setDescription(
                    event.target
                      .value,
                  )
                }
                rows={5}
                placeholder="Describe las características del sofá..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            {/* PRECIO + STOCK */}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Precio
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    S/
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      price
                    }
                    onChange={(
                      event,
                    ) =>
                      setPrice(
                        event.target
                          .value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-10 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Stock
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    stock
                  }
                  onChange={(
                    event,
                  ) =>
                    setStock(
                      event.target
                        .value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>

            {/* IMAGEN */}

            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                URL de imagen
              </label>

              <div className="relative">
                <ImagePlus
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="url"
                  value={
                    imageUrl
                  }
                  onChange={(
                    event,
                  ) =>
                    setImageUrl(
                      event.target
                        .value,
                    )
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Puedes colocar la
                URL de la imagen
                del producto.
              </p>
            </div>
          </section>

          {/* PUBLICACIÓN */}

          <aside>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-black text-slate-800">
                Publicación
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Configuración del
                producto.
              </p>

              {/* CLASIFICACIÓN */}

              {selectedCanonicalCategory && (
                <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                    Clasificación
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {
                      selectedCanonicalCategory
                    }
                  </p>

                  {subcategory && (
                    <p className="mt-1 text-sm text-slate-600">
                      →{' '}
                      {
                        subcategory
                      }
                    </p>
                  )}
                </div>
              )}

              {/* ESTADO */}

              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Producto activo
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Visible en el
                      catálogo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setIsActive(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    className={`relative h-7 w-12 rounded-full transition ${
                      isActive
                        ? 'bg-cyan-600'
                        : 'bg-slate-300'
                    }`}
                    aria-label="Cambiar estado del producto"
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                        isActive
                          ? 'left-6'
                          : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* VISTA PREVIA */}

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                {imageUrl ? (
                  <img
                    src={
                      imageUrl
                    }
                    alt={
                      name ||
                      'Vista previa del producto'
                    }
                    className="h-48 w-full object-cover"
                    onError={(
                      event,
                    ) => {
                      event.currentTarget.style.display =
                        'none';
                    }}
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-50">
                    <div className="text-center">
                      <ImagePlus
                        size={30}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-2 text-xs text-slate-400">
                        Vista previa
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ERROR */}

              {error && (
                <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    {error}
                  </span>
                </div>
              )}

              {/* ÉXITO */}

              {success && (
                <div className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
                  <CheckCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    {success}
                  </span>
                </div>
              )}

              {/* GUARDAR */}

              <button
                type="submit"
                disabled={
                  saving
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Guardando...
                  </>
                ) : (
                  <>
                    <Save
                      size={18}
                    />

                    Guardar cambios
                  </>
                )}
              </button>

              {/* CANCELAR */}

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  router.push(
                    '/admin/productos',
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}