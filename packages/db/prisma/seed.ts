/**
 * Dev seed — creates 5 dummy artists with artworks for developing the Explore page.
 *
 * Reads credentials from:
 *   packages/db/.env          → DATABASE_URL, DIRECT_URL
 *   apps/web/.env.local       → NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Run: bun run db:seed  (from packages/db, or repo root via turbo)
 * Re-running is safe — all operations are idempotent.
 * Seed accounts password is read from SEED_PASSWORD env var (set in packages/db/.env).
 */

import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient, VerificationStatus } from '@prisma/client'
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

const SEED_PASSWORD = process.env['SEED_PASSWORD']
if (!SEED_PASSWORD) throw new Error('SEED_PASSWORD env var is required')

const ARTISTS = [
  {
    email: 'maja.kowalska@example.com',
    name: 'Maja Kowalska',
    bio: 'Malarka eksplorująca pamięć i tożsamość poprzez abstrakcyjne formy. Absolwentka Akademii Sztuk Pięknych w Warszawie.',
    artworks: [
      { title: 'Fragmenty I', medium: 'Olej na płótnie', dimensions: '80 × 100 cm', year: 2023, description: 'Medytacja nad fragmentaryczną naturą wspomnień.', picsum: 'maja-1' },
      { title: 'Bez tytułu #3', medium: 'Akryl na płótnie', dimensions: '60 × 80 cm', year: 2022, description: null, picsum: 'maja-2' },
      { title: 'Pejzaż wewnętrzny', medium: 'Technika mieszana', dimensions: '100 × 120 cm', year: 2024, description: 'Introspekcja przetłumaczona na język koloru i faktury.', picsum: 'maja-3' },
      { title: 'Erozja', medium: 'Olej na desce', dimensions: '40 × 50 cm', year: 2022, description: null, picsum: 'maja-4' },
    ],
  },
  {
    email: 'piotr.wisniewski@example.com',
    name: 'Piotr Wiśniewski',
    bio: 'Fotograf dokumentujący miejską tkankę Warszawy. Skupia się na geometrii i świetle w przestrzeni miejskiej.',
    artworks: [
      { title: 'Warszawa nocą', medium: 'Fotografia', dimensions: '50 × 70 cm', year: 2023, description: 'Seria nocnych ekspozycji centrum Warszawy.', picsum: 'piotr-1' },
      { title: 'Refleksje', medium: 'Fotografia', dimensions: '40 × 60 cm', year: 2022, description: null, picsum: 'piotr-2' },
      { title: 'Geometria miasta', medium: 'Fotografia', dimensions: '60 × 60 cm', year: 2024, description: 'Abstrakcyjna geometria architektury miejskiej.', picsum: 'piotr-3' },
    ],
  },
  {
    email: 'zofia.jablonska@example.com',
    name: 'Zofia Jabłońska',
    bio: 'Akwarelistka zafascynowana polskim krajobrazem i naturą. Jej prace łączą tradycję z nowoczesną wrażliwością.',
    artworks: [
      { title: 'Kwiaty polne', medium: 'Akwarela', dimensions: '30 × 40 cm', year: 2023, description: 'Delikatna interpretacja polskiej flory.', picsum: 'zofia-1' },
      { title: 'Letni deszcz', medium: 'Akwarela', dimensions: '40 × 50 cm', year: 2023, description: null, picsum: 'zofia-2' },
      { title: 'Pejzaż mazowiecki', medium: 'Akwarela', dimensions: '50 × 70 cm', year: 2022, description: 'Rozległe mazowieckie pola w wieczornym świetle.', picsum: 'zofia-3' },
    ],
  },
  {
    email: 'aleksander.nowak@example.com',
    name: 'Aleksander Nowak',
    bio: 'Artysta cyfrowy badający granicę między technologią a sztuką. Jego prace komentują życie w erze cyfrowej.',
    artworks: [
      { title: 'Interfejs #7', medium: 'Druk cyfrowy', dimensions: '70 × 70 cm', year: 2024, description: 'Z serii badającej estetykę interfejsów użytkownika.', picsum: 'aleksander-1' },
      { title: 'Data Stream', medium: 'Druk cyfrowy', dimensions: '50 × 100 cm', year: 2023, description: null, picsum: 'aleksander-2' },
      { title: 'Pikselowe marzenia', medium: 'Druk cyfrowy', dimensions: '60 × 80 cm', year: 2024, description: 'Oniryczna podróż przez cyfrowy krajobraz.', picsum: 'aleksander-3' },
    ],
  },
  {
    email: 'karolina.dabrowska@example.com',
    name: 'Karolina Dąbrowska',
    bio: 'Ceramiczka i rzeźbiarka tworząca organiczne formy inspirowane naturą i ludzkim ciałem.',
    artworks: [
      { title: 'Forma organiczna I', medium: 'Ceramika', dimensions: '25 × 30 × 20 cm', year: 2023, description: 'Rzeźba ceramiczna inspirowana formami roślinnymi.', picsum: 'karolina-1' },
      { title: 'Dialog', medium: 'Ceramika, drewno', dimensions: '40 × 15 × 15 cm', year: 2022, description: null, picsum: 'karolina-2' },
      { title: 'Przestrzeń I', medium: 'Ceramika', dimensions: '30 × 30 × 25 cm', year: 2024, description: 'Eksploracja pustki i wypełnienia w formie ceramicznej.', picsum: 'karolina-3' },
    ],
  },
]

async function getOrCreateAuthUser(email: string, name: string): Promise<string> {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  })

  if (!error) return created.user.id

  // Already exists — find by email
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const existing = users.find((u) => u.email === email)
  if (!existing) throw new Error(`Could not create or find user ${email}: ${error.message}`)
  return existing.id
}

async function fetchImage(picsumSeed: string): Promise<Buffer> {
  const res = await fetch(`https://picsum.photos/seed/${picsumSeed}/800/1000`)
  if (!res.ok) throw new Error(`Failed to fetch image for seed "${picsumSeed}": ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  console.log('Seeding explore data...\n')

  for (const artistData of ARTISTS) {
    process.stdout.write(`  ${artistData.name}... `)

    const userId = await getOrCreateAuthUser(artistData.email, artistData.name)

    await db.user.upsert({
      where: { id: userId },
      create: { id: userId, email: artistData.email, name: artistData.name },
      update: {},
    })

    const artist = await db.artist.upsert({
      where: { userId },
      create: { userId, bio: artistData.bio, verificationStatus: VerificationStatus.VERIFIED },
      update: {},
    })

    const existingCount = await db.artwork.count({ where: { artistId: artist.id } })
    if (existingCount > 0) {
      console.log(`skipped (${existingCount} artworks already exist)`)
      continue
    }

    for (const aw of artistData.artworks) {
      const storagePath = `seed/${userId}/${aw.picsum}.jpg`

      const image = await fetchImage(aw.picsum)
      await supabase.storage.from('artworks').upload(storagePath, image, {
        contentType: 'image/jpeg',
        upsert: true,
      })

      await db.artwork.create({
        data: {
          artistId: artist.id,
          title: aw.title,
          medium: aw.medium,
          dimensions: aw.dimensions,
          year: aw.year,
          description: aw.description,
          photos: {
            create: { storagePath, order: 0, isPrimary: true },
          },
        },
      })
    }

    console.log(`✓  (${artistData.artworks.length} artworks)`)
  }

  console.log('\nDone.')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
