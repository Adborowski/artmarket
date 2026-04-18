'use client'

import { useRouter } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { trpc } from '@/src/lib/trpc/client'

export function ForceCloseButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const close = trpc.listing.adminClose.useMutation({
    onSuccess: () => router.refresh(),
  })

  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={close.isPending}
      onClick={() => close.mutate({ listingId })}
    >
      {close.isPending ? 'Zamykanie…' : 'Zamknij aukcję'}
    </Button>
  )
}
