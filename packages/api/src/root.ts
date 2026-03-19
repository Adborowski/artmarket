import { createTRPCRouter } from './trpc'

// Feature routers are added here as they are built.
// e.g. import { listingsRouter } from './routers/listings'
export const appRouter = createTRPCRouter({})

export type AppRouter = typeof appRouter
