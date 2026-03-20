import { getTranslations } from 'next-intl/server'
import { Link } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/src/lib/auth/actions'
import { getSessionUser, getArtist } from '@/src/lib/data'
import { NavigationIndicator } from '@/components/navigation-indicator'

export async function Header({ locale }: { locale: string }) {
  const user = await getSessionUser()

  const [t, artist] = await Promise.all([
    getTranslations('nav'),
    user ? getArtist(user.id) : Promise.resolve(null),
  ])
  const isArtist = !!artist

  const signOutAction = signOut.bind(null, locale)

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-semibold">
            Artmarket
          </Link>
          <NavigationIndicator />
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            {isArtist && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/artworks">{t('myArtworks')}</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/artworks/new">{t('sell')}</Link>
            </Button>
            <form action={signOutAction}>
              <Button variant="ghost" size="sm" type="submit">
                {t('signOut')}
              </Button>
            </form>
          </div>
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/sign-in">{t('signIn')}</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
