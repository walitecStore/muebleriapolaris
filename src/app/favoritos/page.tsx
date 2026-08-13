'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';

import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/app/components/CartContext';

import { createClient } from '@/lib/supabase/client';

/* =========================================================
   TIPOS
========================================================= */

interface FavoriteProduct {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  price?: number | null;
  image_url?: string | null;
  images?: string[] | null;
  stock?: number | null;
  is_active?: boolean | null;
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function FavoritosPage() {
  const { user, loading: authLoading } = useAuth();

  const {
    favorites,
    toggleFavorite,
    loading: favoritesLoading,
  } = useFavorites();

  const { addItem } = useCart();

  const [products, setProducts] = useState<
    FavoriteProduct[]
  >([]);

  const [productsLoading, setProductsLoading] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [addedIds, setAddedIds] = useState<string[]>(
    [],
  );

  /* =======================================================
     CARGAR PRODUCTOS FAVORITOS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadFavoriteProducts() {
      if (!user) {
        if (!cancelled) {
          setProducts([]);
          setError(null);
          setProductsLoading(false);
        }

        return;
      }

      if (!favorites || favorites.length === 0) {
        if (!cancelled) {
          setProducts([]);
          setError(null);
          setProductsLoading(false);
        }

        return;
      }

      setProductsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        /*
         * Limpiar y eliminar IDs duplicados.
         */

        const favoriteIds = Array.from(
          new Set(
            favorites
              .map((id) => String(id).trim())
              .filter(Boolean),
          ),
        );

        if (favoriteIds.length === 0) {
          if (!cancelled) {
            setProducts([]);
          }

          return;
        }

        /*
         * Buscar directamente los productos
         * guardados en favorites.
         */

        const {
          data,
          error: productsError,
        } = await supabase
          .from('products')
          .select(
            `
              id,
              name,
              slug,
              description,
              price,
              image_url,
              images,
              stock,
              is_active
            `,
          )
          .in('id', favoriteIds);

        if (productsError) {
          console.error(
            'ERROR CONSULTANDO PRODUCTS:',
            productsError,
          );

          throw new Error(
            productsError.message ||
              'No se pudieron consultar los productos favoritos.',
          );
        }

        /*
         * Normalizar los datos de Supabase.
         */

        const normalizedProducts: FavoriteProduct[] =
          (data ?? []).map((product) => ({
            id: String(product.id),

            name: String(
              product.name ?? 'Producto',
            ),

            slug:
              product.slug !== null &&
              product.slug !== undefined
                ? String(product.slug)
                : null,

            description:
              product.description !== null &&
              product.description !== undefined
                ? String(product.description)
                : null,

            price:
              product.price !== null &&
              product.price !== undefined
                ? Number(product.price)
                : null,

            image_url:
              product.image_url !== null &&
              product.image_url !== undefined
                ? String(product.image_url)
                : null,

            images: Array.isArray(product.images)
              ? product.images.map(String)
              : null,

            stock:
              product.stock !== null &&
              product.stock !== undefined
                ? Number(product.stock)
                : null,

            is_active:
              product.is_active !== null &&
              product.is_active !== undefined
                ? Boolean(product.is_active)
                : null,
          }));

        /*
         * Mantener el orden de los favoritos.
         */

        const orderedProducts =
          favoriteIds
            .map((favoriteId) =>
              normalizedProducts.find(
                (product) =>
                  String(product.id) ===
                  String(favoriteId),
              ),
            )
            .filter(
              (
                product,
              ): product is FavoriteProduct =>
                product !== undefined,
            );

        if (!cancelled) {
          setProducts(orderedProducts);
        }

        console.log(
          '❤️ FAVORITOS:',
          favoriteIds,
        );

        console.log(
          '🛋️ PRODUCTOS FAVORITOS:',
          orderedProducts,
        );
      } catch (err: any) {
        console.error(
          'ERROR CARGANDO MIS FAVORITOS:',
          err,
        );

        if (!cancelled) {
          setProducts([]);

          setError(
            err?.message ||
              'Ocurrió un error al cargar tus favoritos.',
          );
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    }

    loadFavoriteProducts();

    return () => {
      cancelled = true;
    };
  }, [user, favorites]);

  /* =======================================================
     AGREGAR AL CARRITO
  ======================================================= */

  function handleAddToCart(
    product: FavoriteProduct,
  ) {
    const productId = String(product.id);

    const image =
      product.image_url ||
      product.images?.[0] ||
      '';

    const price = Number(
      product.price ?? 0,
    );

    addItem({
      id: productId,

      name: product.name,

      price: Number.isFinite(price)
        ? price
        : 0,

      image,

      alt: `${product.name} — producto de Mueblería Polaris`,
    });

    setAddedIds((previous) => {
      if (previous.includes(productId)) {
        return previous;
      }

      return [...previous, productId];
    });

    window.setTimeout(() => {
      setAddedIds((previous) =>
        previous.filter(
          (id) => id !== productId,
        ),
      );
    }, 1500);
  }

  /* =======================================================
     QUITAR FAVORITO
  ======================================================= */

  async function handleRemoveFavorite(
    product: FavoriteProduct,
  ) {
    try {
      await toggleFavorite(
        String(product.id),
        product.name,
      );
    } catch (err) {
      console.error(
        'ERROR ELIMINANDO FAVORITO:',
        err,
      );
    }
  }

  /* =======================================================
     FORMATO DE PRECIO
  ======================================================= */

  function formatPrice(
    price: number | null | undefined,
  ) {
    const value = Number(price ?? 0);

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(
      Number.isFinite(value)
        ? value
        : 0,
    );
  }

  /* =======================================================
     LOADING AUTENTICACIÓN
  ======================================================= */

  if (authLoading) {
    return (
      <>
        <Header />

        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />

            <p className="text-muted-foreground font-medium">
              Cargando...
            </p>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  /* =======================================================
     USUARIO NO AUTENTICADO
  ======================================================= */

  if (!user) {
    return (
      <>
        <Header />

        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-10 text-center shadow-xl">

            <div className="text-6xl mb-4">
              ❤️
            </div>

            <h1 className="text-2xl font-extrabold text-foreground mb-2">
              Mis Favoritos
            </h1>

            <p className="text-muted-foreground mb-6">
              Inicia sesión para guardar y ver tus productos favoritos.
            </p>

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

  /* =======================================================
     ESTADO GENERAL
  ======================================================= */

  const loading =
    favoritesLoading ||
    productsLoading;

  /* =======================================================
     RENDER PRINCIPAL
  ======================================================= */

  return (
    <>
      <Header />

      <main className="min-h-screen pt-24 pb-20 bg-background">

        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* =================================================
              CABECERA
          ================================================= */}

          <div className="mb-10">

            {/* BOTÓN VOLVER */}

            <div className="mb-6">

              <Link
                href="/#catalogo"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary/30 bg-white text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all shadow-sm"
              >

                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>

                Volver al catálogo

              </Link>

            </div>

            {/* TÍTULO */}

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

              <div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
                  ❤️ Mis Favoritos
                </h1>

                <p className="text-muted-foreground">

                  {loading
                    ? 'Cargando tus productos favoritos...'
                    : products.length === 0
                      ? 'Aún no tienes productos favoritos.'
                      : `${products.length} producto${
                          products.length !== 1
                            ? 's'
                            : ''
                        } guardado${
                          products.length !== 1
                            ? 's'
                            : ''
                        }`}

                </p>

              </div>

              {!loading &&
                products.length > 0 && (
                  <div className="text-sm font-semibold text-primary">
                    ❤️ {products.length} favoritos
                  </div>
                )}

            </div>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

              <div className="font-bold">
                No pudimos cargar tus favoritos.
              </div>

              <p className="mt-1">
                {error}
              </p>

            </div>
          )}

          {/* =================================================
              CARGANDO
          ================================================= */}

          {loading ? (

            <div className="flex flex-col items-center justify-center py-24 gap-5">

              <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin" />

              <p className="text-muted-foreground font-medium">
                Cargando tus favoritos...
              </p>

            </div>

          ) : products.length === 0 ? (

            /* =================================================
               SIN FAVORITOS
            ================================================= */

            <div className="flex flex-col items-center justify-center py-24 gap-4">

              <div className="text-7xl">
                🛋️
              </div>

              <p className="text-xl font-bold text-foreground">
                No tienes favoritos aún
              </p>

              <p className="text-muted-foreground text-sm text-center max-w-md">
                Explora nuestro catálogo y presiona ❤️
                para guardar los sofás que más te gusten.
              </p>

              <Link
                href="/#catalogo"
                className="mt-4 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all"
              >
                Ver catálogo
              </Link>

            </div>

          ) : (

            /* =================================================
               PRODUCTOS
            ================================================= */

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              {products.map(
                (product) => {

                  const productId =
                    String(
                      product.id,
                    );

                  const image =
                    product.image_url ||
                    product.images?.[0] ||
                    '';

                  const isAdded =
                    addedIds.includes(
                      productId,
                    );

                  const outOfStock =
                    product.stock !== null &&
                    product.stock !== undefined &&
                    product.stock <= 0;

                  return (
                    <article
                      key={productId}
                      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
                    >

                      {/* =================================================
                         IMAGEN
                      ================================================= */}

                      <div className="relative h-52 overflow-hidden bg-muted">

                        <Link
                          href={`/productos/${productId}`}
                          className="block w-full h-full"
                        >

                          {image ? (
                            <AppImage
                              src={image}
                              alt={`${product.name} — sofá de Mueblería Polaris`}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">
                              🛋️
                            </div>
                          )}

                        </Link>

                        {/* BOTÓN FAVORITO */}

                        <button
                          type="button"
                          disabled={
                            favoritesLoading
                          }
                          onClick={() =>
                            handleRemoveFavorite(
                              product,
                            )
                          }
                          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                          aria-label={`Quitar ${product.name} de favoritos`}
                          title="Quitar de favoritos"
                        >

                          <svg
                            viewBox="0 0 24 24"
                            fill="#ef4444"
                            stroke="#ef4444"
                            strokeWidth={2}
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                          </svg>

                        </button>

                        {/* DISPONIBILIDAD */}

                        {outOfStock ? (
                          <div className="absolute bottom-3 left-3">

                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                              Agotado
                            </span>

                          </div>
                        ) : (
                          <div className="absolute bottom-3 left-3">

                            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                              Disponible
                            </span>

                          </div>
                        )}

                      </div>

                      {/* =================================================
                         INFORMACIÓN
                      ================================================= */}

                      <div className="p-4 flex flex-col flex-1">

                        <Link
                          href={`/productos/${productId}`}
                          className="hover:text-primary transition-colors"
                        >

                          <h2 className="font-bold text-foreground text-base leading-tight mb-2 line-clamp-2">
                            {product.name}
                          </h2>

                        </Link>

                        <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">
                          {product.description ||
                            'Producto disponible en Mueblería Polaris.'}
                        </p>

                        {/* PRECIO */}

                        <div className="flex items-end justify-between gap-3 mb-4">

                          <span className="text-xl font-extrabold text-primary">
                            {formatPrice(
                              product.price,
                            )}
                          </span>

                          {/* NUEVA ETIQUETA */}

                          <span className="text-xs text-secondary font-semibold bg-secondary/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                            🚚 Entrega a domicilio
                          </span>

                        </div>

                        {/* =================================================
                           AGREGAR AL CARRITO
                        ================================================= */}

                        <button
                          type="button"
                          disabled={outOfStock}
                          onClick={() =>
                            handleAddToCart(
                              product,
                            )
                          }
                          className={`flex items-center justify-center gap-2 w-full px-4 py-3 font-bold text-sm rounded-xl transition-all duration-200 ${
                            outOfStock
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : isAdded
                                ? 'bg-green-500 text-white'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
                          }`}
                        >

                          {outOfStock ? (
                            <>
                              Producto agotado
                            </>
                          ) : isAdded ? (
                            <>
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>

                              ¡Agregado al carrito!
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>

                              Agregar al carrito
                            </>
                          )}

                        </button>

                        {/* =================================================
                           VER DETALLES
                        ================================================= */}

                        <Link
                          href={`/productos/${productId}`}
                          className="mt-2 flex items-center justify-center w-full px-4 py-2.5 border border-primary text-primary font-semibold text-sm rounded-xl hover:bg-primary/10 transition-colors"
                        >
                          Ver detalles
                        </Link>

                      </div>

                    </article>
                  );
                },
              )}

            </div>

          )}

        </div>

      </main>

      <Footer />
    </>
  );
}