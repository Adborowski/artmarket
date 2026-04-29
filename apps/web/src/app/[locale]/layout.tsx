import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import localFont from 'next/font/local'
import { routing } from '@/src/i18n/routing'
import { TRPCProvider } from '@/src/lib/trpc/provider'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import '@/src/app/globals.css'

const roobert = localFont({
  src: [
    { path: '../../../../../packages/fonts/Roobert Latin Proportional/Roobert-TRIAL-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../../../../packages/fonts/Roobert Latin Proportional/Roobert-TRIAL-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../../../../packages/fonts/Roobert Latin Proportional/Roobert-TRIAL-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../../../../packages/fonts/Roobert Latin Proportional/Roobert-TRIAL-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-roobert',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ASP-DA',
  description: 'Auctions for original artwork by emerging artists.',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <html lang={locale} className={roobert.variable}>
      <body className={roobert.className}>
        <NextIntlClientProvider messages={messages}>
          <TRPCProvider>
            <Header locale={locale} />
            {children}
            <Footer />
          </TRPCProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
