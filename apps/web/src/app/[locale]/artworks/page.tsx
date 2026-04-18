import { Suspense } from 'react'
import { redirect } from '@/src/i18n/navigation'
import { getSessionUser } from '@/src/lib/data'
import { ArtworkList, ArtworkListSkeleton } from './artwork-list'

export default async function ArtworksPage({
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<ArtworkListSkeleton />}>
        <ArtworkList userId={user.id} />
      </Suspense>
    </main>
  )
}
