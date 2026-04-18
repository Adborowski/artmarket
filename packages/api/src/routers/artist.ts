import { db } from '@artmarket/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

function isValidIban(raw: string): boolean {
  const iban = raw.replace(/\s+/g, '').toUpperCase()
  if (iban.length < 15 || iban.length > 34) return false
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  const numeric = rearranged
    .split('')
    .map((c) => (c >= 'A' ? (c.charCodeAt(0) - 55).toString() : c))
    .join('')
  let remainder = 0
  for (const ch of numeric) remainder = (remainder * 10 + parseInt(ch, 10)) % 97
  return remainder === 1
}

export const artistRouter = createTRPCRouter({
  // Creates or updates the artist record. Used by the unified profile editor.
  upsertProfile: protectedProcedure
    .input(z.object({
      bio: z.string().max(1000).optional(),
      ibanNumber: z.string().max(34).optional().refine(
        (v) => !v || isValidIban(v),
        { message: 'Invalid IBAN' },
      ),
    }))
    .mutation(async ({ ctx, input }) => {
      const data = {
        bio: input.bio !== undefined ? (input.bio || null) : undefined,
        ibanNumber: input.ibanNumber !== undefined
          ? (input.ibanNumber ? input.ibanNumber.replace(/\s+/g, '').toUpperCase() : null)
          : undefined,
      }
      // Strip undefined keys so Prisma doesn't try to set them
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      ) as { bio?: string | null; ibanNumber?: string | null }

      await db.artist.upsert({
        where: { userId: ctx.userId },
        create: { userId: ctx.userId, ...cleanData },
        update: cleanData,
      })
      return { ok: true }
    }),

  // Kept for the standalone /artist/register page.
  register: protectedProcedure
    .input(z.object({
      bio: z.string().max(1000).optional(),
      ibanNumber: z.string().min(15).max(34).regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/, 'Invalid IBAN format'),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.artist.findUnique({ where: { userId: ctx.userId } })
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Already registered as an artist' })

      return db.artist.create({
        data: { userId: ctx.userId, bio: input.bio ?? null, ibanNumber: input.ibanNumber },
      })
    }),
})
