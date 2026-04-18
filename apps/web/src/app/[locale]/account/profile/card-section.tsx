'use client'

import { useState } from 'react'
import { useRouter } from '@/src/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CardSetupForm } from '@/components/card-setup-form'

export function CardSection({ hasCard: initialHasCard }: { hasCard: boolean }) {
  const t = useTranslations('billing')
  const router = useRouter()
  const [hasCard, setHasCard] = useState(initialHasCard)
  const [changing, setChanging] = useState(false)

  function handleSuccess() {
    setHasCard(true)
    setChanging(false)
    router.refresh()
  }

  if (hasCard && !changing) {
    return (
      <div className="flex items-center justify-between max-w-sm">
        <p className="text-sm font-medium text-green-600">{t('savedCard')} ✓</p>
        <Button variant="outline" size="sm" onClick={() => setChanging(true)}>
          {t('changeCard')}
        </Button>
      </div>
    )
  }

  return <CardSetupForm onSuccess={handleSuccess} />
}
