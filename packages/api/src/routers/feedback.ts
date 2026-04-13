import { Resend } from 'resend'
import { z } from 'zod'
import { publicProcedure, createTRPCRouter } from '../trpc'

const feedbackSchema = z.object({
  type: z.enum(['problem', 'feature']),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  email: z.string().email(),
})

export const feedbackRouter = createTRPCRouter({
  submit: publicProcedure.input(feedbackSchema).mutation(async ({ input }) => {
    const apiKey = process.env.RESEND_API_KEY
    const supportEmail = process.env.SUPPORT_EMAIL

    if (!apiKey || !supportEmail) {
      // Silently succeed in dev when email is not configured
      console.log('[feedback] Email not configured — skipping send:', input)
      return { ok: true }
    }

    const resend = new Resend(apiKey)
    const typeLabel = input.type === 'problem' ? 'Problem report' : 'Feature suggestion'

    await resend.emails.send({
      from: 'Artmarket Feedback <noreply@artmarket.pl>',
      to: supportEmail,
      replyTo: input.email,
      subject: `[${typeLabel}] ${input.subject}`,
      text: `Type: ${typeLabel}\nFrom: ${input.email}\n\n${input.description}`,
    })

    return { ok: true }
  }),
})
