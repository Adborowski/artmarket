import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@artmarket/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const listingId = pi.metadata?.listingId
      if (listingId) {
        await db.escrowPayment.updateMany({
          where: { stripePaymentId: pi.id },
          data: { status: 'HELD' },
        })
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      // Log for manual follow-up — no automated handling in v1
      console.error(`[stripe] PaymentIntent failed: ${pi.id} listing=${pi.metadata?.listingId}`)
      break
    }

    default:
      // Unhandled event — ignore
      break
  }

  return NextResponse.json({ received: true })
}
