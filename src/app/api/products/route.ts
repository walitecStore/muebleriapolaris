import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SupabaseCategory = {
  id: string | number;
  name: string | null;
  slug?: string | null;
};

type SupabaseProduct = {
  id: string | number;
  category_id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  images?: unknown;
  stock?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  subcategory?: string | null;
};

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function formatPrice(value: unknown): string {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return 'S/ 0';
  }

  return `S/ ${number.toLocaleString('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getMainImage(product: SupabaseProduct): string {
  if (typeof product.image_url === 'string' && product.image_url.trim()) {
    return product.image_url.trim();
  }

  if (Array.isArray(product.images)) {
    const validImage = product.images.find(
      (image) => typeof image === 'string' && image.trim().length > 0
    );

    if (validImage) {
      return validImage.trim();
    }
  }

  return '/assets/images/no_image.png';
}

function getCategoryName(
  categoryId: string | number | null | undefined,
  categories: SupabaseCategory[]
): string {
  if (categoryId === null || categoryId === undefined) {
    return 'Sin categoría';
  }

  const category = categories.find((item) => String(item.id) === String(categoryId));

  return category?.name?.trim() || 'Sin categoría';
}

function transformProduct(product: SupabaseProduct, categories: SupabaseCategory[]) {
  const categoryName = getCategoryName(product.category_id, categories);

  const image = getMainImage(product);

  const images = Array.isArray(product.images)
    ? product.images.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : image
      ? [image]
      : [];

  const stock = Number(product.stock ?? 0);
  const priceValue = Number(product.price ?? 0);

  return {
    id: String(product.id),

    name: product.name?.trim() || 'Producto sin nombre',

    slug: product.slug?.trim() || String(product.id),

    category: categoryName,

    category_id:
      product.category_id !== null && product.category_id !== undefined
        ? String(product.category_id)
        : null,

    subcategory: typeof product.subcategory === 'string' ? product.subcategory.trim() : '',

    description: product.description?.trim() || '',

    price: formatPrice(priceValue),

    priceValue,

    image,

    images,

    stock,

    availability: stock > 0 ? 'Disponible' : 'Agotado',

    isActive: product.is_active !== false,

    created_at: product.created_at || null,

    updated_at: product.updated_at || null,
  };
}

async function supabaseFetch<T>(endpoint: string): Promise<T> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL en .env');
  }

  if (!supabaseKey) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en .env');
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
      method: 'GET',

      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },

      cache: 'no-store',

      signal: controller.signal,
    });

    const text = await response.text();

    let data: unknown;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      const message =
        typeof data === 'object' && data !== null && 'message' in data
          ? String((data as { message?: unknown }).message ?? '')
          : text;

      throw new Error(`Supabase HTTP ${response.status}: ${message}`);
    }

    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('========================================');

    console.log('🛋️ API /api/products');

    const { searchParams } = new URL(request.url);

    const active = searchParams.get('active');

    const category = searchParams.get('category');

    const search = searchParams.get('search');

    console.log('Parámetros:', {
      active,
      category,
      search,
    });

    /*
     * =====================================================
     * 1. CATEGORÍAS
     * =====================================================
     *
     * Usamos directamente el REST API de Supabase.
     * Esto evita el problema que teníamos con
     * createServerClient() dentro de esta ruta.
     */

    const categories = await supabaseFetch<SupabaseCategory[]>('categories?select=id,name');

    console.log(`📁 Categorías encontradas: ${categories.length}`);

    /*
     * =====================================================
     * 2. PRODUCTOS
     * =====================================================
     *
     * select=* evita depender de que existan exactamente
     * las columnas opcionales slug o subcategory.
     */

    let productsEndpoint = 'products?select=*';

    if (active === 'true') {
      productsEndpoint += '&is_active=eq.true';
    }

    if (active === 'false') {
      productsEndpoint += '&is_active=eq.false';
    }

    if (search?.trim()) {
      productsEndpoint += `&name=ilike.*${encodeURIComponent(search.trim())}*`;
    }

    productsEndpoint += '&order=id.asc';

    console.log('Consultando productos:', productsEndpoint);

    const rawProducts = await supabaseFetch<SupabaseProduct[]>(productsEndpoint);

    console.log(`📦 Productos encontrados: ${rawProducts.length}`);

    /*
     * =====================================================
     * 3. TRANSFORMAR PRODUCTOS
     * =====================================================
     */

    let products = rawProducts.map((product) => transformProduct(product, categories));

    /*
     * =====================================================
     * 4. FILTRO DE CATEGORÍA
     * =====================================================
     *
     * Aceptamos:
     *
     * Europeo
     * Sofás Europeo
     * Sofas Europeo
     *
     * Modulares
     * Sofás Modulares
     *
     * Seccionales
     * Sofás Seccionales
     *
     * etc.
     */

    if (category?.trim()) {
      const wanted = normalizeText(category);

      products = products.filter((product) => {
        const current = normalizeText(product.category);

        return current === wanted || current.includes(wanted) || wanted.includes(current);
      });

      console.log(`🔎 Filtro categoría "${category}": ${products.length} productos`);
    }

    /*
     * =====================================================
     * 5. RESPUESTA
     * =====================================================
     */

    console.log(`✅ API FINAL: ${products.length} productos`);

    console.log('========================================');

    return NextResponse.json(
      {
        success: true,

        products,

        total: products.length,

        categories: categories.map((item) => ({
          id: String(item.id),

          name: item.name?.trim() || 'Sin categoría',

          slug: item.slug?.trim() || normalizeText(item.name).replace(/\s+/g, '-'),
        })),
      },
      {
        status: 200,

        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('========================================');

    console.error('❌ ERROR GENERAL /api/products');

    console.error(error);

    console.error('========================================');

    const message = error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json(
      {
        success: false,

        products: [],

        total: 0,

        error: 'Error interno al cargar el catálogo.',

        details: message,
      },
      {
        status: 500,

        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
