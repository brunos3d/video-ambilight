import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The @videoglow packages ship built ESM/CJS with declarations; nothing to transpile.
  typedRoutes: true,
  // The static Storybook build lives in public/storybook (see tools/scripts/sync-storybook.mjs, which
  // also injects <base href="/storybook/"> so its relative asset URLs resolve). Serve its index here.
  async rewrites() {
    return [{ source: '/storybook', destination: '/storybook/index.html' }]
  },
}

export default nextConfig
