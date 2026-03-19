'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  action: () => Promise<void>
  label: string
}

export function DeleteArtworkButton({ action, label }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(label + '?')) return
    startTransition(() => action())
  }

  return (
    <Button variant="destructive" size="lg" className="w-full" disabled={isPending} onClick={handleClick}>
      {label}
    </Button>
  )
}
