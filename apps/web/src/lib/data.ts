import { cache } from 'react'
import { createClient } from '@/src/lib/supabase/server'
import { db } from '@artmarket/db'

// Cached per request — multiple components calling these get one DB/network hit.

export const getSessionUser = cache(async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
})

export const getArtist = cache(async (userId: string) => {
  return db.artist.findUnique({ where: { userId }, select: { id: true } })
})

export const getArtworkById = cache(async (id: string) => {
  return db.artwork.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      medium: true,
      dimensions: true,
      year: true,
      description: true,
      artist: {
        select: {
          userId: true,
          bio: true,
          user: { select: { name: true } },
        },
      },
      photos: {
        orderBy: { order: 'asc' },
        select: { storagePath: true, isPrimary: true },
      },
      listings: {
        where: { status: 'ACTIVE' },
        take: 1,
        select: { id: true },
      },
    },
  })
})

export const getAllArtworks = cache(async () => {
  return db.artwork.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      medium: true,
      year: true,
      artist: {
        select: { user: { select: { name: true } } },
      },
      photos: {
        where: { isPrimary: true },
        take: 1,
        select: { storagePath: true },
      },
    },
  })
})

export const getArtistWithArtworks = cache(async (userId: string) => {
  return db.artist.findUnique({
    where: { userId },
    select: {
      id: true,
      artworks: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          year: true,
          photos: {
            where: { isPrimary: true },
            take: 1,
            select: { storagePath: true },
          },
        },
      },
    },
  })
})
