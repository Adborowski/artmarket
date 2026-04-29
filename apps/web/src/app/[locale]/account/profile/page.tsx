import { getTranslations } from 'next-intl/server'
import { redirect, Link } from '@/src/i18n/navigation'
import { getSessionUser } from '@/src/lib/data'
import { db } from '@artmarket/db'
import { notFound } from 'next/navigation'
import { ProfileForm } from './profile-form'
import { SellerProfileForm } from './seller-profile-form'
import { CardSection } from './card-section'
import { AvatarUpload } from '@/components/avatar-upload'
import { CoverUpload } from '@/components/cover-upload'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const user = await getSessionUser()
  if (!user) {
    redirect({ href: '/auth/sign-in', locale })
    return null
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      avatarUrl: true,
      stripePaymentMethodId: true,
      artist: { select: { id: true, bio: true, coverUrl: true, ibanNumber: true } },
    },
  })
  if (!dbUser) notFound()

  const t = await getTranslations('account.profile')
  const tArtists = await getTranslations('artists')
  const tNav = await getTranslations('nav')

  return (
    <main className="mx-auto max-w-xl px-4 py-10 space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{dbUser.email}</p>
        </div>
        {dbUser.artist && (
          <Link
            href={`/artists/${dbUser.artist.id}` as Parameters<typeof Link>[0]['href']}
            className="text-sm font-medium underline underline-offset-2 text-muted-foreground hover:text-foreground"
          >
            {t('previewProfile')}
          </Link>
        )}
      </div>

      {/* Avatar */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{tArtists('changePhoto')}</h2>
        <AvatarUpload
          userId={user.id}
          name={dbUser.name}
          currentAvatarUrl={dbUser.avatarUrl}
          changePhotoLabel={tArtists('changePhoto')}
          uploadErrorLabel={tArtists('uploadError')}
        />
      </section>

      <hr />

      {/* Name */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('nameLabel')}</h2>
        <ProfileForm initialName={dbUser.name} />
      </section>

      <hr />

      {/* Payment */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{t('paymentTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('paymentDesc')}</p>
        </div>
        <CardSection hasCard={!!dbUser.stripePaymentMethodId} />
      </section>

      <hr />

      {/* Quick links */}
      <section className="flex gap-4">
        <Link
          href="/artworks"
          className="flex-1 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          {tNav('myArtworks')} →
        </Link>
        <Link
          href="/account/orders"
          className="flex-1 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          {tNav('orders')} →
        </Link>
      </section>

      <hr />

      {/* Seller profile */}
      <section className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{t('sellerProfileTitle')}</h2>
            {(() => {
              const filled = [dbUser.artist?.coverUrl, dbUser.artist?.bio, dbUser.artist?.ibanNumber].filter(Boolean).length
              const percent = Math.round((filled / 3) * 100)
              const color = percent === 100
                ? 'bg-green-100 text-green-700'
                : percent > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700'
              return (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
                  {t('sellerProfileComplete', { percent })}
                </span>
              )
            })()}
          </div>
          <p className="text-sm text-muted-foreground">{t('sellerProfileDesc')}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{tArtists('changeCover')}</p>
          <CoverUpload
            userId={user.id}
            currentCoverUrl={dbUser.artist?.coverUrl ?? null}
            changeCoverLabel={tArtists('changeCover')}
            uploadErrorLabel={tArtists('uploadError')}
            variant="settings"
          />
        </div>

        <SellerProfileForm
          initialBio={dbUser.artist?.bio ?? null}
          initialIban={dbUser.artist?.ibanNumber ?? null}
        />
      </section>
    </main>
  )
}
