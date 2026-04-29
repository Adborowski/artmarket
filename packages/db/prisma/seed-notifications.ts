/**
 * Backfills OUTBID notifications for existing bids on active auctions.
 * For each listing, replays the bid sequence in chronological order:
 *   - whoever held the leading bid gets an OUTBID notification when the next bid arrives.
 * Run: bun prisma/seed-notifications.ts  (from packages/db)
 * Re-running is safe — skips listings that already have notifications.
 */

import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient, NotificationType } from '../generated/client'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: join(__dirname, '../.env') })

const db = new PrismaClient({
  datasources: { db: { url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'] } },
})

async function main() {
  const listings = await db.auctionListing.findMany({
    where: { status: 'ACTIVE' },
    include: {
      artwork: { include: { artist: true } },
      bids: {
        orderBy: { createdAt: 'asc' },
        include: { bidder: true },
      },
    },
  })

  console.log(`Found ${listings.length} active listing(s).\n`)

  let totalCreated = 0

  for (const listing of listings) {
    if (listing.bids.length < 2) {
      console.log(`  "${listing.artwork.title}" — fewer than 2 bids, nothing to backfill`)
      continue
    }

    // Skip if notifications already exist for this listing's bidders
    const bidderIds = [...new Set(listing.bids.map((b) => b.bidderId))]
    const existing = await db.notification.count({
      where: {
        userId:   { in: bidderIds },
        type:     NotificationType.OUTBID,
        link:     `/listings/${listing.id}`,
      },
    })
    if (existing > 0) {
      console.log(`  "${listing.artwork.title}" — skipped (notifications already exist)`)
      continue
    }

    const link = `/listings/${listing.id}`
    const artworkTitle = listing.artwork.title
    let created = 0

    // NEW_BID for the artist on the first bid
    const firstBid = listing.bids[0]!
    const artistUserId = listing.artwork.artist?.userId
    if (artistUserId) {
      await db.notification.create({
        data: {
          userId:    artistUserId,
          type:      NotificationType.NEW_BID,
          title:     'Nowa oferta',
          body:      `Nowa oferta ${Number(firstBid.amount).toLocaleString('pl-PL')} PLN na „${artworkTitle}".`,
          link,
          read:      false,
          createdAt: firstBid.createdAt,
        },
      })
      created++
    }

    // Replay bids in order; the previous leader gets OUTBID when overtaken
    // Artist also gets NEW_BID for each subsequent bid
    for (let i = 1; i < listing.bids.length; i++) {
      const prev = listing.bids[i - 1]!
      const curr = listing.bids[i]!

      // NEW_BID for the artist
      if (artistUserId) {
        await db.notification.create({
          data: {
            userId:    artistUserId,
            type:      NotificationType.NEW_BID,
            title:     'Nowa oferta',
            body:      `Nowa oferta ${Number(curr.amount).toLocaleString('pl-PL')} PLN na „${artworkTitle}".`,
            link,
            read:      false,
            createdAt: curr.createdAt,
          },
        })
        created++
      }

      // OUTBID for the displaced leader (only if the bidder changed)
      if (prev.bidderId === curr.bidderId) continue

      await db.notification.create({
        data: {
          userId:    prev.bidderId,
          type:      NotificationType.OUTBID,
          title:     'Przebita oferta',
          body:      `Twoja oferta na „${artworkTitle}" została przebita. Złóż nową, aby wygrać.`,
          link,
          read:      false,
          createdAt: curr.createdAt,
        },
      })
      created++
    }

    totalCreated += created
    console.log(`  ✓ "${listing.artwork.title}" — ${created} OUTBID notification(s)`)
  }

  console.log(`\nCreated ${totalCreated} notification(s) in total.`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
