import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const config: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) config.plugins = [...config.plugins, new PrismaPlugin()]
    return config
  },
  transpilePackages: ['@artmarket/api', '@artmarket/db', '@artmarket/i18n', '@artmarket/institutions', '@artmarket/types'],
  images: {
    // Supabase Storage public URL — replace with your project ref
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/**' },
      { protocol: 'https', hostname: 'randomuser.me', pathname: '/api/portraits/**' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
    ],
  },
}

export default withNextIntl(config)
