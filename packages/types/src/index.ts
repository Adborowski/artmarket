// Shared domain types used across web, mobile, and API packages.
// Prisma-generated types are exported from @artmarket/db — put non-Prisma
// types here (notification payloads, API shapes, etc.).

export type NotificationEvent =
  | { type: 'OUTBID'; listingId: string; newAmount: number }
  | { type: 'AUCTION_ENDING_SOON'; listingId: string; endsAt: string }
  | { type: 'AUCTION_WON'; listingId: string; amount: number }
  | { type: 'PAYMENT_CAPTURED'; listingId: string; amount: number }
  | { type: 'PAYOUT_RELEASED'; payoutId: string; amount: number }
  | { type: 'DISPUTE_OPENED'; disputeId: string; listingId: string }
