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
}

export default nextConfig
