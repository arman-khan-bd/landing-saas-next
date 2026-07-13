import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/dj7pg5slk/image/upload/',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Required for @cloudflare/next-on-pages compatibility
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
};

export default nextConfig;
