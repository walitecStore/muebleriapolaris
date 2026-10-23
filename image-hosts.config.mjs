/**
 * Image Hosts Configuration (add your image hosts here)
 */

export const imageHosts = [
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  },
  {
    protocol: 'https',
    hostname: 'images.pexels.com',
  },
  {
    protocol: 'https',
    hostname: 'images.pixabay.com',
  },
  {
    protocol: 'https',
    hostname: 'img.rocket.new',
  },
];

// Only this project's public product images, never arbitrary remote hosts.
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (url.protocol === 'https:')
    imageHosts.push({
      protocol: 'https',
      hostname: url.hostname,
      pathname: '/storage/v1/object/public/product-images/**',
    });
}
