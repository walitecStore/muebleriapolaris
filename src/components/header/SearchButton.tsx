'use client';

import { Search } from 'lucide-react';

interface SearchButtonProps {
  onClick?: () => void;
}

export default function SearchButton({ onClick }: SearchButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative w-11 h-11 rounded-full border border-gray-200 bg-white hover:bg-gray-100 transition-all duration-300 flex items-center justify-center group"
      aria-label="Buscar productos"
    >
      <Search className="w-5 h-5 text-gray-700 group-hover:scale-110 transition-transform" />
    </button>
  );
}
