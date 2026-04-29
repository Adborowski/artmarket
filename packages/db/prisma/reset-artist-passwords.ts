/**
 * Resets all demo artist account passwords to "test123".
 * Run: bun prisma/reset-artist-passwords.ts  (from packages/db)
 */

import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: join(__dirname, '../.env') })
config({ path: join(__dirname, '../../../apps/web/.env.local') })

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const ARTIST_EMAILS = [
  'pol.taburet@demo.aspda.pl',
  'george.rouy@demo.aspda.pl',
  'karolina.zadlo@demo.aspda.pl',
  'lukasz.stoklosa@demo.aspda.pl',
]

async function main() {
  const { data: { users } } = await supabase.auth.admin.listUsers()

  for (const email of ARTIST_EMAILS) {
    const user = users.find((u) => u.email === email)
    if (!user) {
      console.log(`  not found: ${email}`)
      continue
    }
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: 'test123' })
    if (error) console.log(`  failed ${email}: ${error.message}`)
    else console.log(`  ✓ ${email}`)
  }

  console.log('\nDone.')
}

main().catch(console.error)
