'use server'

import { db } from '@artmarket/db'
import { getSessionUser } from '@/src/lib/data'

export async function updateAvatarUrl(avatarUrl: string) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')
  await db.user.update({ where: { id: user.id }, data: { avatarUrl } })
}

export async function updateCoverUrl(coverUrl: string) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')
  await db.artist.upsert({
    where: { userId: user.id },
    create: { userId: user.id, coverUrl },
    update: { coverUrl },
  })
}
