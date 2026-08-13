'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Category = {
  identificacion: string;
  etiqueta: string;
  calle: string;
  ciudad: string;
  estado: string;
  'código postal': string;
  país: string;
  es_predeterminado: boolean;
};

type ProductForm = {
  nombre: string;
  babosa: string;
  descripcion: string;
  precio: string;
  existencias: string;

  subcategoria: string;
  categoria_de_envio: string;

  url_imagen: string;
  imagenes: string;

  color_principal: string;
  colores: string;

  color_confianza: string;

  url_video: string;
  video_portada_url: string;

  destacado: boolean;
  mas_vendido: boolean;

  orden_destacado: string;

  clasificacion: string;
  visitas: string;
  favorecer: string;
  recuento_de_revisiones: string;
};

const INITIAL_FORM: ProductForm = {
  nombre: '',
  babosa: '',
  descripcion: '',
  precio: '',
  existencias: '10',

  subcategoria: '',
  categoria_de_envio: 'EUROPA',

  url_imagen: '',
  imagenes: '',

  color_principal: '',
  colores: '',

  color_confianza: '0',

  url_video: '',
  video_portada_url: '',

  destacado: false,
  mas_vendido: false,

  orden_destacado: '0',

  clasificacion: '0',
  visitas: '0',
  favorecer: '0',
  recuento_de_revisiones: '0',
};

const CATEGORY_OPTIONS = [
  'EUROPA',
  'MODULAR',
  'SECCIONAL',
  'CAMA',
  '3_2_1',
  'PUFS_DECORATIVOS',
];

const COLOR_OPTIONS = [
  'Negro',
  'Blanco',
  'Gris',
  'Beige',
  'Marrón',
  'Crema',
  'Azul',
  'Celeste',
  'Verde',
  'Rojo',
  'Rosa',
  'Morado',
  'Amarillo',
  'Naranja',
  'Turquesa',
  'Multicolor',
];

function createSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseImages(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseColors(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: string, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

export default function NuevoProductoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<ProductForm>(INITIAL_FORM);

  const [categories, setCategories] = useState<Category[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [previewImages, setPreviewImages] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPreviewImages(parseImages(form.imagenes));
  }, [form.imagenes]);

  async function loadCategories() {
    setLoadingCategories(true);

    try {
      const { data, error } = await supabase
        .from('categorías')
        .select(
          'identificación, etiqueta, calle, ciudad, estado, "código postal", país, es_predeterminado'
        )
        .order('es_predeterminado', { ascending: false })
        .order('etiqueta', { ascending: true });

      if (error) {
        console.warn(
          'No se pudieron cargar las categorías. Se continuará sin ellas:',
          error
        );

        setCategories([]);
        return;
      }

      setCategories((data ?? []) as Category[]);
    } catch (error) {
      console.warn('Error cargando categorías:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }

  function updateField<K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrorMessage('');
    setSuccessMessage('');
  }

  function handleNameChange(value: string) {
    setForm((previous) => ({
      ...previous,
      nombre: value,
      babosa: previous.babosa || createSlug(value),
    }));
  }

  function validateForm() {
    if (!form.nombre.trim()) {
      return 'Debes ingresar el nombre del producto.';
    }

    if (!form.precio.trim()) {
      return 'Debes ingresar el precio.';
    }

    const price = toNumber(form.precio, -1);

    if (price < 0) {
      return 'El precio debe ser un número válido.';
    }

    const stock = toNumber(form.existencias, -1);

    if (stock < 0) {
      return 'Las existencias no pueden ser negativas.';
    }

    if (!form.subcategoria.trim()) {
      return 'Selecciona una categoría para el producto.';
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);

    try {
      const images = parseImages(form.imagenes);
      const colors = parseColors(form.colores);

      const mainImage =
        form.url_imagen.trim() ||
        images[0] ||
        null;

      /*
       * IMPORTANTE:
       * Los nombres de las columnas de tu tabla products deben coincidir
       * exactamente con los nombres reales de PostgreSQL.
       *
       * En tu tabla existen columnas con acentos y espacios, por eso aquí
       * usamos las claves entre comillas:
       * "descripción", "URL de la imagen", "imágenes", etc.
       *
       * No enviamos "ID de categoría" porque es opcional y la selección
       * actual del formulario utiliza los códigos EUROPA/MODULAR/etc.
       */
      const productPayload: Record<string, unknown> = {
        nombre: form.nombre.trim(),

        babosa:
          form.babosa.trim() ||
          createSlug(form.nombre),

        descripción:
          form.descripcion.trim() || null,

        precio: toNumber(form.precio),

        existencias: toNumber(form.existencias),

        'URL de la imagen': mainImage,

        imágenes: images,

        subcategoria:
          form.subcategoria.trim() || null,

        categoria_de_envio:
          form.categoria_de_envio.trim() || null,

        peso_de_envio_kg: null,

        volumen_de_envio_m3: null,

        piezas_de_envio: null,

        factor_de_envio: null,

        notas_de_envio: null,

        color_principal:
          form.color_principal.trim() || null,

        colores: colors,

        color_confianza: Math.min(
          1,
          Math.max(
            0,
            toNumber(form.color_confianza, 0)
          )
        ),

        'URL del video':
          form.url_video.trim() || null,

        video_portada_url:
          form.video_portada_url.trim() || null,

        clasificación: toNumber(
          form.clasificacion,
          0
        ),

        recuento_de_revisiones: toNumber(
          form.recuento_de_revisiones,
          0
        ),

        destacado: Boolean(form.destacado),

        mas_vendido: Boolean(form.mas_vendido),

        orden_destacado: toNumber(
          form.orden_destacado,
          0
        ),

        favorecer: toNumber(
          form.favorecer,
          0
        ),

        visitas: toNumber(
          form.visitas,
          0
        ),
      };

      /*
       * No usamos .select() después del INSERT.
       *
       * Así evitamos que una diferencia de caché de PostgREST en una
       * columna de respuesta provoque otro error después de guardar.
       */
      const { error } = await supabase
        .from('products')
        .insert(productPayload);

      if (error) {
        console.error(
          'ERROR CREANDO PRODUCTO:',
          error
        );

        const message =
          error.message ||
          'No se pudo crear el producto.';

        if (
          message.toLowerCase().includes('schema cache') ||
          message.toLowerCase().includes('could not find') ||
          message.toLowerCase().includes('no existe')
        ) {
          throw new Error(
            `${message}\n\n` +
            'La estructura de la tabla products existe, pero Supabase/PostgREST todavía puede tener la caché del esquema desactualizada. ' +
            'Ejecuta en Supabase SQL Editor: NOTIFY pgrst, \\'reload schema\\'; y vuelve a probar.'
          );
        }

        throw new Error(message);
      }

      console.log(
        'PRODUCTO CREADO CORRECTAMENTE'
      );

      setSuccessMessage(
        'Producto creado correctamente.'
      );

      setForm(INITIAL_FORM);

      setTimeout(() => {
        router.push('/admin/productos');
        router.refresh();
      }, 900);
    } catch (error) {
      console.error(
        'ERROR CREANDO PRODUCTO:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al crear el producto.'
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-extrabold">
              Nuevo producto
            </h1>

            <p className="text-sm text-slate-500">
              Agrega productos al catálogo inteligente
              de Mueblería Polaris.
            </p>
          </div>

          <Link
            href="/admin/productos"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-600"
          >
            ← Volver al catálogo
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* MENSAJES */}
        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            ✓ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            ⚠ {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* INFORMACIÓN PRINCIPAL */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold">
                1. Información del producto
              </h2>

              <p className="text-sm text-slate-500">
                Datos principales que verá el cliente.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  Nombre del producto *
                </label>

                <input
                  value={form.nombre}
                  onChange={(e) =>
                    handleNameChange(e.target.value)
                  }
                  placeholder="Ej. Sofá Europeo Beige Lino"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Slug
                </label>

                <input
                  value={form.babosa}
                  onChange={(e) =>
                    updateField(
                      'babosa',
                      e.target.value
                    )
                  }
                  placeholder="sofa-europeo-beige-lino"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Se genera automáticamente a partir
                  del nombre.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Precio *
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    S/
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={(e) =>
                      updateField(
                        'precio',
                        e.target.value
                      )
                    }
                    placeholder="1599.00"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Existencias *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.existencias}
                  onChange={(e) =>
                    updateField(
                      'existencias',
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Categoría *
                </label>

                <select
                  value={form.subcategoria}
                  onChange={(e) =>
                    updateField(
                      'subcategoria',
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">
                    Seleccionar categoría
                  </option>

                  {CATEGORY_OPTIONS.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>

                {loadingCategories && (
                  <p className="mt-1 text-xs text-slate-400">
                    Comprobando categorías de Supabase...
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Categoría de envío
                </label>

                <select
                  value={form.categoria_de_envio}
                  onChange={(e) =>
                    updateField(
                      'categoria_de_envio',
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="EUROPA">
                    EUROPA
                  </option>

                  <option value="MODULAR">
                    MODULAR
                  </option>

                  <option value="SECCIONAL">
                    SECCIONAL
                  </option>

                  <option value="CAMA">
                    CAMA
                  </option>

                  <option value="3_2_1">
                    3-2-1
                  </option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  Descripción
                </label>

                <textarea
                  rows={5}
                  value={form.descripcion}
                  onChange={(e) =>
                    updateField(
                      'descripcion',
                      e.target.value
                    )
                  }
                  placeholder="Describe materiales, comodidad, diseño, medidas, características..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>
          </section>

          {/* IMÁGENES */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold">
                2. Imágenes del producto
              </h2>

              <p className="text-sm text-slate-500">
                La primera imagen será utilizada como
                imagen principal si no colocas una URL
                principal.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  URL de imagen principal
                </label>

                <input
                  type="url"
                  value={form.url_imagen}
                  onChange={(e) =>
                    updateField(
                      'url_imagen',
                      e.target.value
                    )
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Galería de imágenes
                </label>

                <textarea
                  rows={5}
                  value={form.imagenes}
                  onChange={(e) =>
                    updateField(
                      'imagenes',
                      e.target.value
                    )
                  }
                  placeholder={`Coloca una URL por línea:

https://...
https://...
https://...
https://...`}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              {previewImages.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-bold">
                    Vista previa
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {previewImages.map(
                      (image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                        >
                          <img
                            src={image}
                            alt={`Vista previa ${index + 1}`}
                            className="h-32 w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                'none';
                            }}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* COLORES */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold">
                3. Color inteligente
              </h2>

              <p className="text-sm text-slate-500">
                Estos datos serán utilizados posteriormente
                por el buscador inteligente por color.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Color principal
                </label>

                <select
                  value={form.color_principal}
                  onChange={(e) =>
                    updateField(
                      'color_principal',
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">
                    Seleccionar color
                  </option>

                  {COLOR_OPTIONS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Confianza del reconocimiento
                </label>

                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={form.color_confianza}
                  onChange={(e) =>
                    updateField(
                      'color_confianza',
                      e.target.value
                    )
                  }
                  placeholder="0.95"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  0 = baja confianza · 1 = máxima
                  confianza.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  Colores disponibles
                </label>

                <textarea
                  rows={3}
                  value={form.colores}
                  onChange={(e) =>
                    updateField(
                      'colores',
                      e.target.value
                    )
                  }
                  placeholder="Beige, Gris, Negro"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Puedes separar los colores con comas.
                </p>
              </div>
            </div>
          </section>

          {/* VIDEO */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold">
                4. Video del producto
              </h2>

              <p className="text-sm text-slate-500">
                Aquí prepararemos el pequeño video tipo
                catálogo que vimos anteriormente.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  URL del video
                </label>

                <input
                  type="url"
                  value={form.url_video}
                  onChange={(e) =>
                    updateField(
                      'url_video',
                      e.target.value
                    )
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Imagen de portada del video
                </label>

                <input
                  type="url"
                  value={form.video_portada_url}
                  onChange={(e) =>
                    updateField(
                      'video_portada_url',
                      e.target.value
                    )
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>

            {form.url_video && (
              <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                <p className="text-sm font-bold text-cyan-800">
                  ✓ Video configurado
                </p>

                <p className="mt-1 break-all text-xs text-cyan-700">
                  {form.url_video}
                </p>
              </div>
            )}
          </section>

          {/* DESTACADO */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold">
                5. Inteligencia comercial
              </h2>

              <p className="text-sm text-slate-500">
                Controla cómo aparecerá el producto en
                el catálogo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-cyan-400">
                <input
                  type="checkbox"
                  checked={form.destacado}
                  onChange={(e) =>
                    updateField(
                      'destacado',
                      e.target.checked
                    )
                  }
                  className="h-5 w-5 accent-cyan-600"
                />

                <div>
                  <p className="font-bold">
                    Producto destacado
                  </p>

                  <p className="text-xs text-slate-500">
                    Puede aparecer en Sofás Destacados.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-cyan-400">
                <input
                  type="checkbox"
                  checked={form.mas_vendido}
                  onChange={(e) =>
                    updateField(
                      'mas_vendido',
                      e.target.checked
                    )
                  }
                  className="h-5 w-5 accent-cyan-600"
                />

                <div>
                  <p className="font-bold">
                    Más vendido
                  </p>

                  <p className="text-xs text-slate-500">
                    Marca el producto como uno de los
                    más vendidos.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Orden destacado
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.orden_destacado}
                  onChange={(e) =>
                    updateField(
                      'orden_destacado',
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Clasificación
                </label>

                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.clasificacion}
                  onChange={(e) =>
                    updateField(
                      'clasificacion',
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Visitas
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.visitas}
                  onChange={(e) =>
                    updateField(
                      'visitas',
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>
          </section>

          {/* BOTONES */}
          <div className="sticky bottom-4 z-20 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/admin/productos"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <span>＋</span>
                    Guardar producto
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}