import React from 'react';
import { StoreProvider } from '@/contexts/StoreContext';
import type { Metadata, Viewport } from 'next';

import '../styles/tailwind.css';

import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';

import { CartProvider } from './components/CartContext';
import CartDrawer from './components/CartDrawer';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://muebleriapolaris.com'),

  title: 'Mueblería Polaris — Sofás de Calidad para tu Hogar',

  description:
    'Descubre nuestra colección exclusiva de sofás modernos, clásicos y de diseño. Consulta disponibilidad, entregas y condiciones de compra.',

  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <StoreProvider>
          <AuthProvider>
            <FavoritesProvider>
              <CartProvider>
                {children}
                <CartDrawer />
              </CartProvider>
            </FavoritesProvider>
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
