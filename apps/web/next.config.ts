import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const config: NextConfig = {
  // Prisma monorepo fix: include the query engine binary in the traced output.
  // Next.js file tracing misses files outside apps/web in a monorepo.
  outputFileTracingIncludes: {
    '/**': ['../../packages/db/generated/client/*.node'],
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
