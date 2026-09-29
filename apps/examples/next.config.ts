import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The @videoglow packages ship built ESM/CJS with declarations; nothing to transpile.
  typedRoutes: true,
}

export default nextConfig
