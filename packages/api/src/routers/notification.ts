import { db } from '@artmarket/db'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const notificationRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.notification.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, type: true, title: true, body: true, link: true, read: true, createdAt: true },
    })
    return rows.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await db.notification.count({
      where: { userId: ctx.userId, read: false },
    })
    return { count }
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.notification.updateMany({
      where: { userId: ctx.userId, read: false },
      data: { read: true },
    })
    return { ok: true }
  }),
})
