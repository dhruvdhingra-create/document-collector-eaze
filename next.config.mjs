/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pg', 'bcryptjs', 'better-sqlite3', '@aws-sdk/client-s3'],
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        'pg', 'pg-native', 'better-sqlite3', 'bcryptjs', '@aws-sdk/client-s3',
      ]
    }
    return config
  },
}

export default nextConfig
