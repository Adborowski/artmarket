'use client'

import { useState } from 'react'
import { useRouter } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { trpc } from '@/src/lib/trpc/client'

export function ForceCloseButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [closed, setClosed] = useState(false)
  const close = trpc.listing.adminClose.useMutation({
    onSuccess: () => { setClosed(true); router.refresh() },
  })

  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={close.isPending || closed}
      onClick={() => close.mutate({ listingId })}
    >
      {close.isPending ? 'Zamykanie…' : closed ? 'Zamknięto' : 'Zamknij aukcję'}
    </Button>
  )
}
