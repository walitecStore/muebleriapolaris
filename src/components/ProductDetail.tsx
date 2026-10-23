'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { useCart } from '@/app/components/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
type Variant = {
  id: string;
  name: string;
  stock: number;
  price_adjustment: number;
  additional_price: number;
  image_url?: string;
};
type Product = {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  description: string;
  stock: number;
  image: string;
  images: string[];
  category: string;
  variants: Variant[];
  sku?: string;
  reviews: { id: string; name: string; rating: number; title: string; text: string }[];
};
export default function ProductDetail({ id }: { id: string }) {
  const { addItem } = useCart(),
    { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [reload, setReload] = useState(0),
    [selected, setSelected] = useState(''),
    [quantity, setQuantity] = useState(1),
    [image, setImage] = useState(''),
    [reviewMessage, setReviewMessage] = useState(''),
    [reviewBusy, setReviewBusy] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError('');
    setProduct(null);
    fetch('/api/products?id=' + encodeURIComponent(id), { signal: c.signal, cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'No se pudo cargar el producto.');
        return d.products[0] as Product | undefined;
      })
      .then((p) => {
        if (!p) throw new Error('Este producto no está disponible.');
        setProduct(p);
        setImage(p.image);
        setSelected('');
        setQuantity(1);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [id, reload]);
  async function submitReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !product) return;
    const form = e.currentTarget,
      data = new FormData(form);
    setReviewBusy(true);
    setReviewMessage('');
    try {
      const { error } = await createClient()
        .from('product_reviews')
        .insert({
          product_id: product.id,
          user_id: user.id,
          name: String(data.get('name')).trim(),
          rating: Number(data.get('rating')),
          title: String(data.get('title')).trim(),
          text: String(data.get('text')).trim(),
          status: 'pending',
          verified: false,
        });
      if (error) throw error;
      form.reset();
      setReviewMessage('Reseña enviada para revisión. Se publicará después de ser aprobada.');
    } catch {
      setReviewMessage('No se pudo enviar la reseña. No se guardó; inténtalo nuevamente.');
    } finally {
      setReviewBusy(false);
    }
  }
  if (loading)
    return (
      <p role="status" className="mx-auto max-w-6xl px-5 py-20">
        Cargando producto…
      </p>
    );
  if (error || !product)
    return (
      <div role="alert" className="mx-auto max-w-4xl space-y-5 p-10">
        <h1 className="text-2xl font-black">Producto no disponible</h1>
        <p>{error}</p>
        <button onClick={() => setReload((x) => x + 1)} className="mr-5 underline">
          Reintentar
        </button>
        <Link href="/catalogo" className="underline">
          Volver al catálogo
        </Link>
      </div>
    );
  const variant = product.variants.find((v) => v.id === selected),
    stock = Math.min(product.stock, variant ? variant.stock : product.stock),
    price =
      product.priceValue +
      Number(variant?.price_adjustment || 0) +
      Number(variant?.additional_price || 0);
  const canBuy =
    stock >= quantity &&
    quantity >= 1 &&
    Number.isInteger(quantity) &&
    (!product.variants.length || !!variant);
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-5 py-10">
      <Link href="/catalogo" className="text-sm text-cyan-700">
        ← Volver al catálogo
      </Link>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative h-[420px] overflow-hidden rounded-3xl bg-slate-100">
            <AppImage
              src={image || product.image}
              alt={product.name}
              fill
              unoptimized
              priority
              sizes="(max-width:1024px) 100vw,50vw"
              className="object-cover"
            />
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {product.images.map((url, index) => (
              <button
                key={url}
                aria-label={`Ver imagen ${index + 1}`}
                onClick={() => setImage(url)}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border"
              >
                <AppImage src={url} alt="" fill unoptimized sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
        <section className="space-y-5">
          <p className="text-sm text-cyan-700">{product.category}</p>
          <h1 className="text-4xl font-black">{product.name}</h1>
          <p className="text-3xl font-black">
            {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(price)}
          </p>
          {product.sku && <p className="text-xs text-slate-500">SKU: {product.sku}</p>}
          <p className="whitespace-pre-wrap leading-relaxed text-slate-600">
            {product.description}
          </p>
          {product.variants.length > 0 && (
            <label className="block text-sm font-bold">
              Elige una variante
              <select
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setQuantity(1);
                  const v = product.variants.find((v) => v.id === e.target.value);
                  if (v?.image_url) setImage(v.image_url);
                }}
                className="mt-2 w-full rounded-xl border p-3"
              >
                <option value="">Seleccionar</option>
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                    {v.name}
                    {v.stock <= 0 ? ' — Agotado' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="text-sm">
            {stock > 0 ? `${stock} unidad(es) disponibles` : 'Sin existencias'}
          </p>
          <label className="block text-sm">
            Cantidad
            <input
              type="number"
              min="1"
              max={Math.min(stock, 99)}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="ml-4 w-24 rounded-lg border p-3"
            />
          </label>
          <button
            disabled={!canBuy}
            onClick={() => {
              for (let i = 0; i < quantity; i++)
                addItem({
                  id: product.id,
                  variantId: variant?.id || null,
                  name: product.name,
                  price: `S/ ${price.toFixed(2)}`,
                  image: image || product.image,
                  alt: product.name,
                });
            }}
            className="w-full rounded-xl bg-slate-950 px-6 py-4 font-bold text-white disabled:bg-slate-300"
          >
            {product.stock <= 0 ? 'Agotado' : 'Agregar al carrito'}
          </button>
          <p className="text-xs text-slate-500">
            Envío calculado según tu ubicación. El precio y el stock se validan al crear el pedido.
          </p>
          <div className="flex gap-4 text-sm text-cyan-700">
            <Link href="/politicas/envios">Envíos</Link>
            <Link href="/politicas/devoluciones">Devoluciones</Link>
          </div>
        </section>
      </div>
      <section className="rounded-2xl border p-6">
        <h2 className="text-2xl font-black">Reseñas de clientes</h2>
        <div className="mt-5 space-y-4">
          {product.reviews.map((r) => (
            <article key={r.id} className="border-b pb-4">
              <h3 className="font-bold">{r.title}</h3>
              <p className="text-sm text-slate-500">
                {r.name} · {r.rating}/5
              </p>
              <p className="mt-2">{r.text}</p>
            </article>
          ))}
          {!product.reviews.length && (
            <p className="text-sm text-slate-500">
              Este producto todavía no tiene reseñas publicadas.
            </p>
          )}
        </div>
        {user ? (
          <form onSubmit={submitReview} className="mt-8 grid max-w-2xl gap-4">
            <h3 className="font-bold">Comparte tu experiencia</h3>
            <label>
              Nombre
              <input
                name="name"
                required
                maxLength={100}
                className="mt-1 w-full rounded-lg border p-3"
              />
            </label>
            <label>
              Calificación
              <select name="rating" className="ml-3 rounded-lg border p-2">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Título
              <input
                name="title"
                required
                maxLength={150}
                className="mt-1 w-full rounded-lg border p-3"
              />
            </label>
            <label>
              Reseña
              <textarea
                name="text"
                required
                minLength={5}
                maxLength={2000}
                className="mt-1 w-full rounded-lg border p-3"
              />
            </label>
            <button disabled={reviewBusy} className="rounded-xl bg-slate-950 p-3 text-white">
              {reviewBusy ? 'Enviando…' : 'Enviar para revisión'}
            </button>
            <p role="status" className="text-sm">
              {reviewMessage}
            </p>
          </form>
        ) : (
          <Link href="/login" className="mt-6 inline-block text-cyan-700 underline">
            Inicia sesión para escribir una reseña
          </Link>
        )}
      </section>
    </div>
  );
}
