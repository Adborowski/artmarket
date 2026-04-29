/**
 * Seeds two buyer accounts, open auctions for existing artworks, and sample bids.
 * Run: bun prisma/seed-demo-activity.ts  (from packages/db)
 * Re-running is safe — skips accounts/listings/bids that already exist.
 */

import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient, ListingStatus } from '../generated/client'
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

const BUYERS = [
  { email: 'buyer1@test.com', name: 'Anna Kowalska', password: 'test123' },
  { email: 'buyer2@test.com', name: 'Jan Nowak',     password: 'test123' },
]

async function getOrCreateAuthUser(email: string, name: string, password: string): Promise<string> {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })
  if (!error) return created.user.id

  const { data: { users } } = await supabase.auth.admin.listUsers()
  const existing = users.find((u) => u.email === email)
  if (!existing) throw new Error(`Could not create or find user ${email}: ${error.message}`)
  return existing.id
}

const daysAgo      = (n: number) => new Date(Date.now() - n * 86_400_000)
const daysFromNow  = (n: number) => new Date(Date.now() + n * 86_400_000)

async function main() {
  // ── Buyers ────────────────────────────────────────────────────────────────
  console.log('Creating buyer accounts...')
  const buyerIds: string[] = []
  for (const b of BUYERS) {
    const userId = await getOrCreateAuthUser(b.email, b.name, b.password)
    await db.user.upsert({
      where: { id: userId },
      create: { id: userId, email: b.email, name: b.name },
      update: {},
    })
    buyerIds.push(userId)
    console.log(`  ✓ ${b.email}`)
  }
  const [buyer1, buyer2] = buyerIds as [string, string]

  // ── Artworks ──────────────────────────────────────────────────────────────
  const allArtworks = await db.artwork.findMany({ orderBy: { createdAt: 'asc' } })
  if (allArtworks.length === 0) {
    console.log('\nNo artworks found — run seed-real-artists.ts first.')
    return
  }

  // One artwork per artist, up to 5
  const seen = new Set<string>()
  const artworks = allArtworks.filter((a) => {
    if (seen.has(a.artistId)) return false
    seen.add(a.artistId)
    return true
  }).slice(0, 5)

  console.log(`\nFound ${allArtworks.length} artwork(s), using ${artworks.length} for auctions.`)

  // ── Auction configs ───────────────────────────────────────────────────────
  type AuctionCfg = { startPrice: number; endsInDays: number; startedDaysAgo: number }
  const cfgs: AuctionCfg[] = [
    { startPrice: 2800, endsInDays: 4, startedDaysAgo: 3 },
    { startPrice: 1800, endsInDays: 2, startedDaysAgo: 5 },
    { startPrice: 3500, endsInDays: 6, startedDaysAgo: 1 },
    { startPrice: 4200, endsInDays: 3, startedDaysAgo: 4 },
    { startPrice: 2200, endsInDays: 5, startedDaysAgo: 2 },
  ]

  // ── Bid sequences per auction (last bid wins) ─────────────────────────────
  const bidSequences: { buyerId: string; amount: number }[][] = [
    [
      { buyerId: buyer1, amount: 2800 },
      { buyerId: buyer2, amount: 3200 },
      { buyerId: buyer1, amount: 3700 },
      { buyerId: buyer2, amount: 4100 },
    ],
    [
      { buyerId: buyer2, amount: 1800 },
      { buyerId: buyer1, amount: 2100 },
      { buyerId: buyer2, amount: 2500 },
    ],
    [
      { buyerId: buyer1, amount: 3500 },
      { buyerId: buyer2, amount: 3900 },
    ],
    [
      { buyerId: buyer2, amount: 4200 },
      { buyerId: buyer1, amount: 4800 },
    ],
    [
      { buyerId: buyer2, amount: 2200 },
    ],
  ]

  // ── Create listings & bids ────────────────────────────────────────────────
  console.log('\nCreating auctions and bids...')
  for (let i = 0; i < artworks.length; i++) {
    const artwork = artworks[i]!
    const cfg     = cfgs[i]!
    const bids    = bidSequences[i] ?? []

    // Skip if active listing already exists for this artwork
    let listing = await db.auctionListing.findFirst({
      where: { artworkId: artwork.id, status: ListingStatus.ACTIVE },
    })

    if (listing) {
      console.log(`  skipped "${artwork.title}" (active listing already exists)`)
    } else {
      listing = await db.auctionListing.create({
        data: {
          artworkId: artwork.id,
          status:    ListingStatus.ACTIVE,
          startPrice: cfg.startPrice,
          startsAt:   daysAgo(cfg.startedDaysAgo),
          endsAt:     daysFromNow(cfg.endsInDays),
        },
      })
      console.log(`  ✓ "${artwork.title}" — starts at ${cfg.startPrice} PLN, ends in ${cfg.endsInDays}d`)
    }

    // Skip bids if any already exist for this listing
    const existingBids = await db.bid.count({ where: { listingId: listing.id } })
    if (existingBids > 0) {
      console.log(`      bids skipped (${existingBids} already exist)`)
      continue
    }

    for (let j = 0; j < bids.length; j++) {
      const b      = bids[j]!
      const isLast = j === bids.length - 1
      await db.bid.create({
        data: {
          listingId: listing.id,
          bidderId:  b.buyerId,
          amount:    b.amount,
          isWinning: isLast,
        },
      })
    }

    const leading = bids.at(-1)
    if (leading) {
      console.log(`      ${bids.length} bid(s), leading at ${leading.amount} PLN`)
    }
  }

  console.log('\nDone.')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
