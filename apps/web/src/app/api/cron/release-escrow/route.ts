import { db } from '@artmarket/db'
import { releaseEscrow } from '@artmarket/api'

/**
 * GET /api/cron/release-escrow
 *
 * Releases all escrow payments whose auto-release date has passed and
 * have no active dispute. Protected by CRON_SECRET.
 *
 * Configure in vercel.json:
 *   { "crons": [{ "path": "/api/cron/release-escrow", "schedule": "0 2 * * *" }] }
 *
 * Vercel automatically sends Authorization: Bearer <CRON_SECRET>.
 * For external schedulers (cron-job.org, GitHub Actions), send the same header.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date()

  const due = await db.escrowPayment.findMany({
    where: {
      status: 'HELD',
      releaseScheduledAt: { lte: now },
      OR: [
        { dispute: { is: null } },
        { dispute: { status: 'RESOLVED' } },
      ],
    },
    select: { id: true },
  })

  const results = await Promise.allSettled(due.map((e) => releaseEscrow(e.id)))

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  console.log(`[cron/release-escrow] ${succeeded} released, ${failed} failed of ${due.length} due`)

  return Response.json({ released: succeeded, failed, total: due.length })
}
