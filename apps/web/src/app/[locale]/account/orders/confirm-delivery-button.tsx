'use client'

import { useState } from 'react'
import { useRouter } from '@/src/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { trpc } from '@/src/lib/trpc/client'

export function ConfirmDeliveryButton({ escrowPaymentId }: { escrowPaymentId: string }) {
  const t = useTranslations('orders')
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  const mutate = trpc.order.confirmDelivery.useMutation({
    onSuccess: () => router.refresh(),
  })

  if (!confirming) {
    return (
      <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
        {t('confirmDelivery')}
      </Button>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3 max-w-sm">
      <p className="text-xs text-amber-800">{t('confirmDeliveryWarning')}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={mutate.isPending}
          onClick={() => mutate.mutate({ escrowPaymentId })}
        >
          {mutate.isPending ? '…' : t('confirmDeliveryConfirm')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          {t('confirmDeliveryCancel')}
        </Button>
      </div>
      {mutate.error && <p className="text-xs text-destructive">{mutate.error.message}</p>}
    </div>
  )
}
