'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';

export default function FavoritesButton() {
  const { user } = useAuth();

  const { favorites } = useFavorites();

  const total = favorites.length;

  return (
    <Link
      href={user ? '/favoritos' : '/login'}
      className="relative w-11 h-11 rounded-full border border-gray-200 bg-white hover:bg-gray-100 transition-all duration-300 flex items-center justify-center group"
      aria-label="Favoritos"
    >
      <Heart
        className={`w-5 h-5 transition-all duration-300 ${
          total > 0 ? 'fill-red-500 text-red-500' : 'text-gray-700'
        } group-hover:scale-110`}
      />

      {total > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {total}
        </span>
      )}
    </Link>
  );
}
