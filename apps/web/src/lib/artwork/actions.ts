'use server'

import { createClient } from '@supabase/supabase-js'
import { redirect } from '@/src/i18n/navigation'
import { getSessionUser } from '@/src/lib/data'
import { db } from '@artmarket/db'

export async function toggleInterest(artworkId: string): Promise<{ interested: boolean; count: number }> {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const existing = await db.artworkInterest.findUnique({
    where: { userId_artworkId: { userId: user.id, artworkId } },
  })

  if (existing) {
    await db.artworkInterest.delete({ where: { userId_artworkId: { userId: user.id, artworkId } } })
  } else {
    await db.artworkInterest.create({ data: { userId: user.id, artworkId } })
  }

  const count = await db.artworkInterest.count({ where: { artworkId } })
  return { interested: !existing, count }
}

export async function deleteArtwork(artworkId: string, locale: string) {
  const user = await getSessionUser()
  if (!user) redirect({ href: '/auth/sign-in', locale })

  const artwork = await db.artwork.findUnique({
    where: { id: artworkId },
    select: {
      artist: { select: { userId: true } },
      photos: { select: { storagePath: true } },
    },
  })

  if (!artwork || artwork.artist.userId !== user!.id) return

  // Delete storage files using service role key (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const paths = artwork.photos.map((p) => p.storagePath)
  if (paths.length > 0) {
    await supabase.storage.from('artworks').remove(paths)
  }

  await db.artworkPhoto.deleteMany({ where: { artworkId } })
  await db.artwork.delete({ where: { id: artworkId } })

  redirect({ href: '/artworks', locale })
}
