'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { HeartIcon } from '@/components/heart-icon'
import { toggleInterest } from '@/src/lib/artwork/actions'

type Props = {
  artworkId: string
  initialInterested: boolean
  initialCount: number
  label: string
  signInHref: string
  isLoggedIn: boolean
}

export function InterestedButton({ artworkId, initialInterested, initialCount, label, signInHref, isLoggedIn }: Props) {
  const [interested, setInterested] = useState(initialInterested)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  if (!isLoggedIn) {
    return (
      <a href={signInHref} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
        <HeartIcon className="h-4 w-4 shrink-0" />
        {label} {count > 0 && <span className="text-muted-foreground">({count})</span>}
      </a>
    )
  }

  function handleClick() {
    startTransition(async () => {
      const result = await toggleInterest(artworkId)
      setInterested(result.interested)
      setCount(result.count)
    })
  }

  return (
    <Button
      variant={interested ? 'default' : 'outline'}
      className="w-full gap-2"
      onClick={handleClick}
      disabled={isPending}
    >
      <HeartIcon filled={interested} className="h-4 w-4 shrink-0" />
      {label} {count > 0 && <span className={interested ? 'text-primary-foreground/70' : 'text-muted-foreground'}>({count})</span>}
    </Button>
  )
}
