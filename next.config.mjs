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
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('mssql', 'socks', '@azure/keyvault-secrets', '@azure/identity')
    }
    return config
  },
}

export default nextConfig
