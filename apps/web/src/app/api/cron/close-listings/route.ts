import { NextResponse } from 'next/server'
import { closeExpiredListings } from '@artmarket/api'

// Vercel Cron — runs every minute (configured in vercel.json)
// Protected by CRON_SECRET so it can't be triggered by strangers.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const closed = await closeExpiredListings()
  return NextResponse.json({ closed })
}
