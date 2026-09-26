'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Search, X } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';

type SearchProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  image: string;
  availability: string;
};

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults([]);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/products?active=true&search=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        setResults(Array.isArray(data.products) ? data.products.slice(0, 6) : []);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] bg-slate-950/45 p-4 pt-24 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar productos"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Search className="h-5 w-5 text-cyan-600" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca sofas, mesas, camas y mas"
            className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-slate-400"
          />
          {loading && <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar buscador"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-3">
          {query.trim().length < 2 && (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              Escribe al menos dos letras para buscar en el catalogo.
            </p>
          )}
          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              No encontramos productos para “{query}”.
            </p>
          )}
          {results.map((product) => (
            <Link
              key={product.id}
              href="/catalogo"
              onClick={onClose}
              className="flex items-center gap-4 rounded-2xl p-3 transition hover:bg-slate-50"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <AppImage
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{product.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {product.category} · {product.availability}
                </p>
                <p className="mt-1 text-sm font-extrabold text-cyan-700">{product.price}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-500">
          <Link
            href="/catalogo"
            onClick={onClose}
            className="font-bold text-cyan-700 hover:underline"
          >
            Explorar el catalogo completo
          </Link>
        </div>
      </div>
    </div>
  );
}
