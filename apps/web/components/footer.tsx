import { getTranslations } from 'next-intl/server'
import { Link } from '@/src/i18n/navigation'
import { FeedbackModal } from '@/components/feedback-modal'
import { Button } from '@/components/ui/button'

export async function Footer() {
  const t = await getTranslations('feedback')

  return (
    <footer className="mt-20 border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} ASP-DA</p>
        <nav className="flex items-center gap-6">
          <Link href="/guide" className="transition-colors hover:text-foreground">
            Przewodnik bezpiecznej sprzedaży
          </Link>
          <FeedbackModal
            trigger={
              <Button variant="ghost" size="sm" className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground">
                {t('trigger')}
              </Button>
            }
          />
        </nav>
      </div>
    </footer>
  )
}
