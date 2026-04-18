'use client'

// NOTE: Real-time bid updates require enabling the Bid table in Supabase Realtime replication.
// Run in Supabase SQL editor: ALTER PUBLICATION supabase_realtime ADD TABLE "Bid";

import { useState, useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { trpc } from '@/src/lib/trpc/client'
import { createClient } from '@/src/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { Countdown } from './countdown'

type Bid = {
  id: string
  bidderId: string
  amount: number
  createdAt: string
  isWinning: boolean
  bidder: { name: string }
}

type Listing = {
  id: string
  status: string
  startPrice: number
  reservePrice: number | null
  endsAt: string
  winningBidId: string | null
  artwork: { artist: { userId: string } }
}

export function BidPanel({
  listing,
  initialBids,
  userId,
}: {
  listing: Listing
  initialBids: Bid[]
  userId: string | null
}) {
  const t = useTranslations('listing.detail')
  const [bids, setBids] = useState<Bid[]>(initialBids)
  const [bidError, setBidError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const highestBid = bids[0]
  const currentPrice = highestBid ? highestBid.amount : listing.startPrice
  const minimumBid = highestBid ? highestBid.amount + 50 : listing.startPrice
  const reserveMet = !listing.reservePrice || currentPrice >= listing.reservePrice

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<{ amount: string }>({
    defaultValues: { amount: String(minimumBid) },
  })

  const { data: paymentData, isLoading: cardLoading } = trpc.billing.hasPaymentMethod.useQuery(
    undefined,
    { enabled: !!userId },
  )
  const hasCard = paymentData?.has ?? false

  const { refetch } = trpc.listing.getBids.useQuery(
    { listingId: listing.id },
    { enabled: false, initialData: initialBids },
  )

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`listing:${listing.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'Bid',
        filter: `listingId=eq.${listing.id}`,
      }, async () => {
        const result = await refetch()
        if (result.data) {
          setBids(result.data)
          setValue('amount', String(result.data[0] ? result.data[0].amount + 50 : listing.startPrice))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [listing.id])

  const placeBid = trpc.listing.placeBid.useMutation({
    onSuccess: async () => {
      setBidError(null)
      const result = await refetch()
      if (result.data) {
        setBids(result.data)
        setValue('amount', String(result.data[0] ? result.data[0].amount + 50 : listing.startPrice))
      }
    },
    onError: (e) => setBidError(e.message),
  })

  function onSubmit(values: { amount: string }) {
    setBidError(null)
    startTransition(() => {
      placeBid.mutate({ listingId: listing.id, amount: parseInt(values.amount, 10) })
    })
  }

  const isOwner = userId === listing.artwork.artist.userId
  const isTopBidder = !!userId && !!highestBid && highestBid.bidderId === userId

  return (
    <div className="rounded-lg border p-6 space-y-6">
      {/* Price */}
      <div>
        <p className="text-sm text-muted-foreground">
          {highestBid ? t('currentBid') : t('startingAt')}
        </p>
        <p className="text-3xl font-bold mt-1">{currentPrice.toLocaleString('pl-PL')} PLN</p>
        {listing.reservePrice && (
          <p className={`text-xs mt-1 ${reserveMet ? 'text-green-600' : 'text-muted-foreground'}`}>
            {reserveMet ? t('reserveMet') : t('reserveNotMet')}
          </p>
        )}
      </div>

      {/* Countdown */}
      <div>
        <p className="text-sm text-muted-foreground">{t('timeLeft')}</p>
        <Countdown endsAt={new Date(listing.endsAt)} endedLabel={t('ended')} />
      </div>

      {/* Bid form */}
      <div className="border-t pt-4">
        {!userId ? (
          <Button asChild className="w-full">
            <Link href="/auth/sign-in">{t('signInToBid')}</Link>
          </Button>
        ) : isOwner ? (
          <p className="text-sm text-muted-foreground">{t('ownArtwork')}</p>
        ) : cardLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t('checkingCard')}
          </div>
        ) : !hasCard ? (
          <p className="text-sm text-muted-foreground">
            {t('noCard')}{' '}
            <Link href="/account/profile" className="underline underline-offset-2 hover:text-foreground">
              {t('noCardLink')}
            </Link>
          </p>
        ) : isTopBidder ? (
          <div className="space-y-3">
            <Button className="w-full" disabled>{t('submit')}</Button>
            <p className="text-center text-sm text-muted-foreground">{t('youAreTopBidder')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="text-sm font-medium">
                {t('yourBid')}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({t('minimumBid')}: {minimumBid.toLocaleString('pl-PL')} PLN · {t('bidIncrement')})
                </span>
              </label>
              <Input
                type="number"
                min={minimumBid}
                step={50}
                className="mt-1"
                {...register('amount', { required: true, min: minimumBid })}
              />
            </div>
            {bidError && <p className="text-sm text-destructive">{bidError}</p>}
            <Button type="submit" className="w-full" disabled={placeBid.isPending || isPending}>
              {(placeBid.isPending || isPending) ? (
                <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />{t('bidding')}</>
              ) : t('submit')}
            </Button>
          </form>
        )}
      </div>

      {/* Bid history */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3">{t('bids')}</p>
        {bids.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noBids')}</p>
        ) : (
          <ul className="space-y-2">
            {bids.map((bid) => (
              <li key={bid.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{bid.bidder.name}</span>
                <span className="font-semibold">{bid.amount.toLocaleString('pl-PL')} PLN</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
