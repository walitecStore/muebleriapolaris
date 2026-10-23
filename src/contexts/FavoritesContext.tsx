'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
const key = 'polaris_favorites';
type Context = {
  favorites: string[];
  loading: boolean;
  error: string | null;
  toggleFavorite: (id: string, name?: string) => Promise<boolean>;
  isFavorite: (id: string, name?: string) => boolean;
  refreshFavorites: () => Promise<void>;
};
const FavoritesContext = createContext<Context>({
  favorites: [],
  loading: false,
  error: null,
  toggleFavorite: async () => false,
  isFavorite: () => false,
  refreshFavorites: async () => {},
});
const valid = (s: unknown): s is string =>
  typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(s);
function local(): string[] {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data.filter(valid).slice(0, 200) : [];
  } catch {
    return [];
  }
}
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const refreshFavorites = useCallback(async () => {
    if (!user) {
      setFavorites(local());
      return;
    }
    setLoading(true);
    setError(null);
    const db = createClient();
    try {
      const guest = local();
      if (guest.length) {
        const { error: e } = await db.from('favorites').upsert(
          guest.map((product_id) => ({ user_id: user.id, product_id })),
          { onConflict: 'user_id,product_id', ignoreDuplicates: true }
        );
        if (e) throw e;
        localStorage.removeItem(key);
      }
      const { data, error: e } = await db
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);
      if (e) throw e;
      setFavorites((data || []).map((r) => r.product_id));
    } catch {
      setError('No se pudieron sincronizar tus favoritos. Reintenta.');
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);
  async function toggleFavorite(id: string) {
    if (!valid(id) || busy.current) return false;
    busy.current = true;
    setLoading(true);
    setError(null);
    const exists = favorites.includes(id);
    const next = exists ? favorites.filter((x) => x !== id) : [...favorites, id].slice(-200);
    try {
      if (user) {
        const db = createClient();
        const { error: e } = exists
          ? await db.from('favorites').delete().eq('user_id', user.id).eq('product_id', id)
          : await db
              .from('favorites')
              .upsert(
                { user_id: user.id, product_id: id },
                { onConflict: 'user_id,product_id', ignoreDuplicates: true }
              );
        if (e) throw e;
      } else localStorage.setItem(key, JSON.stringify(next));
      setFavorites(next);
      return true;
    } catch {
      setError('No se pudo guardar el favorito.');
      return false;
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        error,
        toggleFavorite,
        isFavorite: (id) => favorites.includes(id),
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
export const useFavorites = () => useContext(FavoritesContext);
