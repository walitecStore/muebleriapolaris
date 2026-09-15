import { createClient } from "./supabase/client";
import { sofaProducts } from "@/app/components/catalogData";

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type CategoryRow = {
  id: number | string;
  name?: string;
};

type ProductRow = {
  id: number | string;
  name?: string;
};

function logSupabaseError(
  context: string,
  error: SupabaseError | null | undefined,
) {
  console.error("========================================");
  console.error(`❌ ERROR EN SUPABASE: ${context}`);
  console.error("Código:", error?.code ?? "Sin código");
  console.error("Mensaje:", error?.message ?? "Sin mensaje");
  console.error("Detalles:", error?.details ?? "Sin detalles");
  console.error("Hint:", error?.hint ?? "Sin hint");
  console.error("Objeto completo:", error);
  console.error("========================================");
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function createSlug(value: unknown): string {
  return normalizeText(value)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parsePrice(value: unknown): number {
  const raw = String(value ?? "");

  const numeric = raw
    .replace(/[^\d.,]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const price = Number(numeric);

  if (!Number.isFinite(price) || price < 0) {
    return 0;
  }

  return Math.round(price * 100) / 100;
}

function getProductImage(product: (typeof sofaProducts)[number]): string {
  const image = String(product.image ?? "").trim();

  return image;
}

function getProductDescription(
  product: (typeof sofaProducts)[number],
): string {
  const description = String(product.description ?? "").trim();

  return description || `Sofá ${product.name}`;
}

async function findCategoryId(
  supabase: ReturnType<typeof createClient>,
  categoryName: string,
): Promise<number | string | null> {
  const normalizedCategory = normalizeText(categoryName);

  if (!normalizedCategory) {
    console.warn("⚠️ Producto sin categoría.");
    return null;
  }

  /*
   * Primero intentamos coincidencia exacta.
   */
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .eq("name", categoryName.trim())
      .maybeSingle();

    if (error) {
      logSupabaseError(
        `Buscando categoría exacta "${categoryName}"`,
        error,
      );
      return null;
    }

    if (data?.id != null) {
      return data.id;
    }
  } catch (error) {
    console.error(
      `❌ Fallo de red buscando categoría "${categoryName}".`,
      error,
    );
    return null;
  }

  /*
   * Si no hubo coincidencia exacta, descargamos las categorías
   * para comparar ignorando mayúsculas, tildes y espacios.
   */
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name");

    if (error) {
      logSupabaseError(
        `Obteniendo categorías para "${categoryName}"`,
        error,
      );
      return null;
    }

    const categories = (data ?? []) as CategoryRow[];

    const found = categories.find(
      (category) =>
        normalizeText(category.name) === normalizedCategory,
    );

    if (found?.id != null) {
      return found.id;
    }

    console.warn(
      `⚠️ Categoría no encontrada: "${categoryName}"`,
    );

    console.warn(
      "Categorías disponibles:",
      categories.map((category) => category.name),
    );

    return null;
  } catch (error) {
    console.error(
      `❌ Fallo de red obteniendo categorías para "${categoryName}".`,
      error,
    );
    return null;
  }
}

async function productAlreadyExists(
  supabase: ReturnType<typeof createClient>,
  productName: string,
): Promise<boolean | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name")
      .eq("name", productName.trim())
      .maybeSingle();

    if (error) {
      logSupabaseError(
        `Comprobando producto "${productName}"`,
        error,
      );

      return null;
    }

    return Boolean(data?.id);
  } catch (error) {
    console.error(
      `❌ Fallo de red comprobando "${productName}".`,
      error,
    );

    return null;
  }
}

export async function insertProducts() {
  console.log("");
  console.log("========================================");
  console.log("🛋️ MUEBLERÍA POLARIS");
  console.log("🚀 INICIANDO CARGA DE PRODUCTOS");
  console.log("========================================");

  /*
   * Crear cliente de Supabase.
   */
  let supabase: ReturnType<typeof createClient>;

  try {
    supabase = createClient();

    if (!supabase) {
      console.error(
        "❌ No se pudo crear el cliente de Supabase.",
      );

      return {
        success: false,
        inserted: 0,
        skipped: 0,
        failed: 0,
        message: "No se pudo crear el cliente de Supabase.",
      };
    }
  } catch (error) {
    console.error(
      "❌ Error creando el cliente de Supabase:",
      error,
    );

    return {
      success: false,
      inserted: 0,
      skipped: 0,
      failed: 0,
      message: "Error creando el cliente de Supabase.",
    };
  }

  /*
   * Validamos que exista el catálogo local.
   */
  if (!Array.isArray(sofaProducts) || sofaProducts.length === 0) {
    console.error(
      "❌ sofaProducts está vacío o no es un arreglo.",
    );

    return {
      success: false,
      inserted: 0,
      skipped: 0,
      failed: 0,
      message: "No hay productos para insertar.",
    };
  }

  console.log(
    `📦 Productos encontrados para importar: ${sofaProducts.length}`,
  );

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  /*
   * Procesamos producto por producto.
   */
  for (const product of sofaProducts) {
    const productName = String(product.name ?? "").trim();
    const categoryName = String(product.category ?? "").trim();

    console.log("");
    console.log("----------------------------------------");
    console.log(`🛋️ Procesando: ${productName || "SIN NOMBRE"}`);
    console.log(`📁 Categoría: ${categoryName || "SIN CATEGORÍA"}`);

    /*
     * Validación básica.
     */
    if (!productName) {
      console.error("❌ Producto sin nombre. Se omite.");
      failed++;
      continue;
    }

    if (!categoryName) {
      console.error(
        `❌ "${productName}" no tiene categoría. Se omite.`,
      );
      failed++;
      continue;
    }

    /*
     * Comprobar si el producto ya existe.
     */
    const exists = await productAlreadyExists(
      supabase,
      productName,
    );

    /*
     * null significa que ocurrió un problema de comunicación.
     * No intentamos insertar para evitar duplicados o estados
     * desconocidos.
     */
    if (exists === null) {
      console.error(
        `❌ No se pudo comprobar "${productName}" por un problema de conexión.`,
      );

      failed++;
      continue;
    }

    if (exists) {
      console.log(
        `ℹ️ Ya existe: ${productName}`,
      );

      skipped++;
      continue;
    }

    /*
     * Buscar categoría.
     */
    const categoryId = await findCategoryId(
      supabase,
      categoryName,
    );

    if (categoryId === null) {
      console.error(
        `❌ No se encontró la categoría "${categoryName}".`,
      );

      failed++;
      continue;
    }

    console.log(
      `✅ Categoría encontrada. ID: ${categoryId}`,
    );

    /*
     * Preparar datos.
     */
    const price = parsePrice(product.price);
    const image = getProductImage(product);
    const description = getProductDescription(product);
    const slug = createSlug(productName);

    if (!slug) {
      console.error(
        `❌ No se pudo generar slug para "${productName}".`,
      );

      failed++;
      continue;
    }

    if (price <= 0) {
      console.warn(
        `⚠️ El producto "${productName}" tiene precio 0 o inválido.`,
      );
    }

    /*
     * Insertar producto.
     */
    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          category_id: categoryId,
          name: productName,
          slug,
          description,
          price,
          image_url: image,
          images: image ? [image] : [],
          stock: 10,
          is_active: true,
        })
        .select("id, name")
        .single();

      if (error) {
        logSupabaseError(
          `Insertando "${productName}"`,
          error,
        );

        failed++;
        continue;
      }

      const insertedProduct = data as ProductRow | null;

      console.log(
        `✅ INSERTADO: ${insertedProduct?.name ?? productName}`,
      );

      if (insertedProduct?.id != null) {
        console.log(
          `🆔 ID generado: ${insertedProduct.id}`,
        );
      }

      inserted++;
    } catch (error) {
      console.error(
        `❌ FALLÓ LA INSERCIÓN DE "${productName}"`,
      );

      console.error(error);

      failed++;
    }
  }

  /*
   * Resumen final.
   */
  console.log("");
  console.log("========================================");
  console.log("🏁 FIN DE LA CARGA");
  console.log("========================================");
  console.log(`📦 Total encontrados: ${sofaProducts.length}`);
  console.log(`✅ Insertados: ${inserted}`);
  console.log(`ℹ️ Ya existentes: ${skipped}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log("========================================");

  return {
    success: failed === 0,
    inserted,
    skipped,
    failed,
    total: sofaProducts.length,
  };
}