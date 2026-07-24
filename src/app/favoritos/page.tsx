'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { sofaProducts } from '@/app/components/catalogData';
import { useCart } from '@/app/components/CartContext';

export default function FavoritosPage() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const favProducts = sofaProducts.filter((p) => favorites.includes(String(p.id)));

  function handleAddToCart(sofa: typeof sofaProducts[0]) {
    addItem({
      id: String(sofa.id),
      name: sofa.name,
      price: sofa.price,
      image: sofa.image,
      alt: `${sofa.name} — sofá ${sofa.style.toLowerCase()} en color ${sofa.color.toLowerCase()}`,
    });
    setAddedIds((prev) => [...prev, String(sofa.id)]);
    setTimeout(() => setAddedIds((prev) => prev.filter((id) => id !== String(sofa.id))), 1500);
  }

  if (authLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Cargando...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-10 text-center shadow-xl">
            <div className="text-6xl mb-4">❤️</div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">Mis Favoritos</h1>
            <p className="text-muted-foreground mb-6">Inicia sesión para guardar y ver tus productos favoritos.</p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 border border-border text-foreground font-semibold rounded-2xl hover:border-primary hover:text-primary transition-all mt-3"
            >
              Crear cuenta
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
              ❤️ Mis Favoritos
            </h1>
            <p className="text-muted-foreground">
              {favProducts.length === 0
                ? 'Aún no tienes productos favoritos.'
                : `${favProducts.length} producto${favProducts.length !== 1 ? 's' : ''} guardado${favProducts.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {favProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="text-7xl">🛋️</div>
              <p className="text-xl font-bold text-foreground">No tienes favoritos aún</p>
              <p className="text-muted-foreground text-sm">Explora el catálogo y presiona ❤️ para guardar productos</p>
              <Link
                href="/#catalogo"
                className="mt-4 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all"
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favProducts.map((sofa) => (
                <div key={sofa.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <Link href={`/productos/${sofa.id}`}>
                      <AppImage
                        src={sofa.image}
                        alt={`${sofa.name} — sofá ${sofa.style.toLowerCase()} color ${sofa.color.toLowerCase()}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </Link>
                    <button
                      onClick={() => toggleFavorite(String(sofa.id))}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                      aria-label="Quitar de favoritos"
                    >
                      <svg viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth={2} className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>
                    <div className="absolute top-3 left-3">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">{sofa.style}</span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <Link href={`/productos/${sofa.id}`} className="hover:text-primary transition-colors">
                      <h3 className="font-bold text-foreground text-base leading-tight mb-1">{sofa.name}</h3>
                    </Link>
                    <p className="text-muted-foreground text-sm mb-3 flex-1 line-clamp-2">{sofa.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-extrabold text-primary">{sofa.price}</span>
                      <span className="text-xs text-secondary font-semibold bg-secondary/10 px-2.5 py-1 rounded-full">Envío gratis</span>
                    </div>
                    <button
                      onClick={() => handleAddToCart(sofa)}
                      className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 font-bold text-sm rounded-xl transition-all duration-200 ${
                        addedIds.includes(String(sofa.id))
                          ? 'bg-green-500 text-white' :'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {addedIds.includes(String(sofa.id)) ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          ¡Agregado!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          Agregar al carrito
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
