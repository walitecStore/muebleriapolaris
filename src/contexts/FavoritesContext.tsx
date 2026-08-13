'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FavoriteProductInfo {
  id: string;
  name: string;
}

interface FavoritesContextType {
  favorites: string[];
  loading: boolean;
  error: string | null;

  toggleFavorite: (
    catalogId: string,
    productName?: string,
  ) => Promise<boolean>;

  isFavorite: (
    catalogId: string,
    productName?: string,
  ) => boolean;

  refreshFavorites: () => Promise<void>;
}

const FavoritesContext =
  createContext<FavoritesContextType>({
    favorites: [],
    loading: false,
    error: null,

    toggleFavorite: async () => false,

    isFavorite: () => false,

    refreshFavorites: async () => {},
  });

function isUuid(
  value: string,
): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeName(
  value: string,
): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [favorites, setFavorites] =
    useState<string[]>([]);

  const [favoriteProducts, setFavoriteProducts] =
    useState<FavoriteProductInfo[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | CARGAR FAVORITOS DESDE SUPABASE
  |--------------------------------------------------------------------------
  */

  const refreshFavorites =
    useCallback(async () => {
      if (!user) {
        setFavorites([]);
        setFavoriteProducts([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const supabase =
          createClient();

        const {
          data,
          error: favoritesError,
        } = await supabase
          .from('favorites')
          .select('product_id')
          .eq(
            'user_id',
            user.id,
          );

        if (favoritesError) {
          throw favoritesError;
        }

        const ids =
          (data ?? [])
            .map((row) =>
              String(
                row.product_id,
              ),
            )
            .filter(Boolean);

        const uniqueIds =
          Array.from(
            new Set(ids),
          );

        setFavorites(
          uniqueIds,
        );

        if (
          uniqueIds.length ===
          0
        ) {
          setFavoriteProducts(
            [],
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | OBTENER NOMBRES DE PRODUCTOS
        |--------------------------------------------------------------------------
        */

        const {
          data: productsData,
          error: productsError,
        } = await supabase
          .from('products')
          .select(
            'id, name',
          )
          .in(
            'id',
            uniqueIds,
          );

        if (productsError) {
          console.error(
            'Error obteniendo productos favoritos:',
            productsError,
          );

          /*
           * Los UUID siguen funcionando aunque
           * falle la consulta de nombres.
           */

          setFavoriteProducts(
            [],
          );
        } else {
          setFavoriteProducts(
            (productsData ?? []).map(
              (product) => ({
                id: String(
                  product.id,
                ),
                name: String(
                  product.name ??
                    '',
                ),
              }),
            ),
          );
        }

        console.log(
          '❤️ Favoritos cargados:',
          uniqueIds,
        );
      } catch (err: any) {
        console.error(
          'ERROR CARGANDO FAVORITOS:',
          err,
        );

        setFavorites([]);
        setFavoriteProducts([]);

        setError(
          err?.message ||
            'No se pudieron cargar los favoritos.',
        );
      } finally {
        setLoading(false);
      }
    }, [user]);

  /*
  |--------------------------------------------------------------------------
  | CARGAR AL INICIAR SESIÓN
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    refreshFavorites();
  }, [
    refreshFavorites,
  ]);

  /*
  |--------------------------------------------------------------------------
  | RESOLVER UUID REAL DEL PRODUCTO
  |--------------------------------------------------------------------------
  */

  const resolveProductUuid =
    useCallback(
      async (
        catalogId: string,
        productName?: string,
      ): Promise<string | null> => {
        const supabase =
          createClient();

        /*
        |--------------------------------------------------------------------------
        | SI YA ES UUID
        |--------------------------------------------------------------------------
        */

        if (
          isUuid(
            catalogId,
          )
        ) {
          const {
            data,
            error,
          } = await supabase
            .from('products')
            .select('id')
            .eq(
              'id',
              catalogId,
            )
            .maybeSingle();

          if (error) {
            console.error(
              'Error buscando UUID:',
              error,
            );

            return null;
          }

          return data?.id
            ? String(
                data.id,
              )
            : null;
        }

        /*
        |--------------------------------------------------------------------------
        | CATÁLOGO NUMÉRICO
        |--------------------------------------------------------------------------
        |
        | Buscamos por nombre.
        |
        */

        const cleanName =
          String(
            productName ?? '',
          ).trim();

        if (!cleanName) {
          console.error(
            'No se puede resolver producto:',
            {
              catalogId,
              productName,
            },
          );

          return null;
        }

        const {
          data,
          error,
        } = await supabase
          .from('products')
          .select(
            'id, name',
          )
          .ilike(
            'name',
            cleanName,
          )
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error(
            'Error buscando producto por nombre:',
            error,
          );

          return null;
        }

        if (!data?.id) {
          console.error(
            'Producto no encontrado:',
            {
              catalogId,
              productName:
                cleanName,
            },
          );

          return null;
        }

        return String(
          data.id,
        );
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | AGREGAR / QUITAR FAVORITO
  |--------------------------------------------------------------------------
  */

  const toggleFavorite =
    useCallback(
      async (
        catalogId: string,
        productName?: string,
      ): Promise<boolean> => {
        if (!user) {
          setError(
            'Debes iniciar sesión para guardar favoritos.',
          );

          return false;
        }

        if (!catalogId) {
          setError(
            'El producto no tiene un identificador válido.',
          );

          return false;
        }

        setLoading(true);
        setError(null);

        try {
          const productUuid =
            await resolveProductUuid(
              catalogId,
              productName,
            );

          if (!productUuid) {
            throw new Error(
              `No se encontró el producto "${
                productName ??
                catalogId
              }" en Supabase.`,
            );
          }

          const supabase =
            createClient();

          const alreadyFavorite =
            favorites.includes(
              productUuid,
            );

          /*
          |--------------------------------------------------------------------------
          | QUITAR
          |--------------------------------------------------------------------------
          */

          if (
            alreadyFavorite
          ) {
            const {
              error: deleteError,
            } = await supabase
              .from(
                'favorites',
              )
              .delete()
              .eq(
                'user_id',
                user.id,
              )
              .eq(
                'product_id',
                productUuid,
              );

            if (deleteError) {
              throw deleteError;
            }

            setFavorites(
              (previous) =>
                previous.filter(
                  (id) =>
                    id !==
                    productUuid,
                ),
            );

            setFavoriteProducts(
              (previous) =>
                previous.filter(
                  (product) =>
                    product.id !==
                    productUuid,
                ),
            );

            console.log(
              '💔 Favorito eliminado:',
              productUuid,
            );

            return true;
          }

          /*
          |--------------------------------------------------------------------------
          | AGREGAR
          |--------------------------------------------------------------------------
          */

          const {
            error: insertError,
          } = await supabase
            .from(
              'favorites',
            )
            .insert({
              user_id:
                user.id,

              product_id:
                productUuid,
            });

          /*
          |--------------------------------------------------------------------------
          | SI YA EXISTÍA
          |--------------------------------------------------------------------------
          */

          if (insertError) {
            if (
              insertError.code ===
              '23505'
            ) {
              await refreshFavorites();

              return true;
            }

            throw insertError;
          }

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZAR INMEDIATAMENTE
          |--------------------------------------------------------------------------
          */

          setFavorites(
            (previous) => {
              if (
                previous.includes(
                  productUuid,
                )
              ) {
                return previous;
              }

              return [
                ...previous,
                productUuid,
              ];
            },
          );

          setFavoriteProducts(
            (previous) => {
              const exists =
                previous.some(
                  (product) =>
                    product.id ===
                    productUuid,
                );

              if (exists) {
                return previous;
              }

              return [
                ...previous,
                {
                  id: productUuid,
                  name:
                    productName ??
                    '',
                },
              ];
            },
          );

          console.log(
            '❤️ Favorito guardado:',
            productUuid,
          );

          return true;
        } catch (err: any) {
          console.error(
            'ERROR CAMBIANDO FAVORITO:',
            err,
          );

          setError(
            err?.message ||
              'No se pudo actualizar el favorito.',
          );

          return false;
        } finally {
          setLoading(false);
        }
      },
      [
        user,
        favorites,
        resolveProductUuid,
        refreshFavorites,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | COMPROBAR SI ES FAVORITO
  |--------------------------------------------------------------------------
  */

  const isFavorite =
    useCallback(
      (
        catalogId: string,
        productName?: string,
      ): boolean => {
        /*
        |--------------------------------------------------------------------------
        | UUID
        |--------------------------------------------------------------------------
        */

        if (
          isUuid(
            catalogId,
          )
        ) {
          return favorites.includes(
            catalogId,
          );
        }

        /*
        |--------------------------------------------------------------------------
        | ID NUMÉRICO DEL CATÁLOGO
        |--------------------------------------------------------------------------
        */

        const normalizedName =
          normalizeName(
            productName ??
              '',
          );

        if (!normalizedName) {
          return false;
        }

        return favoriteProducts.some(
          (product) =>
            normalizeName(
              product.name,
            ) ===
            normalizedName,
        );
      },
      [
        favorites,
        favoriteProducts,
      ],
    );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        error,
        toggleFavorite,
        isFavorite,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(
    FavoritesContext,
  );
}