'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, ShoppingCart, Truck } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';
import { useCart } from '@/app/components/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
export type CatalogProduct = {
  id: string;
  name: string;
  price: string;
  priceValue?: number;
  image: string;
  stock: number;
  category?: string;
  category_id?: string;
  description?: string;
  variants?: unknown[];
  originalPrice?: string;
  promotion_eligible?: boolean;
  delivery_vehicle?: string;
};
export default function ProductCard({ product: p }: { product: CatalogProduct }) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite, loading, error } = useFavorites();
  const [message, setMessage] = useState('');
  const favorite = isFavorite(p.id);
  const variants = !!p.variants?.length;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[25px] border border-teal-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-48 bg-slate-100 sm:h-52">
        <Link
          href={`/productos/${p.id}`}
          className="absolute inset-0"
          aria-label={`Ver detalles de ${p.name}`}
        >
          <AppImage
            src={p.image}
            alt={p.name}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw"
          />
        </Link>
        <button
          type="button"
          aria-label={`${favorite ? 'Quitar de' : 'Guardar en'} favoritos: ${p.name}`}
          aria-pressed={favorite}
          disabled={loading}
          onClick={async () => {
            const ok = await toggleFavorite(p.id, p.name);
            setMessage(ok ? '' : 'No se pudo guardar el favorito.');
          }}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-red-500 shadow disabled:opacity-50"
        >
          <Heart size={21} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <span
          className={`absolute bottom-2 left-3 rounded-full px-3 py-1 text-xs font-bold text-white ${p.stock > 0 ? 'bg-green-500' : 'bg-slate-500'}`}
        >
          {p.stock > 0 ? 'Disponible' : 'Agotado'}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 text-cyan-950">
        <h3 className="font-bold">
          <Link href={`/productos/${p.id}`}>{p.name}</Link>
        </h3>
        <p className="line-clamp-2 min-h-10 text-sm text-cyan-800">
          {p.description || p.category || 'Descubre los detalles de este producto'}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <p className="text-xl font-black text-cyan-600">{p.price}</p>
          <span className="flex items-center gap-1 text-[11px] text-teal-700">
            <Truck size={14} />
            Entrega a domicilio
          </span>
        </div>
        {variants ? (
          <Link
            href={`/productos/${p.id}`}
            className="rounded-full bg-cyan-600 px-3 py-2.5 text-center text-sm font-bold text-white"
          >
            Elegir opciones
          </Link>
        ) : (
          <button
            disabled={p.stock < 1}
            onClick={() =>
              addItem({ id: p.id, name: p.name, price: p.price, image: p.image, alt: p.name })
            }
            className="flex items-center justify-center gap-3 rounded-full bg-cyan-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 disabled:bg-slate-200 disabled:text-slate-500"
          >
            <ShoppingCart size={18} />
            {p.stock > 0 ? 'Agregar al carrito' : 'Sin existencias'}
          </button>
        )}
        <Link
          href={`/productos/${p.id}`}
          className="rounded-full border border-cyan-500 py-2.5 text-center text-sm font-medium text-cyan-600 hover:bg-cyan-50"
        >
          Ver detalles
        </Link>
        {(message || error) && (
          <p role="status" className="text-xs text-rose-700">
            {error || message}
          </p>
        )}
      </div>
    </article>
  );
}
