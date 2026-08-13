import { createClient } from "./supabase/client";
import { sofaProducts } from "@/app/components/catalogData";

export async function insertProducts() {

  console.log("===== INICIANDO CARGA DE PRODUCTOS =====");

  const supabase = createClient();

  for (const product of sofaProducts) {

    console.log("Procesando:", product.name);

    const { data: exists } = await supabase
      .from("products")
      .select("id")
      .eq("name", product.name)
      .maybeSingle();

    if (exists) {
      console.log("Ya existe:", product.name);
      continue;
    }

    const { data: category } = await supabase
  .from("categories")
  .select("id")
  .eq("name", product.category.trim())
  .single();

if (!category) {
  console.log("Categoría no encontrada:", product.category);
  continue;
}

const categoryId = category.id;

    console.log("Categoría:", categoryId);

    const { error } = await supabase
      .from("products")
      .insert({
        category_id: categoryId,
        name: product.name,
        slug: product.name.toLowerCase().replace(/ /g, "-"),
        description: product.description,
        price: Number(product.price.replace(/[^0-9]/g, "")),
        image_url: product.image,
        images: [product.image],
        stock: 10,
        is_active: true,
      });

    if (error) {

      console.log("========== ERROR ==========");
      console.log("Código:", error.code);
      console.log("Mensaje:", error.message);
      console.log("Detalles:", error.details);
      console.log("Hint:", error.hint);
      console.log(error);
      console.log("===========================");

    } else {

      console.log("INSERTADO:", product.name);

    }

  }

  console.log("===== FIN =====");

}