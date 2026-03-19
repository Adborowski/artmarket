import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { Inter } from 'next/font/google'
import { routing } from '@/src/i18n/routing'
import { TRPCProvider } from '@/src/lib/trpc/provider'
import { Header } from '@/components/header'
import '@/src/app/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Artmarket',
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
    <html lang={locale} className={inter.variable}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <TRPCProvider>
            <Header locale={locale} />
            {children}
          </TRPCProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
