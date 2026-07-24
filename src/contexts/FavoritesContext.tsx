'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FavoritesContextType {
  favorites: string[];
  loading: boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  loading: false,
  toggleFavorite: async () => {},
  isFavorite: () => false,
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) { setFavorites([]); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user.id);
    setFavorites((data || []).map((f: { product_id: string }) => f.product_id));
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (productId: string) => {
    if (!user) return;
    const supabase = createClient();
    const isFav = favorites.includes(productId);
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
      setFavorites((prev) => prev.filter((id) => id !== productId));
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
      setFavorites((prev) => [...prev, productId]);
    }
  }, [user, favorites]);

  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, loading, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
