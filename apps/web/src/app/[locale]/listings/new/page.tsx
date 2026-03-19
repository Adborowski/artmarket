import { redirect } from '@/src/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { getSessionUser, getArtist } from '@/src/lib/data'
import { db } from '@artmarket/db'
import { ListingForm } from './listing-form'

export default async function NewListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ artworkId?: string }>
}) {
  const { locale } = await params
  const { artworkId } = await searchParams

  if (!artworkId) {
    redirect({ href: '/artworks', locale })
    return null
  }

  const user = await getSessionUser()
  if (!user) {
    redirect({ href: '/auth/sign-in', locale })
    return null
  }

  const [t, artist] = await Promise.all([
    getTranslations('listing.new'),
    getArtist(user.id),
  ])

  if (!artist) {
    redirect({ href: '/artist/register', locale })
    return null
  }

  const artwork = await db.artwork.findUnique({
    where: { id: artworkId, artistId: artist.id },
    select: {
      title: true,
      listings: { where: { status: 'ACTIVE' }, take: 1, select: { id: true } },
    },
  })

  if (!artwork) {
    redirect({ href: '/artworks', locale })
    return null
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">{t('title')}: {artwork.title}</h1>
      {artwork.listings.length > 0 ? (
        <p className="text-muted-foreground">This artwork already has an active auction.</p>
      ) : (
        <ListingForm artworkId={artworkId} />
      )}
    </main>
  )
}
