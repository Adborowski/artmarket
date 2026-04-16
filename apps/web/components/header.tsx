import { getTranslations } from 'next-intl/server'
import { Link } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/src/lib/auth/actions'
import { getSessionUser, getArtist, getUnreadNotificationCount } from '@/src/lib/data'
import { NavigationIndicator } from '@/components/navigation-indicator'
import { FeedbackModal } from '@/components/feedback-modal'
import { BellButton } from '@/components/bell-button'

export async function Header({ locale }: { locale: string }) {
  const user = await getSessionUser()

  const [t, tFeedback, artist, unreadCount] = await Promise.all([
    getTranslations('nav'),
    getTranslations('feedback'),
    user ? getArtist(user.id) : Promise.resolve(null),
    user ? getUnreadNotificationCount(user.id) : Promise.resolve(0),
  ])
  const isArtist = !!artist

  const signOutAction = signOut.bind(null, locale)

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-basteleur text-lg tracking-wide">
            Artmarket
          </Link>
          <NavigationIndicator />
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/artists">{t('artists')}</Link>
            </Button>
            {isArtist && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/artworks">{t('myArtworks')}</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/artworks/new">{t('sell')}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/orders">{t('orders')}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/profile">{t('profile')}</Link>
            </Button>
            <BellButton initialCount={unreadCount} />
            <FeedbackModal trigger={<Button variant="ghost" size="sm">{tFeedback('trigger')}</Button>} />
            <form action={signOutAction}>
              <Button variant="ghost" size="sm" type="submit">
                {t('signOut')}
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/artists">{t('artists')}</Link>
            </Button>
            <FeedbackModal trigger={<Button variant="ghost" size="sm">{tFeedback('trigger')}</Button>} />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/sign-in">{t('signIn')}</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
