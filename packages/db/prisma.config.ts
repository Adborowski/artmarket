import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Prisma skips .env loading when a config file is present — load it explicitly.
// In CI, actual env vars take precedence (dotenv won't overwrite them).
config({ path: join(__dirname, '.env') })

export default defineConfig({
  schema: 'prisma/schema.prisma',
})
