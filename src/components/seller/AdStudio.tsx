'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
type Product = {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  image_url: string | null;
};
export default function AdStudio() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]),
    [selected, setSelected] = useState(''),
    [template, setTemplate] = useState('offer'),
    [caption, setCaption] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const p = products.find((x) => x.id === selected);
  const url = p && typeof window !== 'undefined' ? `${location.origin}/productos/${p.id}` : '';
  const text = p
    ? `${template === 'offer' ? '✨ Oferta Polaris' : '🛍️ Disponible en Polaris'}\n${p.name}\n${(p.sale_price ?? p.price).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}\n${caption}\nCompra y consulta aquí: ${url}`
    : '';
  useEffect(() => {
    if (!user) return;
    createClient()
      .from('products')
      .select('id,name,price,sale_price,image_url')
      .eq('seller_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) setMessage('No se pudieron cargar tus productos.');
        else {
          setProducts(data || []);
          setSelected(data?.[0]?.id || '');
        }
      });
  }, [user]);
  useEffect(() => {
    const c = canvas.current;
    if (!p || !c) return;
    let live = true;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    function draw(image?: HTMLImageElement) {
      if (!ctx || !c || !live) return;
      ctx.fillStyle = template === 'offer' ? '#083344' : '#0f172a';
      ctx.fillRect(0, 0, 1080, 1080);
      ctx.fillStyle = '#67e8f9';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText('POLARIS', 65, 100);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(
        template === 'offer' ? 'OFERTA ESPECIAL' : 'DESCUBRE TU PRÓXIMA COMPRA',
        65,
        165
      );
      if (image) {
        const ratio = Math.min(950 / image.width, 520 / image.height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(65, 205, 950, 520);
        ctx.drawImage(
          image,
          65 + (950 - image.width * ratio) / 2,
          205 + (520 - image.height * ratio) / 2,
          image.width * ratio,
          image.height * ratio
        );
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 43px sans-serif';
      ctx.fillText((p?.name || '').slice(0, 40), 65, 800, 950);
      ctx.fillStyle = '#67e8f9';
      ctx.font = 'bold 65px sans-serif';
      ctx.fillText(
        (p?.sale_price ?? p?.price ?? 0).toLocaleString('es-PE', {
          style: 'currency',
          currency: 'PEN',
        }),
        65,
        895
      );
      ctx.fillStyle = '#fff';
      ctx.font = '28px sans-serif';
      ctx.fillText(caption.slice(0, 60), 65, 955, 950);
      ctx.fillText('Compra desde el enlace de esta publicación', 65, 1020);
    }
    draw();
    if (p.image_url) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => draw(image);
      image.onerror = () => draw();
      image.src = p.image_url;
    }
    return () => {
      live = false;
    };
  }, [p, template, caption]);
  async function file() {
    return new Promise<File>((resolve, reject) => {
      try {
        canvas.current?.toBlob(
          (blob) =>
            blob
              ? resolve(new File([blob], 'polaris-anuncio.png', { type: 'image/png' }))
              : reject(new Error()),
          'image/png'
        );
      } catch {
        reject(new Error());
      }
    });
  }
  async function download() {
    setBusy(true);
    try {
      const image = await file();
      const object = URL.createObjectURL(image);
      const a = document.createElement('a');
      a.href = object;
      a.download = image.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(object), 1000);
      setMessage('Imagen descargada. Adjunta la imagen y el texto a tu publicación.');
    } catch {
      setMessage('No se pudo descargar la imagen. Prueba con una foto alojada en Polaris.');
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: p?.name, text, url });
      else {
        await navigator.clipboard.writeText(text);
        setMessage('Texto y enlace copiados.');
      }
    } catch {
      setMessage('No se compartió la publicación. Puedes copiar el texto manualmente.');
    }
  }
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-10">
      <h1 className="text-3xl font-black">Estudio de anuncios</h1>
      <p className="max-w-3xl text-sm text-slate-600">
        Genera imágenes y textos para WhatsApp, Facebook, Instagram y otras redes. Publicar y
        compartir es una decisión tuya. Facebook Marketplace requiere crear el anuncio en Facebook;
        su publicación automática no dispone de una integración gratuita abierta.
      </p>
      {!products.length ? (
        <p>Publica un producto para crear tu primer anuncio.</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <section className="space-y-5 rounded-3xl border bg-white p-6">
            <label className="block text-sm font-bold">
              Producto
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="mt-2 w-full rounded-xl border p-3"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold">
              Plantilla
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="mt-2 w-full rounded-xl border p-3"
              >
                <option value="offer">Oferta turquesa</option>
                <option value="catalog">Catálogo noche</option>
              </select>
            </label>
            <label className="block text-sm font-bold">
              Mensaje
              <textarea
                maxLength={200}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
            <textarea
              readOnly
              value={text}
              aria-label="Texto del anuncio"
              rows={7}
              className="w-full rounded-xl border p-3 text-sm"
            />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={download}
                disabled={busy}
                className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-bold text-white"
              >
                Descargar imagen
              </button>
              <button onClick={share} className="rounded-full border px-5 py-3 text-sm font-bold">
                Compartir enlace
              </button>
              <button
                onClick={() =>
                  navigator.clipboard
                    .writeText(text)
                    .then(() => setMessage('Texto copiado.'))
                    .catch(() => setMessage('Selecciona y copia el texto del anuncio.'))
                }
                className="rounded-full border px-5 py-3 text-sm"
              >
                Copiar texto
              </button>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border px-5 py-3 text-sm"
              >
                Compartir en Facebook
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(text)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border px-5 py-3 text-sm"
              >
                WhatsApp
              </a>
            </div>
          </section>
          <canvas
            ref={canvas}
            width={1080}
            height={1080}
            className="h-auto w-full rounded-3xl"
            aria-label="Vista previa del anuncio"
          />
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </main>
  );
}
