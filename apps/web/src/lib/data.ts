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
          id: true,
          userId: true,
          bio: true,
          user: { select: { name: true, avatarUrl: true, email: true } },
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
      _count: { select: { interests: true } },
    },
  })
})

export const getArtworkInterestForUser = cache(async (artworkId: string, userId: string) => {
  const row = await db.artworkInterest.findUnique({
    where: { userId_artworkId: { userId, artworkId } },
    select: { artworkId: true },
  })
  return !!row
})

export const getActiveListings = cache(async () => {
  return db.auctionListing.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { endsAt: 'asc' }, // ending soonest first
    select: {
      id: true,
      startPrice: true,
      endsAt: true,
      bids: {
        orderBy: { amount: 'desc' },
        take: 1,
        select: { amount: true },
      },
      artwork: {
        select: {
          title: true,
          artist: { select: { user: { select: { name: true } } } },
          photos: {
            where: { isPrimary: true },
            take: 1,
            select: { storagePath: true },
          },
          _count: { select: { interests: true } },
        },
      },
    },
  })
})

export const getAllArtworks = cache(async () => {
  return db.artwork.findMany({
    where: { listings: { none: { status: 'ACTIVE' } } }, // exclude pieces in live auctions
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
      _count: { select: { interests: true } },
    },
  })
})

export const getArtists = cache(async () => {
  return db.artist.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      bio: true,
      user: { select: { name: true, avatarUrl: true, email: true } },
      _count: { select: { artworks: true } },
    },
  })
})

export const getArtistById = cache(async (id: string) => {
  return db.artist.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      bio: true,
      coverUrl: true,
      user: { select: { name: true, avatarUrl: true, email: true } },
      artworks: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          medium: true,
          year: true,
          photos: {
            where: { isPrimary: true },
            take: 1,
            select: { storagePath: true },
          },
          listings: {
            where: { status: 'ACTIVE' },
            take: 1,
            select: { id: true },
          },
          _count: { select: { interests: true } },
        },
      },
    },
  })
})

const orderSelect = {
  id: true,
  closedAt: true,
  artwork: {
    select: {
      title: true,
      photos: { where: { isPrimary: true }, take: 1, select: { storagePath: true } },
    },
  },
  winningBid: {
    select: {
      amount: true,
      bidder: { select: { name: true } },
    },
  },
  escrowPayment: {
    select: {
      id: true,
      status: true,
      dispute: { select: { id: true } },
    },
  },
} as const

export const getPurchases = cache(async (userId: string) => {
  return db.auctionListing.findMany({
    where: { status: 'ENDED', winningBid: { bidderId: userId } },
    orderBy: { closedAt: 'desc' },
    select: orderSelect,
  })
})

export const getSales = cache(async (userId: string) => {
  return db.auctionListing.findMany({
    where: { status: 'ENDED', artwork: { artist: { userId } } },
    orderBy: { closedAt: 'desc' },
    select: orderSelect,
  })
})

export const getUnreadNotificationCount = cache(async (userId: string) => {
  return db.notification.count({ where: { userId, read: false } })
})

export const getArtworkEscrowBlock = cache(async (artworkId: string) => {
  return db.auctionListing.findFirst({
    where: {
      artworkId,
      status: 'ENDED',
      escrowPayment: { status: { in: ['HELD', 'DISPUTED'] } },
    },
    select: { id: true },
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
          _count: { select: { interests: true } },
        },
      },
    },
  })
})
