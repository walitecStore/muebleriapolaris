import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  env: {
    NEXT_PUBLIC_APP_RELEASE: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local',
  },
  async redirects() {
    return process.env.VERCEL_ENV === 'production'
      ? [
          {
            source: '/:path*',
            has: [
              {
                type: 'host',
                value: 'muebleriapolaris-[a-z0-9]+-walitecstores-projects.vercel.app',
              },
            ],
            destination: 'https://muebleriapolaris.vercel.app/:path*',
            permanent: false,
          },
        ]
      : [];
  },
  distDir: process.env.DIST_DIR || '.next',

  images: {
    remotePatterns: imageHosts,
    minimumCacheTTL: 60,
    qualities: [75, 85, 100],
  },

  webpack(config, { dev }) {
    if (dev) {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: '@dhiwise/component-tagger/nextLoader',
          },
        ],
      });
    }

    return config;
  },
};
export default nextConfig;
