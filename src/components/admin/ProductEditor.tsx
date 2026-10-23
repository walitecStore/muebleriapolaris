'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { publicWebUrl } from '@/lib/store-profile';
const blank = {
  name: '',
  slug: '',
  description: '',
  price: '',
  sale_price: '',
  stock: '0',
  category_id: '',
  sku: '',
  color: '',
  material: '',
  shipping_factor: '1',
  images: '',
  is_active: true,
  is_featured: false,
  delivery_vehicle: 'truck',
  delivery_partner: 'polaris',
  promotion_eligible: true,
};
const columns =
  'id,name,slug,description,price,sale_price,stock,category_id,sku,color,material,shipping_factor,images,image_url,is_active,is_featured,updated_at,delivery_vehicle,delivery_partner,promotion_eligible';
export default function ProductEditor({ id, sellerId }: { id?: string; sellerId?: string }) {
  const base = sellerId ? '/vender/productos' : '/admin/productos';
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [reload, setReload] = useState(0);
  const [marketReady, setMarketReady] = useState(true);
  const [loadedVersion, setLoadedVersion] = useState<string | null>(null);
  const [form, setForm] = useState(blank),
    [categories, setCategories] = useState<{ id: string; name: string }[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [files, setFiles] = useState<File[]>([]),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setLoading(true);
    setReady(false);
    setError('');
    async function load() {
      try {
        const { data, error } = await createClient()
          .from('categories')
          .select('id,name')
          .order('name');
        if (error) throw error;
        if (live) setCategories(data || []);
        if (!id && !sellerId) {
          const check = await createClient().from('products').select('promotion_eligible').limit(1);
          if (check.error) setMarketReady(false);
        }
        if (id) {
          let { data: p, error } = await createClient()
            .from('products')
            .select(columns)
            .eq('id', id)
            .single();
          if (error && !sellerId) {
            const legacy = await createClient()
              .from('products')
              .select(columns.replace(',delivery_vehicle,delivery_partner,promotion_eligible', ''))
              .eq('id', id)
              .single();
            p = legacy.data as typeof p;
            error = legacy.error;
            setMarketReady(false);
          }
          if (error || !p) throw error;
          if (live) setLoadedVersion(p.updated_at);
          if (live)
            setForm({
              ...blank,
              ...p,
              price: String(p.price),
              sale_price: p.sale_price === null ? '' : String(p.sale_price),
              stock: String(p.stock),
              category_id: p.category_id || '',
              sku: p.sku || '',
              color: p.color || '',
              material: p.material || '',
              description: p.description || '',
              shipping_factor: String(p.shipping_factor),
              images: Array.from(
                new Set([p.image_url, ...(Array.isArray(p.images) ? p.images : [])])
              )
                .filter(Boolean)
                .join('\n'),
            });
        }
        if (live) setReady(true);
      } catch {
        if (live)
          setError('No se pudo cargar el formulario. Comprueba la conexión y las migraciones.');
      } finally {
        if (live) setLoading(false);
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [id, sellerId, reload]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setError('');
    if (id && !loadedVersion) {
      setError('No se cargó la versión del producto. Recarga la página antes de editar.');
      return;
    }
    const price = Number(form.price),
      sale = form.sale_price === '' ? null : Number(form.sale_price),
      stock = Number(form.stock);
    if (
      !form.name.trim() ||
      form.price === '' ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isFinite(Number(form.shipping_factor)) ||
      Number(form.shipping_factor) < 1 ||
      (sale !== null && (!Number.isFinite(sale) || sale <= 0 || sale > price))
    ) {
      setError('Revisa nombre, precio, oferta, stock entero y factor de envío (mínimo 1).');
      return;
    }
    const urls = form.images
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (
      urls.some(
        (url) =>
          !publicWebUrl(url) &&
          !(url.startsWith('/assets/images/') && !url.includes('..') && !url.includes('\\'))
      )
    ) {
      setError('Las imágenes deben tener una URL http:// o https:// válida.');
      return;
    }
    if (
      files.some(
        (f) =>
          !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(f.type) ||
          f.size > 8 * 1024 * 1024
      )
    ) {
      setError('Usa imágenes JPG, PNG, WebP o AVIF de hasta 8 MB.');
      return;
    }
    const slug =
      form.slug.trim() ||
      form.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError('El identificador debe usar letras minúsculas, números y guiones.');
      return;
    }
    setBusy(true);
    const uploaded: string[] = [];
    let canRemoveUploads = false;
    try {
      const db = createClient();
      for (const file of files) {
        const path = `${sellerId || 'products'}/${crypto.randomUUID()}.${file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]}`;
        const { error } = await db.storage
          .from('product-images')
          .upload(path, file, { upsert: false, contentType: file.type });
        if (error)
          throw new Error(
            'No se pudo subir la imagen. Comprueba el bucket product-images y sus permisos.'
          );
        uploaded.push(path);
        urls.push(db.storage.from('product-images').getPublicUrl(path).data.publicUrl);
      }
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        slug,
        description: form.description.trim(),
        price,
        sale_price: sale,
        stock,
        category_id: form.category_id || null,
        sku: form.sku.trim() || null,
        color: form.color.trim(),
        material: form.material.trim(),
        shipping_factor: Number(form.shipping_factor),
        images: urls,
        image_url: urls[0] || null,
        is_active: form.is_active,
        ...(sellerId ? { seller_id: sellerId } : { is_featured: form.is_featured }),
        delivery_vehicle: form.delivery_vehicle,
        delivery_partner: form.delivery_partner,
        promotion_eligible: form.promotion_eligible,
      };
      if (!marketReady) {
        delete payload.delivery_vehicle;
        delete payload.delivery_partner;
        delete payload.promotion_eligible;
      }
      const q = id
        ? db
            .from('products')
            .update(payload)
            .eq('id', id)
            .eq('updated_at', loadedVersion || '')
        : db.from('products').insert(payload);
      const { error } = await q.select('id').single();
      if (error) {
        canRemoveUploads = !!error.code && /^[0-9A-Z]{5}$/.test(error.code);
        throw new Error(
          error.code === 'PGRST116'
            ? 'El producto cambió mientras lo editabas. Recarga para conservar el stock actualizado.'
            : 'No se pudo guardar. Revisa el identificador y el SKU; deben ser únicos.'
        );
      }
      router.push(base);
      router.refresh();
    } catch (e) {
      if (canRemoveUploads && uploaded.length)
        await createClient().storage.from('product-images').remove(uploaded);
      setError(e instanceof Error ? e.message : 'No se pudo guardar el producto.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <Link href={base} className="text-sm text-cyan-700">
        ← Productos
      </Link>
      <h1 className="mt-4 text-3xl font-black">{id ? 'Editar producto' : 'Agregar producto'}</h1>
      <p className="mt-2 text-sm text-slate-500">
        Nombre, precio, fotos y stock: lo necesario para empezar a vender.
      </p>
      {loading ? (
        <p role="status" className="py-8">
          Cargando…
        </p>
      ) : !ready ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="mt-4 rounded-xl border bg-white px-5 py-3 font-bold"
          >
            Reintentar carga del producto
          </button>
        </div>
      ) : (
        <form onSubmit={save} className="mt-6 space-y-6">
          <section className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
            {[
              ['name', 'Nombre del producto'],
              ['slug', 'Identificador URL (opcional)'],
              ['price', 'Precio S/'],
              ['sale_price', 'Precio de oferta S/ (opcional)'],
              ['stock', 'Unidades en stock'],
              ['sku', 'SKU (opcional)'],
              ['color', 'Color'],
              ['material', 'Material'],
              ['shipping_factor', 'Factor de envío (mínimo 1)'],
            ].map(([key, label]) => (
              <label key={key} className="text-sm font-semibold">
                {label}
                <input
                  value={String(form[key as keyof typeof form])}
                  type={
                    ['price', 'sale_price', 'stock', 'shipping_factor'].includes(key)
                      ? 'number'
                      : 'text'
                  }
                  step={key === 'stock' ? '1' : 'any'}
                  required={['name', 'price', 'stock', 'shipping_factor'].includes(key)}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                />
              </label>
            ))}
            <label className="text-sm font-semibold">
              Categoría
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="mt-1 w-full rounded-lg border p-3"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {!sellerId && (
                <Link href="/admin/categorias" className="mt-2 block text-xs text-cyan-700">
                  Gestionar categorías
                </Link>
              )}
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Descripción
              <textarea
                required
                rows={5}
                maxLength={10000}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-lg border p-3 font-normal"
              />
            </label>
          </section>
          <section className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
            <h2 className="font-bold sm:col-span-2">Entrega y ofertas</h2>
            <label className="text-sm">
              Vehículo
              <select
                value={form.delivery_vehicle}
                onChange={(e) => setForm({ ...form, delivery_vehicle: e.target.value })}
                className="mt-2 w-full rounded-xl border p-3"
              >
                <option value="motorcycle">Motorizado (pequeño)</option>
                <option value="truck">Camión (grande)</option>
              </select>
            </label>
            <label className="text-sm">
              Coordinar con
              <select
                value={form.delivery_partner}
                onChange={(e) => setForm({ ...form, delivery_partner: e.target.value })}
                className="mt-2 w-full rounded-xl border p-3"
              >
                <option value="polaris">Polaris</option>
                <option value="independent">Transportista particular</option>
              </select>
            </label>
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.promotion_eligible}
                onChange={(e) => setForm({ ...form, promotion_eligible: e.target.checked })}
              />
              Participar en descuentos Polaris si el precio es de hasta S/60. El descuento reduce el
              importe de esta venta; no lo financia un tercero.
            </label>
          </section>
          <section className="space-y-4 rounded-2xl border bg-white p-5">
            <h2 className="font-bold">Fotos del producto</h2>
            <label className="block text-sm">
              Subir imágenes (máx. 8 MB cada una)
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="mt-2 block w-full"
              />
            </label>
            <label className="block text-sm">
              O pegar URLs de imágenes, una por línea. La primera es la portada.
              <textarea
                rows={4}
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                className="mt-1 w-full rounded-lg border p-3"
              />
            </label>
            {files.length > 0 && (
              <p className="text-sm text-slate-500">
                {files.length} imagen(es) pendientes de subir.
              </p>
            )}
          </section>
          <section className="flex flex-wrap gap-5 rounded-2xl border bg-white p-5">
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Visible en la tienda
            </label>
            {!sellerId && (
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                />
                Mostrar en destacados
              </label>
            )}
          </section>
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Guardando producto…' : 'Guardar producto'}
          </button>
        </form>
      )}
    </main>
  );
}
