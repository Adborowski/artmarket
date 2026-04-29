/**
 * Seed real emerging artists (for internal demo / presentation).
 * Bios sourced from publicly available information. Artwork images are placeholders.
 *
 * Reads credentials from:
 *   packages/db/.env          → DATABASE_URL, DIRECT_URL, SEED_PASSWORD
 *   apps/web/.env.local       → NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Run: bun prisma/seed-real-artists.ts  (from packages/db)
 * Re-running is safe — skips artists whose artworks already exist.
 */

import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient, VerificationStatus } from '../generated/client'
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
    email: 'pol.taburet@demo.aspda.pl',
    name: 'Pol Taburet',
    avatarUrl: 'https://randomuser.me/api/portraits/men/12.jpg',
    coverUrl: 'https://picsum.photos/seed/taburet-cover/1400/400',
    bio: 'Born in Paris in 1997 to a Guadeloupean family, Pol Taburet graduated from the École Nationale Supérieure d\'Arts de Paris-Cergy. His figurative paintings fuse Afro-Caribbean spiritual traditions, European painting history, and the visual language of trap music and horror cinema. He builds each canvas through alternating layers — acrylic and alcohol-based paint for flat grounds, then airbrush for faces and bodies, achieving a misty, dreamlike dissolution of skin and form. Voodoo imagery, oral myths passed down by his grandmother, and the tension between the sacred and the profane shape every composition. Winner of the Reiffers Art Initiatives Prize (2022); work held in the Pinault Collection.',
    artworks: [
      {
        title: 'Vévé I',
        medium: 'Acrylic and airbrush on canvas',
        dimensions: '180 × 140 cm',
        year: 2023,
        description: 'A vévé — the ritual ground drawing used to summon Haitian lwa — rendered at monumental scale. The symbol bleeds into a silhouetted figure mid-transformation, surrounded by deep violet and burnt sienna.',
        slug: 'taburet-1',
        imageUrl: 'https://www.reiffersartinitiatives.com/layout/uploads/2021/07/Pol-Taburet-des-corps-libres-1.jpg',
      },
      {
        title: 'Possédé',
        medium: 'Oil, acrylic and airbrush on canvas',
        dimensions: '200 × 160 cm',
        year: 2024,
        description: 'A figure caught at the moment of possession — limbs dissolving at the edges into mist while the face remains hyper-focused, almost photographic. The background is a dense acid yellow that vibrates against the cooler skin tones.',
        slug: 'taburet-2',
        imageUrl: 'https://www.reiffersartinitiatives.com/layout/uploads/2022/03/Des-Corps-Libres-Expo-2.jpg',
      },
      {
        title: 'Offrande',
        medium: 'Acrylic and airbrush on canvas',
        dimensions: '120 × 90 cm',
        year: 2022,
        description: 'Two hands extending an offering of flowers and bones into an indeterminate dark space. A study in the intersection of generosity and fear that runs through Caribbean ritual culture.',
        slug: 'taburet-3',
        imageUrl: 'https://www.reiffersartinitiatives.com/layout/uploads/2022/03/Des-Corps-Libres-Expo-3.jpg',
      },
      {
        title: 'Sans nom pour les dieux',
        medium: 'Acrylic and airbrush on linen',
        dimensions: '150 × 120 cm',
        year: 2023,
        description: 'A nameless deity — or the refusal to name one. The canvas holds a face that is simultaneously every face and none, surrounded by floating object-symbols drawn from personal mythology.',
        slug: 'taburet-4',
        imageUrl: 'https://cdn.shopify.com/s/files/1/0980/9893/8181/files/image_compressed.jpg?v=1760695045',
      },
    ],
  },
  {
    email: 'george.rouy@demo.aspda.pl',
    name: 'George Rouy',
    avatarUrl: 'https://randomuser.me/api/portraits/men/28.jpg',
    coverUrl: 'https://picsum.photos/seed/rouy-cover/1400/400',
    bio: 'Born in Sittingbourne, Kent in 1994, George Rouy studied Fine Art at Camberwell College of Arts, graduating in 2015. He now works between London and Margate. Rouy\'s paintings place the human body in states of flux — limbs elongate, contours blur, and figures seem to be dissolving into or emerging from each other and their environments. Working in oil, acrylic, and ink on canvas, he layers translucent washes with denser, more physical marks to build a sense of bodies caught mid-transformation. References to Mannerism, Francis Bacon, and contemporary dance inform his practice. Represented by Hauser & Wirth since 2025.',
    artworks: [
      {
        title: 'Entanglement',
        medium: 'Oil and acrylic on canvas',
        dimensions: '200 × 180 cm',
        year: 2024,
        description: 'Two figures whose boundaries have become indistinguishable — it is unclear whether they are embracing, struggling, or simply the same body rendered twice. Cool grey-blues dominate, interrupted by passages of raw umber and flesh tone.',
        slug: 'rouy-1',
        imageUrl: 'https://hannahbarry.com/wp-content/uploads/2018/02/L-GR0353-Identikit-cropped-500x658.jpg',
      },
      {
        title: 'Suspended',
        medium: 'Oil and ink on canvas',
        dimensions: '160 × 130 cm',
        year: 2023,
        description: 'A single figure arrested mid-fall, or mid-flight. Gravity is uncertain here. The body is rendered with careful anatomical attention from the torso upward, then dissolves into gestural ink washes toward the extremities.',
        slug: 'rouy-2',
        imageUrl: 'https://hannahbarry.com/wp-content/uploads/2018/02/L-GR0352-Afterimage-cropped-500x658.jpg',
      },
      {
        title: 'Threshold',
        medium: 'Oil on canvas',
        dimensions: '240 × 200 cm',
        year: 2024,
        description: 'Rouy\'s largest work to date. A doorway-like structure — more imagined than architectural — through which a figure is passing, body distorting as it crosses. The painting asks what remains of a person once they move from one state to another.',
        slug: 'rouy-3',
        imageUrl: 'https://hannahbarry.com/wp-content/uploads/2018/02/L-GR0350-MOTHER-cropped-500x659.jpg',
      },
    ],
  },
  {
    email: 'karolina.zadlo@demo.aspda.pl',
    name: 'Karolina Żądło',
    avatarUrl: 'https://randomuser.me/api/portraits/women/34.jpg',
    coverUrl: 'https://picsum.photos/seed/zadlo-cover/1400/400',
    bio: 'Born in 1999, Karolina Żądło studied at the Academy of Fine Arts in Krakow. Her figurative oil paintings examine femininity through the symbolic weight of objects — pearls worn as armour, flowers that carry danger, translucent fabrics layered over the body as protection and exposure simultaneously. Żądło builds up her canvases slowly, using transparent glazes that allow underlayers to remain visible and alter the reading of the surface. The tension in her work lies between fragility and resistance: things that appear delicate are recast as shields, and things that seem threatening are revealed as ordinary. One of the standout voices in the current generation of Polish painters.',
    artworks: [
      {
        title: 'Shield',
        medium: 'Oil on canvas',
        dimensions: '100 × 80 cm',
        year: 2024,
        description: 'A figure whose body is draped in a cascade of pearls — not jewellery but armour. The glazing technique renders the skin beneath the pearls visible, fragile, and yet the overall impression is one of formidable composure.',
        slug: 'zadlo-1',
        imageUrl: 'https://art-hub-magazine.com/wp-content/uploads/2024/11/snapinsta.app_408187781_1121800525470269_1326843798601656678_n_1080-1.jpg',
      },
      {
        title: 'Temptation of Eve',
        medium: 'Oil on canvas',
        dimensions: '120 × 90 cm',
        year: 2024,
        description: 'Flowers spill from an open hand — beautiful and abundant but with something unsettling in their excess. The image draws on the iconography of vanitas painting while refusing its moral framework entirely.',
        slug: 'zadlo-2',
        imageUrl: 'https://art-hub-magazine.com/wp-content/uploads/2024/11/snapinsta.app_465461590_543834998376097_3605431571154365649_n_1080.jpg',
      },
      {
        title: 'Dissolution',
        medium: 'Oil on linen',
        dimensions: '80 × 60 cm',
        year: 2023,
        description: 'A face glimpsed through layers of translucent fabric — visible and concealed simultaneously. The painting explores the way that covering something can be both protective and an act of erasure.',
        slug: 'zadlo-3',
        imageUrl: 'https://art-hub-magazine.com/wp-content/uploads/2024/11/snapinsta.app_465892589_807924964695576_5297895669379564604_n_1080.jpg',
      },
    ],
  },
  {
    email: 'lukasz.stoklosa@demo.aspda.pl',
    name: 'Łukasz Stokłosa',
    avatarUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
    coverUrl: 'https://picsum.photos/seed/stoklosa-cover/1400/400',
    bio: 'Born in 1986 in Kalwaria Zebrzydowska, Łukasz Stokłosa graduated from the Academy of Fine Arts in Krakow in 2010. He lives and works in Krakow. Stokłosa\'s paintings return obsessively to the imagery and technique of old masters — the chiaroscuro of Caravaggio, the compositional theatricality of Baroque altarpieces, the still-life conventions of the Dutch Golden Age — but reroute them through contemporary sensibilities: homoerotic desire, the aesthetics of kitsch and camp, and a gothic awareness of mortality. Included in Kurt Beers\' "100 Painters of Tomorrow" (Thames & Hudson, 2014). Represented by Zderzak Gallery, Krakow and Krupa Gallery, Wroclaw.',
    artworks: [
      {
        title: 'After Saint Sebastian',
        medium: 'Oil on canvas',
        dimensions: '160 × 120 cm',
        year: 2023,
        description: 'A reprise of the most painted body in Western art history — and the most erotically charged. Stokłosa\'s version strips the composition back to a single male figure in a palatial interior, arrows replaced by the weight of the viewer\'s gaze.',
        slug: 'stoklosa-1',
        imageUrl: 'https://krupagallery.pl/wp-content/uploads/2020/10/lukasz-stoklosa-wiktoria-bernadotte-2024-olej-na-plotnie-40x50-cm-1600x1286.jpg',
      },
      {
        title: 'Vanitas with Gold',
        medium: 'Oil on panel',
        dimensions: '60 × 50 cm',
        year: 2022,
        description: 'A Dutch-style still life: a skull, a half-eaten pomegranate, a pile of gold jewellery. Technically immaculate and yet the arrangement refuses to be purely melancholic — the objects glitter with a genuine pleasure in material beauty.',
        slug: 'stoklosa-2',
        imageUrl: 'https://krupagallery.pl/wp-content/uploads/2020/10/ls52-image-1-1600x1198.jpg',
      },
      {
        title: 'Interior with Dark Figure',
        medium: 'Oil on canvas',
        dimensions: '200 × 150 cm',
        year: 2024,
        description: 'A palatial, dimly lit interior — all gilded frames and deep mahogany — occupied by a single figure whose face is turned away. The painting withholds identity entirely, leaving the viewer to project.',
        slug: 'stoklosa-3',
        imageUrl: 'https://krupagallery.pl/wp-content/uploads/2020/10/ls16-image-1600x1208.jpg',
      },
      {
        title: 'The Adoration',
        medium: 'Oil on canvas',
        dimensions: '180 × 140 cm',
        year: 2023,
        description: 'Borrowed from the Baroque altarpiece format: multiple figures arranged around a central, luminous presence. The devotion is real; only the object of devotion is ambiguous.',
        slug: 'stoklosa-4',
        imageUrl: 'https://krupagallery.pl/wp-content/uploads/2020/10/lsp01-image-1600x1296.jpg',
      },
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

  const { data: { users } } = await supabase.auth.admin.listUsers()
  const existing = users.find((u) => u.email === email)
  if (!existing) throw new Error(`Could not create or find user ${email}: ${error.message}`)
  return existing.id
}

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; seed-script/1.0)' },
  })
  if (!res.ok) throw new Error(`Failed to fetch image from "${url}": ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  console.log('Seeding real artists...\n')

  for (const artistData of ARTISTS) {
    process.stdout.write(`  ${artistData.name}... `)

    const userId = await getOrCreateAuthUser(artistData.email, artistData.name)

    await db.user.upsert({
      where: { id: userId },
      create: { id: userId, email: artistData.email, name: artistData.name, avatarUrl: artistData.avatarUrl },
      update: { avatarUrl: artistData.avatarUrl },
    })

    const artist = await db.artist.upsert({
      where: { userId },
      create: { userId, bio: artistData.bio, coverUrl: artistData.coverUrl, verificationStatus: VerificationStatus.VERIFIED },
      update: { bio: artistData.bio, coverUrl: artistData.coverUrl },
    })

    const existingCount = await db.artwork.count({ where: { artistId: artist.id } })
    if (existingCount > 0) {
      console.log(`skipped artworks (${existingCount} already exist)`)
      continue
    }

    for (const aw of artistData.artworks) {
      const storagePath = `seed/v2/${userId}/${aw.slug}.jpg`

      const image = await fetchImage(aw.imageUrl)
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
