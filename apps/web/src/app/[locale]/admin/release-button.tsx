'use client'

import { useRouter } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { trpc } from '@/src/lib/trpc/client'

export function ReleaseButton({ escrowPaymentId }: { escrowPaymentId: string }) {
  const router = useRouter()
  const release = trpc.order.adminReleaseEscrow.useMutation({
    onSuccess: () => router.refresh(),
  })

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={release.isPending}
      onClick={() => release.mutate({ escrowPaymentId })}
    >
      {release.isPending ? 'Zwalnianie…' : 'Zwolnij środki'}
    </Button>
  )
}
