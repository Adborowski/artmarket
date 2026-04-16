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
    <Button variant="outline" size="lg" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" disabled={isPending} onClick={handleClick}>
      {label}
    </Button>
  )
}
