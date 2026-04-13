import { db } from '@artmarket/db'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { getStripe } from '../lib/stripe'

export const billingRouter = createTRPCRouter({
  // Returns whether the current user has a saved payment method.
  hasPaymentMethod: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: { stripePaymentMethodId: true },
    })
    return { has: !!user?.stripePaymentMethodId }
  }),

  // Creates a Stripe Customer (if needed) and a SetupIntent.
  // Returns the clientSecret for Stripe Elements to confirm.
  createSetupIntent: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe()
    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: { stripeCustomerId: true, email: true, name: true },
    })
    if (!user) throw new Error('User not found')

    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: ctx.userId },
      })
      customerId = customer.id
      await db.user.update({
        where: { id: ctx.userId },
        data: { stripeCustomerId: customerId },
      })
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // allows charging when user is not present (auction close)
    })

    return { clientSecret: setupIntent.client_secret! }
  }),

  // Called after Stripe Elements confirms the SetupIntent on the client.
  // Saves the resulting PaymentMethod ID to the user.
  confirmPaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.userId },
        select: { stripeCustomerId: true },
      })
      if (!user?.stripeCustomerId) throw new Error('Stripe customer not initialised')

      // Attach to customer so it can be used off-session.
      // Ignore "already attached" errors — safe to call multiple times.
      const stripe = getStripe()
      try {
        await stripe.paymentMethods.attach(input.paymentMethodId, {
          customer: user.stripeCustomerId,
        })
      } catch (err: unknown) {
        const alreadyAttached =
          typeof err === 'object' && err !== null && 'code' in err &&
          (err as { code: string }).code === 'payment_method_already_attached'
        if (!alreadyAttached) throw err
      }

      await db.user.update({
        where: { id: ctx.userId },
        data: { stripePaymentMethodId: input.paymentMethodId },
      })

      return { ok: true }
    }),
})
