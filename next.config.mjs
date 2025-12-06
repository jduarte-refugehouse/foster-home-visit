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
      // Also add to externals to prevent webpack from trying to bundle it
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('canvas')
      } else if (typeof config.externals === 'object') {
        config.externals.canvas = false
      }
    }
    return config
  },
}

export default nextConfig
