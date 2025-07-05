import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/van-hire',
        destination: '/airport-transfer-siargao',
        permanent: true, // 301 redirect for SEO
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Add Supabase storage domain if available
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL ? [{
        protocol: 'https' as const,
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', ''),
      }] : []),
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Exclude Supabase Edge Functions from the Next.js build
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'supabase/functions': 'supabase/functions' }];
    return config;
  },
  // Ignore TypeScript errors in Supabase functions
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
