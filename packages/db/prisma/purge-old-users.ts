/**
 * Purges all users except the admin and the 4 demo artists.
 * Also removes their Supabase Auth accounts.
 * Run: bun prisma/purge-old-users.ts  (from packages/db)
 */

import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '../generated/client'
import { createClient } from '@supabase/supabase-js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: join(__dirname, '../.env') })
config({ path: join(__dirname, '../../../apps/web/.env.local') })

const db = new PrismaClient({
  datasources: { db: { url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'] } },
})

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const KEEP_EMAILS = new Set([
  'adborowski@gmail.com',
  'pol.taburet@demo.aspda.pl',
  'george.rouy@demo.aspda.pl',
  'karolina.zadlo@demo.aspda.pl',
  'lukasz.stoklosa@demo.aspda.pl',
])

async function main() {
  const toDelete = await db.user.findMany({
    where: { email: { notIn: [...KEEP_EMAILS] } },
    select: { id: true, email: true, artist: { select: { id: true } } },
  })

  if (toDelete.length === 0) {
    console.log('Nothing to delete.')
    return
  }

  console.log(`Deleting ${toDelete.length} user(s):`)
  for (const u of toDelete) console.log(`  - ${u.email}`)
  console.log()

  const userIds = toDelete.map((u) => u.id)
  const artistIds = toDelete.flatMap((u) => (u.artist ? [u.artist.id] : []))

  // Delete in dependency order
  const bids = await db.bid.deleteMany({ where: { bidderId: { in: userIds } } })
  console.log(`Deleted ${bids.count} bid(s).`)

  const interests = await db.artworkInterest.deleteMany({ where: { userId: { in: userIds } } })
  console.log(`Deleted ${interests.count} artwork interest(s).`)

  const watchlist = await db.userWatchlist.deleteMany({ where: { userId: { in: userIds } } })
  console.log(`Deleted ${watchlist.count} watchlist entry/entries.`)

  const notifications = await db.notification.deleteMany({ where: { userId: { in: userIds } } })
  console.log(`Deleted ${notifications.count} notification(s).`)

  const disputeMessages = await db.disputeMessage.deleteMany({ where: { senderId: { in: userIds } } })
  console.log(`Deleted ${disputeMessages.count} dispute message(s).`)

  const disputes = await db.dispute.deleteMany({ where: { openedById: { in: userIds } } })
  console.log(`Deleted ${disputes.count} dispute(s).`)

  const payouts = await db.payout.deleteMany({ where: { artistId: { in: artistIds } } })
  console.log(`Deleted ${payouts.count} payout(s).`)

  const artworks = await db.artwork.deleteMany({ where: { artistId: { in: artistIds } } })
  console.log(`Deleted ${artworks.count} artwork(s).`)

  const artists = await db.artist.deleteMany({ where: { userId: { in: userIds } } })
  console.log(`Deleted ${artists.count} artist profile(s).`)

  const users = await db.user.deleteMany({ where: { id: { in: userIds } } })
  console.log(`Deleted ${users.count} user record(s).`)

  // Delete Supabase Auth accounts
  let authDeleted = 0
  for (const u of toDelete) {
    const { error } = await supabase.auth.admin.deleteUser(u.id)
    if (error) console.warn(`  Auth delete failed for ${u.email}: ${error.message}`)
    else authDeleted++
  }
  console.log(`Deleted ${authDeleted} Supabase Auth account(s).`)

  console.log('\nDone.')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
