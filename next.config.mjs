/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['mssql', 'socks', '@azure/keyvault-secrets', '@azure/identity'],
  },
  // Force dynamic rendering for all pages
  output: 'standalone',
  trailingSlash: false,
  webpack: (config, { isServer }) => {
    // Ignore canvas module for client-side builds (used by pdfjs-dist)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      }
    }
    return config
  },
}

export default nextConfig
