import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Polaris',
    short_name: 'Polaris',
    description: 'Compra, vende y descubre ofertas en Polaris',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0891b2',
    lang: 'es-PE',
    icons: [
      { src: '/icons/polaris-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/polaris-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Catálogo', url: '/catalogo' },
      { name: 'Mi tienda', url: '/vender' },
    ],
  };
}
