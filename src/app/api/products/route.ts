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
  subcategory_id?: string | null;
  brand_id?: string | null;
  brand?: string | null;
  short_description?: string | null;
  sale_price?: number | string | null;
  sku?: string | null;
  color?: string | null;
  material?: string | null;
  is_featured?: boolean | null;
};

type RelatedRow = Record<string, unknown> & { id: string; product_id?: string };

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

function transformProduct(
  product: SupabaseProduct,
  categories: SupabaseCategory[],
  related: {
    subcategories: RelatedRow[];
    brands: RelatedRow[];
    images: RelatedRow[];
    variants: RelatedRow[];
    attributes: RelatedRow[];
    attributeValues: RelatedRow[];
    reviews: RelatedRow[];
  }
) {
  const categoryName = getCategoryName(product.category_id, categories);

  const normalizedImages = related.images
    .filter((item) => item.product_id === String(product.id))
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  const primaryImage = normalizedImages.find((item) => item.is_primary)?.url;
  const image =
    typeof primaryImage === 'string'
      ? primaryImage
      : typeof normalizedImages[0]?.url === 'string'
        ? String(normalizedImages[0].url)
        : getMainImage(product);

  const legacyImages = Array.isArray(product.images)
    ? product.images.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0
      )
    : [];
  const images = Array.from(
    new Set(
      [
        ...normalizedImages
          .map((item) => item.url)
          .filter((url): url is string => typeof url === 'string'),
        ...legacyImages,
        image,
      ].filter(Boolean)
    )
  );

  const stock = Number(product.stock ?? 0);
  const priceValue = Number(product.sale_price ?? product.price ?? 0);
  const subcategory = related.subcategories.find((item) => item.id === product.subcategory_id);
  const brand = related.brands.find((item) => item.id === product.brand_id);
  const variants = related.variants.filter((item) => item.product_id === String(product.id));
  const attributes = related.attributes
    .filter((item) => item.product_id === String(product.id))
    .map((attribute) => ({
      ...attribute,
      values: related.attributeValues.filter((value) => value.attribute_id === attribute.id),
    }));
  const reviews = related.reviews.filter((item) => item.product_id === String(product.id));
  const rating = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating ?? 0), 0) / reviews.length
    : 0;

  return {
    id: String(product.id),

    name: product.name?.trim() || 'Producto sin nombre',

    slug: product.slug?.trim() || String(product.id),

    category: categoryName,

    category_id:
      product.category_id !== null && product.category_id !== undefined
        ? String(product.category_id)
        : null,

    subcategory:
      typeof subcategory?.name === 'string'
        ? subcategory.name
        : typeof product.subcategory === 'string'
          ? product.subcategory.trim()
          : '',

    brand: typeof brand?.name === 'string' ? brand.name : (product.brand ?? ''),

    description: product.description?.trim() || product.short_description?.trim() || '',

    price: formatPrice(priceValue),

    priceValue,
    regularPriceValue: Number(product.price ?? 0),
    salePriceValue: product.sale_price == null ? null : Number(product.sale_price),

    image,

    images,

    stock,

    availability: stock > 0 ? 'Disponible' : 'Agotado',
    sku: product.sku ?? variants.find((variant) => variant.sku)?.sku ?? null,
    color: product.color ?? '',
    material: product.material ?? '',
    variants,
    attributes,
    reviews,
    rating,
    reviewCount: reviews.length,
    isFeatured: product.is_featured === true,

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
    const page = Number(request.nextUrl.searchParams.get('page') || 0);
    const id = request.nextUrl.searchParams.get('id');
    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('search');
    if (
      !Number.isInteger(page) ||
      page < 0 ||
      page > 10000 ||
      (id && !/^[a-zA-Z0-9-]{1,150}$/.test(id))
    )
      return NextResponse.json({ error: 'Consulta no válida.' }, { status: 400 });
    const categories = await supabaseFetch<SupabaseCategory[]>(
      'categories?select=id,name,slug&order=name.asc'
    );
    const listedCategories = categories.map((c) => ({
      id: String(c.id),
      name: c.name || 'Sin categoría',
      slug: c.slug || normalizeText(c.name).replace(/\s+/g, '-'),
    }));
    let endpoint =
      'products?select=id,name,slug,category_id,description,price,sale_price,image_url,images,stock,is_active,is_featured,sku,color,material,subcategory,subcategory_id,brand_id,brand,short_description,created_at,updated_at&is_active=eq.true&order=created_at.desc,id.asc';
    if (id)
      endpoint += /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)
        ? `&id=eq.${id}`
        : `&slug=eq.${encodeURIComponent(id)}`;
    if (request.nextUrl.searchParams.get('featured') === 'true') endpoint += '&is_featured=eq.true';
    if (category) {
      const ids = categories
        .filter((c) => normalizeText(c.name) === normalizeText(category) || c.slug === category)
        .map((c) => c.id);
      if (!ids.length)
        return NextResponse.json({
          success: true,
          products: [],
          categories: listedCategories,
          total: 0,
          hasMore: false,
        });
      endpoint += `&category_id=in.(${ids.join(',')})`;
    }
    if (search?.trim())
      endpoint += `&name=ilike.*${encodeURIComponent(search.trim().replace(/[%*]/g, ''))}*`;
    endpoint += `&limit=48&offset=${page * 48}`;
    const rawProducts = await supabaseFetch<SupabaseProduct[]>(endpoint);
    const productIds = rawProducts.map((p) => p.id);
    if (!productIds.length)
      return NextResponse.json({
        success: true,
        products: [],
        categories: listedCategories,
        total: 0,
        hasMore: false,
      });
    const filter = `&product_id=in.(${productIds.join(',')})`;
    const [subcategories, brands, images, variants, attributes, reviews] = await Promise.all([
      supabaseFetch<RelatedRow[]>('subcategories?select=*&is_active=eq.true&order=sort_order.asc'),
      supabaseFetch<RelatedRow[]>('brands?select=*&is_active=eq.true&order=name.asc'),
      supabaseFetch<RelatedRow[]>('product_images?select=*&order=sort_order.asc' + filter),
      supabaseFetch<RelatedRow[]>(
        'product_variants?select=*&is_active=eq.true&order=sort_order.asc' + filter
      ),
      supabaseFetch<RelatedRow[]>('product_attributes?select=*&order=sort_order.asc' + filter),
      supabaseFetch<RelatedRow[]>(
        'product_reviews?select=*&status=eq.published&order=created_at.desc' + filter
      ),
    ]);
    const attributeValues = attributes.length
      ? await supabaseFetch<RelatedRow[]>(
          `product_attribute_values?select=*&attribute_id=in.(${attributes.map((a) => a.id).join(',')})&order=sort_order.asc`
        )
      : [];
    const products = rawProducts.map((p) => ({
      ...transformProduct(p, categories, {
        subcategories,
        brands,
        images,
        variants,
        attributes,
        attributeValues,
        reviews,
      }),
      categorySlug: categories.find((c) => String(c.id) === String(p.category_id))?.slug || '',
    }));
    return NextResponse.json(
      {
        success: true,
        products,
        categories: listedCategories,
        total: products.length,
        hasMore: rawProducts.length === 48,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Catalog lookup failed', error instanceof Error ? error.name : 'Unknown');
    return NextResponse.json(
      { error: 'No se pudo cargar el catálogo. Reintenta en unos momentos.' },
      { status: 503 }
    );
  }
}
