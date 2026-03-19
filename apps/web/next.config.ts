import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const config: NextConfig = {
  transpilePackages: ['@artmarket/api', '@artmarket/db', '@artmarket/i18n', '@artmarket/types'],
  images: {
    // Supabase Storage public URL — replace with your project ref
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/**' }],
  },
}

export default withNextIntl(config)
