'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { trpc } from '@/src/lib/trpc/client'

export function OpenDisputeButton({ escrowPaymentId }: { escrowPaymentId: string }) {
  const t = useTranslations('orders')
  const router = useRouter()

  const open = trpc.dispute.open.useMutation({
    onSuccess: () => router.refresh(),
  })

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
      disabled={open.isPending}
      onClick={() => open.mutate({ escrowPaymentId })}
    >
      {t('openDispute')}
    </Button>
  )
}
