/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mssql', 'socks', '@azure/keyvault-secrets', '@azure/identity'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'mssql': 'commonjs mssql',
        'socks': 'commonjs socks',
        '@azure/keyvault-secrets': 'commonjs @azure/keyvault-secrets',
        '@azure/identity': 'commonjs @azure/identity',
        'net': 'commonjs net',
        'tls': 'commonjs tls'
      });
    }
    return config;
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
