'use client'

import { useLocale } from 'next-intl'
import { usePathname, Link } from '@/src/i18n/navigation'

export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link
        href={pathname}
        locale="pl"
        className={locale === 'pl' ? 'font-semibold text-foreground' : 'hover:text-foreground transition-colors'}
      >
        PL
      </Link>
      <span>/</span>
      <Link
        href={pathname}
        locale="en"
        className={locale === 'en' ? 'font-semibold text-foreground' : 'hover:text-foreground transition-colors'}
      >
        EN
      </Link>
    </div>
  )
}
