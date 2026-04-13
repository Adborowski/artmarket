import { redirect, Link } from '@/src/i18n/navigation'
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
      <h1 className="mb-6 text-2xl font-bold">{t('title')}: {artwork.title}</h1>

      <Link
        href="/guide"
        className="mb-8 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 transition-colors hover:bg-primary/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-5 w-5 shrink-0 text-primary">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div>
          <p className="font-semibold text-primary">Przed wystawieniem przeczytaj nasz przewodnik</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Dowiedz się, jak bezpiecznie wysłać pracę, co zrobić w razie sporu i jak działa system depozytowy, który chroni Twoje wynagrodzenie.
          </p>
        </div>
      </Link>

      {artwork.listings.length > 0 ? (
        <p className="text-muted-foreground">This artwork already has an active auction.</p>
      ) : (
        <ListingForm artworkId={artworkId} />
      )}
    </main>
  )
}
