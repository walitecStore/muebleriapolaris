import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Categorías logísticas oficiales de la tienda.
 *
 * También mantenemos alias para productos/código antiguos
 * que puedan enviar nombres diferentes.
 */
const SHIPPING_CATEGORY_ALIASES: Record<string, string> = {
  // ============================================================
  // CATEGORÍAS OFICIALES
  // ============================================================

  EUROPEO: 'EUROPEO',
  MODULAR: 'MODULAR',
  SECCIONAL: 'SECCIONAL',
  SECCIONAL_PARLANTES: 'SECCIONAL_PARLANTES',
  SOFA_CAMA: 'SOFA_CAMA',
  '3_2_1': '3_2_1',
  PUF: 'PUF',
  DECORATIVO: 'DECORATIVO',

  // ============================================================
  // ALIAS / COMPATIBILIDAD
  // ============================================================

  // SECTIONAL era utilizado anteriormente por algunos productos
  SECTIONAL: 'SECCIONAL',

  SECTIONAL_PARLANTES: 'SECCIONAL_PARLANTES',

  // Nombres comerciales
  'SOFAS EUROPEOS': 'EUROPEO',
  'SOFÁS EUROPEOS': 'EUROPEO',

  'SOFAS MODULARES': 'MODULAR',
  'SOFÁS MODULARES': 'MODULAR',

  'SOFAS SECCIONALES': 'SECCIONAL',
  'SOFÁS SECCIONALES': 'SECCIONAL',

  'SECCIONALES CON PARLANTES': 'SECCIONAL_PARLANTES',

  'SOFAS CAMA': 'SOFA_CAMA',
  'SOFÁS CAMA': 'SOFA_CAMA',

  'SOFAS 3-2-1': '3_2_1',
  'SOFÁS 3-2-1': '3_2_1',

  'SOFAS 3 2 1': '3_2_1',
  'SOFÁS 3 2 1': '3_2_1',

  'PUFS Y DECORATIVOS': 'DECORATIVO',
};

/**
 * Normaliza la categoría recibida desde el frontend.
 *
 * Ejemplo:
 *
 * SECTIONAL
 *     ↓
 * SECCIONAL
 *
 * SOFÁS CAMA
 *     ↓
 * SOFA_CAMA
 */
function normalizeShippingCategory(value: unknown): string {
  const raw = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

  return SHIPPING_CATEGORY_ALIASES[raw] ?? raw;
}

export async function POST(request: Request) {
  try {
    // ==========================================================
    // 1. LEER REQUEST
    // ==========================================================

    const body = await request.json();

    const receivedCategory = String(
      body.category ?? '',
    ).trim();

    const distanceKm = Number(
      body.distanceKm,
    );

    // ==========================================================
    // 2. VALIDAR CATEGORÍA
    // ==========================================================

    if (!receivedCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Falta la categoría de envío',
        },
        { status: 400 },
      );
    }

    // ==========================================================
    // 3. NORMALIZAR CATEGORÍA
    // ==========================================================

    const category =
      normalizeShippingCategory(
        receivedCategory,
      );

    console.log(
      '[SHIPPING] Categoría recibida:',
      receivedCategory,
    );

    console.log(
      '[SHIPPING] Categoría normalizada:',
      category,
    );

    // ==========================================================
    // 4. VALIDAR DISTANCIA
    // ==========================================================

    if (
      !Number.isFinite(distanceKm) ||
      distanceKm < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'La distancia de envío no es válida',
        },
        { status: 400 },
      );
    }

    // Evitamos valores absurdos.
    // Para Lima Metropolitana es más que suficiente.
    if (distanceKm > 500) {
      return NextResponse.json(
        {
          success: false,
          error:
            'La distancia indicada supera el límite permitido',
        },
        { status: 400 },
      );
    }

    // ==========================================================
    // 5. SUPABASE
    // ==========================================================

    const supabase =
      await createClient();

    // ==========================================================
    // 6. CALCULAR ENVÍO
    //
    // IMPORTANTE:
    //
    // La función SQL utiliza:
    //
    // p_category_code
    // p_distance_km
    //
    // NO:
    //
    // p_shipping_category
    // ==========================================================

    const { data, error } =
      await supabase.rpc(
        'calculate_shipping_cost',
        {
          p_category_code: category,
          p_distance_km: distanceKm,
        },
      );

    // ==========================================================
    // 7. ERROR DE SUPABASE
    // ==========================================================

    if (error) {
      console.error(
        '[SHIPPING] Error de Supabase:',
        error,
      );

      return NextResponse.json(
        {
          success: false,

          error:
            'No se pudo calcular el costo de envío',

          details: error.message,

          categoryReceived:
            receivedCategory,

          category:
            category,

          distanceKm,
        },
        { status: 500 },
      );
    }

    // ==========================================================
    // 8. CONVERTIR RESULTADO
    // ==========================================================

    const shippingCost =
      Number(data);

    if (
      !Number.isFinite(
        shippingCost,
      ) ||
      shippingCost < 0
    ) {
      console.error(
        '[SHIPPING] Resultado inválido:',
        data,
      );

      return NextResponse.json(
        {
          success: false,

          error:
            'La tarifa de envío obtenida no es válida',

          category,

          distanceKm,

          receivedData: data,
        },
        { status: 500 },
      );
    }

    // ==========================================================
    // 9. RESPUESTA CORRECTA
    // ==========================================================

    console.log(
      '[SHIPPING] Cálculo exitoso:',
      {
        category,
        distanceKm,
        shippingCost,
      },
    );

    return NextResponse.json({
      success: true,

      // Categoría enviada originalmente
      receivedCategory,

      // Categoría utilizada para calcular
      category,

      // Distancia calculada
      distanceKm,

      // Precio final de envío
      shippingCost: Number(
        shippingCost.toFixed(2),
      ),
    });
  } catch (error) {
    // ==========================================================
    // ERROR GENERAL
    // ==========================================================

    console.error(
      '[SHIPPING] Error interno:',
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          'Error interno al calcular el envío',
      },
      { status: 500 },
    );
  }
}