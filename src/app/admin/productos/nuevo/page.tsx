'use client';

import React, { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Category = {
  id: string;
  name: string;
  slug?: string | null;
};

type ProductForm = {
  nombre: string;
  babosa: string;
  descripcion: string;
  precio: string;
  existencias: string;
  categoria: string;
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
  categoria: '',
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
  { value: 'EUROPA', label: 'Sofás Europeo' },
  { value: 'MODULAR', label: 'Sofás Modulares' },
  { value: 'SECCIONAL', label: 'Sofás Seccionales' },
  { value: 'CAMA', label: 'Sofás Cama' },
  { value: '3_2_1', label: 'Sofás 3-2-1' },
  { value: 'PUFS_DECORATIVOS', label: 'Pufs y Decorativos' },
  { value: 'RECLINABLE', label: 'Sofás Reclinables' },
  { value: 'COMEDORES', label: 'Comedores' },
];

const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  EUROPA: ['Europeo en Medida Original', 'Europeo Mediano', 'Europeo Mini', 'Europeo Mini Modular'],
  MODULAR: ['Modular Fijo', 'Modular Suelto'],
  SECCIONAL: ['Seccional Fijo', 'Seccionales Sueltos', 'Seccionales con Parlantes'],
  CAMA: ['Sofá Cama Fijo', 'Sofás Cama Sueltos'],
  '3_2_1': ['Sofás 3-2-1-Sueltos'],
  PUFS_DECORATIVOS: ['Pufs', 'Decorativos'],
  RECLINABLE: [],
  COMEDORES: [],
};

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

function parseList(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: string, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeCategoryText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  EUROPA: ['EUROPA', 'Sofás Europeo', 'Sofas Europeo', 'Sofá Europeo', 'Sofa Europeo'],
  MODULAR: ['MODULAR', 'Sofás Modulares', 'Sofas Modulares', 'Sofá Modular', 'Sofa Modular'],
  SECCIONAL: [
    'SECCIONAL',
    'Sofás Seccionales',
    'Sofas Seccionales',
    'Sofá Seccional',
    'Sofa Seccional',
  ],
  CAMA: ['CAMA', 'Sofás Cama', 'Sofas Cama', 'Sofá Cama', 'Sofa Cama'],
  '3_2_1': ['3_2_1', '3-2-1', 'Sofás 3-2-1', 'Sofas 3-2-1', 'Sofá 3-2-1', 'Sofa 3-2-1'],
  PUFS_DECORATIVOS: [
    'PUFS_DECORATIVOS',
    'PUFS Y DECORATIVOS',
    'Pufs y Decorativos',
    'Puffs y Decorativos',
    'Pufs',
    'Puffs',
  ],
  RECLINABLE: [
    'RECLINABLE',
    'Sofás Reclinables',
    'Sofas Reclinables',
    'Sofá Reclinable',
    'Sofa Reclinable',
  ],
  COMEDORES: ['COMEDORES', 'Comedores', 'Comedor'],
};

export default function NuevoProductoPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoadingCategories(true);

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.warn('No se pudieron cargar las categorías:', error);
        setCategories([]);
      } else {
        setCategories((data ?? []) as Category[]);
      }

      setLoadingCategories(false);
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    setPreviewImages(parseList(form.imagenes));
  }, [form.imagenes]);

  function updateField<K extends keyof ProductForm>(field: K, value: ProductForm[K]) {
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
    setErrorMessage('');
    setSuccessMessage('');
  }

  function validateForm() {
    if (!form.nombre.trim()) return 'Debes ingresar el nombre del producto.';
    if (!form.precio.trim()) return 'Debes ingresar el precio.';

    const price = toNumber(form.precio, -1);
    if (price < 0) return 'El precio debe ser un número válido.';

    const stock = toNumber(form.existencias, -1);
    if (stock < 0) return 'Las existencias no pueden ser negativas.';

    if (!form.categoria.trim()) {
      return 'Selecciona una categoria para el producto.';
    }

    if (form.categoria === '__new__' && !newCategoryName.trim()) {
      return 'Escribe el nombre de la nueva categoria.';
    }

    const slug = form.babosa.trim() || createSlug(form.nombre);
    if (!slug) return 'No se pudo generar el slug del producto.';

    return null;
  }

  async function uploadSelectedFiles(files: File[]) {
    if (files.length === 0) return [] as string[];

    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`El archivo ${file.name} no es una imagen.`);
        }
        if (file.size > 8 * 1024 * 1024) {
          throw new Error(`La imagen ${file.name} supera el límite de 8 MB.`);
        }

        const safeName = file.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9._-]/g, '-')
          .toLowerCase();
        const path = `products/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          throw new Error(`No se pudo subir ${file.name}: ${uploadError.message}`);
        }

        const { data } = supabase.storage.from('product-images').getPublicUrl(path);

        if (!data.publicUrl) {
          throw new Error(`No se obtuvo la URL pública de ${file.name}.`);
        }

        uploadedUrls.push(data.publicUrl);
      }

      return uploadedUrls;
    } finally {
      setUploadingImages(false);
    }
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setSelectedFiles((previous) => [...previous, ...files].slice(0, 10));

    const localPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((previous) => [...previous, ...localPreviews].slice(0, 10));
    setErrorMessage('');
    setSuccessMessage('');
    event.target.value = '';
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    setPreviewImages((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
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
      const images = parseList(form.imagenes);
      const uploadedUrls = await uploadSelectedFiles(selectedFiles);
      const allImages = Array.from(new Set([...uploadedUrls, ...images]));
      const mainImage = form.url_imagen.trim() || allImages[0] || null;
      const colors = parseList(form.colores);
      const slug = form.babosa.trim() || createSlug(form.nombre);

      /*
       * IMPORTANTE:
       * Estos nombres coinciden con las columnas reales de public.products
       * que comprobamos en Supabase. Las columnas con espacios o tildes
       * se envían exactamente con su nombre real.
       */
      /*
       * IMPORTANTE:
       * Estos son los nombres reales de public.products.
       * El panel de Supabase los mostraba traducidos, pero PostgreSQL
       * utiliza: id, category_id, name, slug, description, price,
       * image_url, images, stock, is_active y subcategory.
       */
      const productPayload: Record<string, unknown> = {
        category_id: null,
        name: form.nombre.trim(),
        slug,
        description: form.descripcion.trim() || null,
        price: toNumber(form.precio),
        image_url: mainImage,
        images: allImages,
        stock: Math.max(0, Math.trunc(toNumber(form.existencias))),
        is_active: true,
        subcategory: form.subcategoria.trim() || null,
      };

      /*
       * Relacionar el producto con la categoría real.
       * Los valores del formulario son internos (EUROPA, MODULAR, etc.),
       * mientras que categories.name contiene el nombre visible.
       */
      let categoryId = form.categoria;

      if (form.categoria === '__new__') {
        const categoryName = newCategoryName.trim();
        const { data: createdCategory, error: categoryError } = await supabase
          .from('categories')
          .insert({ name: categoryName, slug: createSlug(categoryName) })
          .select('id')
          .single();

        if (categoryError || !createdCategory?.id) {
          throw new Error(categoryError?.message || 'No se pudo crear la nueva categoria.');
        }

        categoryId = String(createdCategory.id);
      }

      productPayload.category_id = categoryId;

      const { error } = await supabase.from('products').insert(productPayload);

      if (error) {
        console.error('ERROR CREANDO PRODUCTO:', error);

        throw new Error(error.message || 'No se pudo crear el producto.');
      }

      console.log('PRODUCTO CREADO CORRECTAMENTE');

      setSuccessMessage('Producto creado correctamente.');
      setForm(INITIAL_FORM);
      setNewCategoryName('');
      setSelectedFiles([]);
      setPreviewImages([]);

      window.setTimeout(() => {
        router.push('/admin/productos');
        router.refresh();
      }, 900);
    } catch (error) {
      console.error('ERROR CREANDO PRODUCTO:', error);

      setErrorMessage(
        error instanceof Error ? error.message : 'Ocurrió un error al crear el producto.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-extrabold">Nuevo producto</h1>
            <p className="text-sm text-slate-500">
              Agrega productos al catálogo inteligente de Mueblería Polaris.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold">1. Información del producto</h2>
              <p className="text-sm text-slate-500">Datos principales que verá el cliente.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">Nombre del producto *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej. Sofá Europeo Beige Lino"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Slug / babosa *</label>
                <input
                  value={form.babosa}
                  onChange={(e) => updateField('babosa', e.target.value)}
                  placeholder="sofa-europeo-beige-lino"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Debe ser único. Se genera automáticamente.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Precio *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={(e) => updateField('precio', e.target.value)}
                    placeholder="1599.00"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Existencias *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.existencias}
                  onChange={(e) => updateField('existencias', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Categoría *</label>
                <select
                  value={form.categoria}
                  onChange={(e) => {
                    updateField('categoria', e.target.value);
                    setForm((previous) => ({
                      ...previous,
                      categoria: e.target.value,
                      subcategoria: '',
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">Seleccionar categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                  <option value="__new__">+ Crear nueva categoria</option>
                </select>

                {form.categoria === '__new__' && (
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ej. Iluminacion, Jardin o Electrohogar"
                    className="mt-3 w-full rounded-xl border border-cyan-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                )}

                {loadingCategories && (
                  <p className="mt-1 text-xs text-slate-400">
                    Comprobando categorías de Supabase...
                  </p>
                )}

                {!loadingCategories && categories.length === 0 && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    No se encontraron categorías en Supabase.
                  </p>
                )}

                {!loadingCategories && categories.length > 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    {categories.length} categoría(s) disponibles en Supabase.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Subcategoría</label>
                <select
                  value={form.subcategoria}
                  onChange={(e) => updateField('subcategoria', e.target.value)}
                  disabled={!form.categoria}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100"
                >
                  <option value="">Seleccionar subcategoría</option>
                  {(SUBCATEGORY_OPTIONS[form.categoria] ?? []).map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  Puedes dejarla vacía si el producto no pertenece a una subcategoría específica.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Categoría de envío</label>
                <select
                  value={form.categoria_de_envio}
                  onChange={(e) => updateField('categoria_de_envio', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="EUROPA">EUROPA</option>
                  <option value="MODULAR">MODULAR</option>
                  <option value="SECCIONAL">SECCIONAL</option>
                  <option value="CAMA">CAMA</option>
                  <option value="3_2_1">3-2-1</option>
                  <option value="PUFS_DECORATIVOS">PUFS Y DECORATIVOS</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">Descripción</label>
                <textarea
                  rows={5}
                  value={form.descripcion}
                  onChange={(e) => updateField('descripcion', e.target.value)}
                  placeholder="Describe materiales, comodidad, diseño, medidas y características..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold">2. Imágenes del producto</h2>
              <p className="text-sm text-slate-500">
                Puedes colocar una imagen principal y varias imágenes de colores/variantes.
              </p>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/40 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm">
                    <ImagePlus size={21} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Subir imágenes desde tu computadora</p>
                    <p className="text-xs text-slate-500">
                      Hasta 10 imágenes · JPG, PNG o WebP · máximo 8 MB cada una.
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700">
                    <Upload size={17} />
                    Seleccionar imágenes
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleFileSelection}
                      className="hidden"
                    />
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        {previewImages[index] && (
                          <img
                            src={previewImages[index]}
                            alt={file.name}
                            className="h-28 w-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(index)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow"
                          title="Quitar imagen"
                        >
                          <X size={15} />
                        </button>
                        <p className="truncate px-2 py-2 text-[11px] text-slate-500">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">URL de imagen principal</label>
                <input
                  type="url"
                  value={form.url_imagen}
                  onChange={(e) => updateField('url_imagen', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Galería de imágenes</label>
                <textarea
                  rows={5}
                  value={form.imagenes}
                  onChange={(e) => updateField('imagenes', e.target.value)}
                  placeholder={`Una URL por línea:
https://...
https://...
https://...
https://...`}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  La primera imagen se usa como principal si no colocas una URL principal.
                </p>
              </div>

              {previewImages.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-bold">Vista previa</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {previewImages.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={image}
                          alt={`Vista previa ${index + 1}`}
                          className="h-32 w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold">3. Reconocimiento de color</h2>
              <p className="text-sm text-slate-500">
                Información preparada para el buscador inteligente por color.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">Color principal</label>
                <select
                  value={form.color_principal}
                  onChange={(e) => updateField('color_principal', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">Seleccionar color</option>
                  {COLOR_OPTIONS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Confianza del reconocimiento</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={form.color_confianza}
                  onChange={(e) => updateField('color_confianza', e.target.value)}
                  placeholder="0.95"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
                <p className="mt-1 text-xs text-slate-400">Usa valores entre 0 y 1.</p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">Colores disponibles</label>
                <textarea
                  rows={3}
                  value={form.colores}
                  onChange={(e) => updateField('colores', e.target.value)}
                  placeholder="Beige, Gris, Negro"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold">4. Video del producto</h2>
              <p className="text-sm text-slate-500">
                Pequeño video tipo catálogo para mostrar el modelo.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">URL del video</label>
                <input
                  type="url"
                  value={form.url_video}
                  onChange={(e) => updateField('url_video', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Imagen de portada</label>
                <input
                  type="url"
                  value={form.video_portada_url}
                  onChange={(e) => updateField('video_portada_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>

            {form.url_video && (
              <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                <p className="text-sm font-bold text-cyan-800">✓ Video configurado</p>
                <p className="mt-1 break-all text-xs text-cyan-700">{form.url_video}</p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold">5. Inteligencia comercial</h2>
              <p className="text-sm text-slate-500">
                Controla cómo aparecerá el producto en el catálogo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-cyan-400">
                <input
                  type="checkbox"
                  checked={form.destacado}
                  onChange={(e) => updateField('destacado', e.target.checked)}
                  className="h-5 w-5 accent-cyan-600"
                />
                <div>
                  <p className="font-bold">Producto destacado</p>
                  <p className="text-xs text-slate-500">Puede aparecer en Sofás Destacados.</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-cyan-400">
                <input
                  type="checkbox"
                  checked={form.mas_vendido}
                  onChange={(e) => updateField('mas_vendido', e.target.checked)}
                  className="h-5 w-5 accent-cyan-600"
                />
                <div>
                  <p className="font-bold">Más vendido</p>
                  <p className="text-xs text-slate-500">
                    Marca el producto como uno de los más vendidos.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-bold">Orden destacado</label>
                <input
                  type="number"
                  min="0"
                  value={form.orden_destacado}
                  onChange={(e) => updateField('orden_destacado', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Clasificación</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.clasificacion}
                  onChange={(e) => updateField('clasificacion', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Visitas</label>
                <input
                  type="number"
                  min="0"
                  value={form.visitas}
                  onChange={(e) => updateField('visitas', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Favoritos</label>
                <input
                  type="number"
                  min="0"
                  value={form.favorecer}
                  onChange={(e) => updateField('favorecer', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Reseñas</label>
                <input
                  type="number"
                  min="0"
                  value={form.recuento_de_revisiones}
                  onChange={(e) => updateField('recuento_de_revisiones', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>
          </section>

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
                disabled={saving || uploadingImages}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving || uploadingImages ? (
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
