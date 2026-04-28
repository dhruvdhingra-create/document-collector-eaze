/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pg', 'bcryptjs', 'better-sqlite3'],
    instrumentationHook: true,
  },
}

export default nextConfig
