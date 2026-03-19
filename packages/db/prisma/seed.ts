/**
 * Dev seed — creates a pre-verified Artist for local development.
 *
 * How to use:
 *  1. Sign up via Supabase Auth (dashboard or app) with any email.
 *  2. Copy your user UUID from the Supabase Auth dashboard.
 *  3. Add it to packages/db/.env:  DEV_USER_ID="<your-uuid>"
 *  4. Run: bun run db:seed
 *
 * Re-running is safe — all operations are upserts.
 */

import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient, VerificationStatus } from '@prisma/client'

// Load .env the same way prisma.config.ts does — bun --env-file mangles special chars.
const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: join(__dirname, '../.env') })

// Use direct connection for seeding — pgBouncer (DATABASE_URL) can reject
// certain auth flows; DIRECT_URL bypasses the pooler.
const db = new PrismaClient({
  datasources: { db: { url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'] } },
})

async function main() {
  const devUserId = process.env['DEV_USER_ID']

  if (!devUserId) {
    console.error(
      'DEV_USER_ID is not set.\n' +
        'Create a user via Supabase Auth and add their UUID to packages/db/.env',
    )
    process.exit(1)
  }

  await db.user.upsert({
    where: { id: devUserId },
    update: {},
    create: {
      id: devUserId,
      email: 'dev@asp.waw.pl',
      name: 'Dev Artist',
    },
  })

  await db.artist.upsert({
    where: { userId: devUserId },
    update: { verificationStatus: VerificationStatus.VERIFIED },
    create: {
      userId: devUserId,
      bio: 'Development test artist (pre-verified)',
      verificationStatus: VerificationStatus.VERIFIED,
    },
  })

  console.log('✓ Dev artist seeded and verified:', devUserId)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
