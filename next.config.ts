import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // FreeBlackMarket product/vendor imagery
      { protocol: 'https', hostname: '**.freeblackmarket.com' },
      { protocol: 'https', hostname: 'freeblackmarket.com' },
      // Matrix media (Blackout avatars/banners)
      { protocol: 'https', hostname: 'matrix.theblackout.app' },
    ],
  },
}

export default nextConfig
