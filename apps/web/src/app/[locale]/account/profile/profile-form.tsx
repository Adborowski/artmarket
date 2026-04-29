'use client'

import { useTranslations } from 'next-intl'

export function ProfileForm({ initialName }: { initialName: string }) {
  const t = useTranslations('account.profile')

  return (
    <div className="space-y-4 max-w-sm">
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{t('nameLabel')}</p>
        <p className="text-sm">{initialName}</p>
        <p className="text-xs text-muted-foreground">{t('nameReadOnly')}</p>
      </div>
    </div>
  )
}
