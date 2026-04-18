'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/src/lib/trpc/client'
import { isValidIban } from '@/src/lib/iban'

type Props = {
  initialBio: string | null
  initialIban: string | null
}

export function SellerProfileForm({ initialBio, initialIban }: Props) {
  const t = useTranslations('account.profile')
  const router = useRouter()
  const [bio, setBio] = useState(initialBio ?? '')
  const [iban, setIban] = useState(initialIban ?? '')
  const [ibanError, setIbanError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const upsert = trpc.artist.upsertProfile.useMutation({
    onSuccess: () => {
      setSaved(true)
      router.refresh()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIbanError(null)
    setSaved(false)

    if (iban && !isValidIban(iban)) {
      setIbanError(t('ibanInvalid'))
      return
    }

    upsert.mutate({ bio: bio || undefined, ibanNumber: iban || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t('bioLabel')}</label>
        <Textarea
          value={bio}
          onChange={(e) => { setBio(e.target.value); setSaved(false) }}
          rows={4}
          maxLength={1000}
          placeholder={t('bioPlaceholder')}
          className="resize-none text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t('ibanLabel')}</label>
        <Input
          value={iban}
          onChange={(e) => { setIban(e.target.value); setSaved(false); setIbanError(null) }}
          placeholder={t('ibanPlaceholder')}
        />
        <p className="text-xs text-muted-foreground">{t('ibanHint')}</p>
        {ibanError && <p className="text-xs text-destructive">{ibanError}</p>}
      </div>

      {upsert.error && <p className="text-sm text-destructive">{t('error')}</p>}
      {saved && <p className="text-sm text-green-600">{t('saved')}</p>}

      <Button type="submit" disabled={upsert.isPending}>
        {upsert.isPending ? t('saving') : t('save')}
      </Button>
    </form>
  )
}
