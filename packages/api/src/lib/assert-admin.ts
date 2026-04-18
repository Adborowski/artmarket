import { TRPCError } from '@trpc/server'

export function assertAdmin(userId: string): void {
  const adminId = process.env.ADMIN_USER_ID
  if (!adminId || userId !== adminId) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
}
