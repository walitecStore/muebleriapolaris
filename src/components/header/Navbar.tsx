'use client';

import Link from "next/link";
import SearchButton from "./SearchButton";
import FavoritesButton from "./FavoritesButton";

export default function Navbar() {
  return (
    <nav className="w-full bg-white/90 backdrop-blur-md border-b border-gray-200">

      <div className="max-w-7xl mx-auto h-20 px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">

          <span className="text-3xl font-black tracking-tight">
            Polaris
          </span>

        </Link>

        {/* Menú Desktop */}

        <div className="hidden lg:flex items-center gap-8">

          <Link href="/">Inicio</Link>

          <Link href="/catalogo">Catálogo</Link>

          <Link href="/catalogo/sofas-europeos">
            Sofás Europeos
          </Link>

          <Link href="/catalogo/modulares">
            Modulares
          </Link>

          <Link href="/nosotros">
            Nosotros
          </Link>

          <Link href="/contacto">
            Contacto
          </Link>

        </div>

        {/* Acciones */}

        <div className="flex items-center gap-4">

          {/* Aquí irán */}

         <SearchButton />

          <FavoritesButton />

          {/* CartButton */}

          {/* UserMenu */}

          {/* WhatsAppButton */}

        </div>

      </div>

    </nav>
  );
}