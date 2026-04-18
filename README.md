# Artmarket

A bilingual (PL/EN) online auction house for original artwork, focused on the Polish market. Connects emerging artists — starting with students at ASP Warsaw (Academy of Fine Arts) — with small collectors who want to own original art.

## What it does

- Artists list original artworks for auction with photo uploads
- Buyers place bids; live updates via Supabase Realtime
- Stripe handles payment capture and escrow on auction close
- Funds are held until the buyer confirms receipt or 14 days elapse without a dispute
- Disputes open a real-time chat thread between buyer and artist; funds stay frozen until resolved
- Platform takes a commission at transfer time; artists receive the remainder via Stripe Connect Express

## Tech stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + Bun |
| Web | Next.js 15 (App Router) |
| Mobile | Expo + EAS Native Builds *(in progress)* |
| API | tRPC (type-safe, consumed by both apps) |
| Database | Supabase (PostgreSQL) — eu-central-1 (Frankfurt) |
| Auth | Supabase Auth (email/password + ASP Warsaw domain verification) |
| Payments | Stripe Connect Express + BLIK |
| ORM | Prisma |
| i18n | next-intl (web) / i18next (mobile), PL + EN |
| Styling | Tailwind CSS + shadcn/ui (web), NativeWind (mobile) |
| Jobs | Vercel Cron + DB polling |
| Email | Resend + React Email *(planned)* |
| Push | Expo Push Notifications *(planned)* |

## Monorepo layout

```
artmarket/
├── apps/
│   ├── web/          # Next.js — primary app, web-first
│   └── mobile/       # Expo — buyer + artist mobile app
├── packages/
│   ├── api/          # tRPC router (shared by web + mobile)
│   ├── db/           # Prisma schema + Supabase client
│   ├── fonts/        # Self-hosted Basteleur font (Velvetyne, OFL)
│   └── institutions/ # Email-domain → institution badge mapping
└── tooling/
    ├── eslint/
    └── tsconfig/
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.1
- A [Supabase](https://supabase.com) project (PostgreSQL + Storage + Realtime)
- A [Stripe](https://stripe.com) account with Connect enabled

### Install

```bash
bun install
```

### Environment variables

Copy the example env file in `apps/web` and fill in your credentials:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Required variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=        # random secret to authenticate Vercel Cron requests
```

### Database

Push the Prisma schema to your Supabase database:

```bash
bun run db:push
```

### Run (development)

```bash
bun run dev
```

This starts all apps and packages in watch mode via Turborepo.

## Key flows

### Auction lifecycle

1. Artist creates a listing with photos, start price, and end time
2. Buyers place bids; the current price updates in real time
3. At `endsAt`, a Vercel Cron job closes the auction and sets the winning bid
4. The winner pays via Stripe (card or BLIK)
5. Funds are held in escrow (`EscrowPayment.status = HELD`)

### Shipping & escrow release

1. Seller marks the order as shipped: enters carrier + tracking number and optionally uploads packaging photos (resized client-side before upload)
2. Buyer sees tracking info on the orders page with deep links to carrier tracking pages
3. Buyer confirms delivery → escrow released to artist
4. If no action after 14 days → automatic release via cron
5. Buyer can open a dispute before confirming; this freezes the auto-release and opens a chat thread

### Artist verification

Artists register with an email address. An ASP Warsaw (`asp.waw.pl`) domain grants a verified institution badge automatically. Other institutions can be added in `packages/institutions`.

## Admin

`/admin` (authenticated admin users only) shows:

- Active auctions — with a force-close action
- Escrow payments — with a manual release action and a link to the Stripe dashboard
- Open disputes — linked to their dispute threads

## Safety guide

`/guide` is a public-facing Safe Shopping Guide that explains the escrow process, how to document shipping, and how to open a dispute. It is referenced from the footer and from the shipping form.

## Notes

- Original artwork only — enforced via Terms of Service, not code
- No print or reproduction listings
- The repo is public; never commit secrets
