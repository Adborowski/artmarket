/**
 * One-shot cleanup: close all open auctions, then delete all artworks.
 * Run: bun prisma/cleanup.ts  (from packages/db)
 */

import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient, ListingStatus } from '../generated/client'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: join(__dirname, '../.env') })

const db = new PrismaClient({
  datasources: { db: { url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'] } },
})

async function main() {
  const closed = await db.auctionListing.updateMany({
    where: { status: { in: [ListingStatus.ACTIVE, ListingStatus.DRAFT] } },
    data: { status: ListingStatus.ENDED },
  })
  console.log(`Closed ${closed.count} auction(s).`)

  // Delete in dependency order — deepest children first
  const bids = await db.bid.deleteMany({})
  console.log(`Deleted ${bids.count} bid(s).`)

  const watchlist = await db.userWatchlist.deleteMany({})
  console.log(`Deleted ${watchlist.count} watchlist entry/entries.`)

  const disputeMessages = await db.disputeMessage.deleteMany({})
  console.log(`Deleted ${disputeMessages.count} dispute message(s).`)

  const disputes = await db.dispute.deleteMany({})
  console.log(`Deleted ${disputes.count} dispute(s).`)

  const shippingPhotos = await db.shippingPhoto.deleteMany({})
  console.log(`Deleted ${shippingPhotos.count} shipping photo(s).`)

  const payouts = await db.payout.deleteMany({})
  console.log(`Deleted ${payouts.count} payout(s).`)

  const escrow = await db.escrowPayment.deleteMany({})
  console.log(`Deleted ${escrow.count} escrow payment(s).`)

  const deleted = await db.artwork.deleteMany({})
  console.log(`Deleted ${deleted.count} artwork(s).`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
