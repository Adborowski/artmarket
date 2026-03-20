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
    email: 'maja.kowalska@asp.waw.pl',
    name: 'Maja Kowalska',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    coverUrl: 'https://picsum.photos/seed/maja-cover/1400/400',
    bio: 'Artystka wizualna specjalizująca się w malarstwie abstrakcyjnym. Ukończyła Akademię Sztuk Pięknych w Warszawie w 2018 roku ze specjalizacją w malarstwie. Jej prace eksplorują relację między pamięcią a przestrzenią, używając intensywnych warstw koloru i faktury jako języka emocji. Inspirowana twórczością Hilmy af Klint i Marka Rothko, Maja tworzy obrazy, które działają na widza na poziomie podświadomości — zapraszając do zatrzymania się i wsłuchania w ciszę między kształtami. Brała udział w ponad dwudziestu wystawach grupowych w Polsce i za granicą, a jej prace trafiły do kolekcji prywatnych w Warszawie, Berlinie i Amsterdamie. Pracuje w swojej pracowni na warszawskiej Pradze.',
    artworks: [
      { title: 'Fragmenty I', medium: 'Olej na płótnie', dimensions: '80 × 100 cm', year: 2023, description: 'Medytacja nad fragmentaryczną naturą wspomnień — warstwy farby nakładane przez tygodnie tworzą geologię czasu.', picsum: 'maja-1' },
      { title: 'Bez tytułu #3', medium: 'Akryl na płótnie', dimensions: '60 × 80 cm', year: 2022, description: null, picsum: 'maja-2' },
      { title: 'Pejzaż wewnętrzny', medium: 'Technika mieszana', dimensions: '100 × 120 cm', year: 2024, description: 'Introspekcja przetłumaczona na język koloru i faktury. Obraz powstawał równolegle z dziennikiem — każda sesja malarska odpowiada zapiskom z jednego dnia.', picsum: 'maja-3' },
      { title: 'Erozja', medium: 'Olej na desce', dimensions: '40 × 50 cm', year: 2022, description: null, picsum: 'maja-4' },
    ],
  },
  {
    email: 'piotr.wisniewski@uap.edu.pl',
    name: 'Piotr Wiśniewski',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    coverUrl: 'https://picsum.photos/seed/piotr-cover/1400/400',
    bio: 'Fotograf dokumentalny i artystyczny z Warszawy. Absolwent wydziału fotografii Uniwersytetu Artystycznego w Poznaniu (2015). Od dekady dokumentuje zmieniające się oblicze polskich miast — ich architekturę, światło i ludzi na granicy widzialności. Szczególnie bliskie jest mu nocne miasto: czas, gdy przestrzeń publiczna zmienia swój charakter, a geometria budynków wchodzi w dialog z sztucznym oświetleniem. Jego prace były publikowane w „Gazecie Wyborczej", „Przekroju" i w międzynarodowych pismach fotograficznych. Laureat Nagrody Fotograficznej im. Chrisa Niedenthala (2021). Pracuje również jako fotograf reportażowy i prowadzi warsztaty fotografii nocnej.',
    artworks: [
      { title: 'Warszawa nocą', medium: 'Fotografia', dimensions: '50 × 70 cm', year: 2023, description: 'Seria nocnych ekspozycji centrum Warszawy wykonana w ciągu jednej zimy. Długie czasy naświetlania zamieniają ruch uliczny w świetlne strugi.', picsum: 'piotr-1' },
      { title: 'Refleksje', medium: 'Fotografia', dimensions: '40 × 60 cm', year: 2022, description: null, picsum: 'piotr-2' },
      { title: 'Geometria miasta', medium: 'Fotografia', dimensions: '60 × 60 cm', year: 2024, description: 'Abstrakcyjna geometria architektury miejskiej — fasady, kratownice i ramy okienne tworzą kompozycje bliskie malarstwu konstruktywistycznemu.', picsum: 'piotr-3' },
    ],
  },
  {
    email: 'zofia.jablonska@asp.krakow.pl',
    name: 'Zofia Jabłońska',
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    coverUrl: 'https://picsum.photos/seed/zofia-cover/1400/400',
    bio: 'Akwarelistka i ilustratorka urodzona w Krakowie, od 2015 roku mieszka i tworzy w Warszawie. Studiowała malarstwo na Akademii Sztuk Pięknych w Krakowie oraz na Escola Massana w Barcelonie, gdzie zetknęła się z tradycją akwareli katalońskiej. Jej delikatne, nasycone barwą prace czerpią z uważnej obserwacji przyrody — polskich łąk, lasów i ogrodów — i przekształcają ją w liryczne kompozycje balansujące na granicy figuracji i abstrakcji. Obrazy Zofii znalazły nabywców w kilkunastu krajach; były też reprodukowane na okładkach książek i kalendarzy wydawniczych. Prowadzi regularne warsztaty akwareli otwarte dla dorosłych, dostępne zarówno stacjonarnie, jak i online.',
    artworks: [
      { title: 'Kwiaty polne', medium: 'Akwarela', dimensions: '30 × 40 cm', year: 2023, description: 'Delikatna interpretacja polskiej flory — chabry, maki i rumianek uchwycone w chwili największego rozkwitu.', picsum: 'zofia-1' },
      { title: 'Letni deszcz', medium: 'Akwarela', dimensions: '40 × 50 cm', year: 2023, description: null, picsum: 'zofia-2' },
      { title: 'Pejzaż mazowiecki', medium: 'Akwarela', dimensions: '50 × 70 cm', year: 2022, description: 'Rozległe mazowieckie pola w wieczornym świetle — poziomy pasek horyzontu przywodzi na myśl holenderski pejzaż złotego wieku.', picsum: 'zofia-3' },
    ],
  },
  {
    email: 'aleksander.nowak@example.com',
    name: 'Aleksander Nowak',
    avatarUrl: 'https://randomuser.me/api/portraits/men/57.jpg',
    coverUrl: 'https://picsum.photos/seed/aleksander-cover/1400/400',
    bio: 'Artysta cyfrowy i projektant interaktywny. Absolwent informatyki stosowanej Politechniki Warszawskiej oraz studiów podyplomowych z historii sztuki w SWPS. To połączenie technologii i humanistyki ukształtowało jego specyficzne podejście do sztuki cyfrowej jako narzędzia krytycznego komentarza społecznego. Pracuje na styku algorytmów generatywnych, danych i ręcznej kompozycji — jego prace często zawierają warstwy danych statystycznych przekształcone w obrazy wizualne. Interesuje go estetyka systemów: interfejsów, protokołów, kodu. Instalacje i druki Aleksandra były prezentowane na festiwalach sztuki cyfrowej w Berlinie (CTM), Londynie (Ars Electronica) i Tokio (Media Ambition). Mieszka i pracuje w Warszawie.',
    artworks: [
      { title: 'Interfejs #7', medium: 'Druk cyfrowy', dimensions: '70 × 70 cm', year: 2024, description: 'Z serii badającej estetykę interfejsów użytkownika — GUI jako forma malarstwa konkretnego.', picsum: 'aleksander-1' },
      { title: 'Data Stream', medium: 'Druk cyfrowy', dimensions: '50 × 100 cm', year: 2023, description: null, picsum: 'aleksander-2' },
      { title: 'Pikselowe marzenia', medium: 'Druk cyfrowy', dimensions: '60 × 80 cm', year: 2024, description: 'Oniryczna podróż przez cyfrowy krajobraz — dane z czujników miejskich zamienione w abstrakcyjną kompozycję barwną.', picsum: 'aleksander-3' },
    ],
  },
  {
    email: 'karolina.dabrowska@asp.wroc.pl',
    name: 'Karolina Dąbrowska',
    avatarUrl: 'https://randomuser.me/api/portraits/women/26.jpg',
    coverUrl: 'https://picsum.photos/seed/karolina-cover/1400/400',
    bio: 'Ceramiczka i rzeźbiarka tworząca organiczne formy na styku rzemiosła i sztuki współczesnej. Ukończyła Akademię Sztuk Pięknych we Wrocławiu ze specjalizacją w ceramice artystycznej, a następnie odbyła staż w pracowni Ceramic Arts Londyn. Od 2020 roku prowadzi własną pracownię na warszawskiej Woli. Jej formy — naczynia, rzeźby, instalacje — inspirowane są anatomią roślin i rytmami natury: liściami, muszlami, korzeniami. Karolina pracuje zarówno w technikach tradycyjnych (koło garncarskie, lepienie ręczne), jak i eksperymentalnych (wypalanie raku, ceramika solna). Jej prace były wystawiane w galeriach w Warszawie, Krakowie i Wrocławiu; kilka trafiło do stałych kolekcji muzealnych. Prowadzi popularne warsztaty ceramiczne otwarte dla dorosłych.',
    artworks: [
      { title: 'Forma organiczna I', medium: 'Ceramika', dimensions: '25 × 30 × 20 cm', year: 2023, description: 'Rzeźba ceramiczna inspirowana formami roślinnymi — spirala liścia paproci przetłumaczona na język gliny i ognia.', picsum: 'karolina-1' },
      { title: 'Dialog', medium: 'Ceramika, drewno', dimensions: '40 × 15 × 15 cm', year: 2022, description: null, picsum: 'karolina-2' },
      { title: 'Przestrzeń I', medium: 'Ceramika', dimensions: '30 × 30 × 25 cm', year: 2024, description: 'Eksploracja pustki i wypełnienia w formie ceramicznej — wnętrze rzeźby jest równie ważne jak jej zewnętrze.', picsum: 'karolina-3' },
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
