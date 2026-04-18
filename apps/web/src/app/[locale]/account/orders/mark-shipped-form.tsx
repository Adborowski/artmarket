'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from '@/src/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/src/lib/supabase/client'
import { resizeImage } from '@/src/lib/image-resize'
import { trpc } from '@/src/lib/trpc/client'

interface PhotoEntry {
  file: File
  previewUrl: string
}

export function MarkShippedForm({ escrowPaymentId, userId }: { escrowPaymentId: string; userId: string }) {
  const t = useTranslations('orders')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const mutate = trpc.order.markShipped.useMutation({
    onSuccess: () => router.refresh(),
  })

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const newEntries: PhotoEntry[] = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...newEntries].slice(0, 10))
  }

  function remove(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!carrier.trim() || !trackingNumber.trim()) return

    setUploadError(null)
    setIsUploading(true)

    const photoPaths: string[] = []
    if (photos.length > 0) {
      const supabase = createClient()
      for (const photo of photos) {
        const resized = await resizeImage(photo.file, 1500)
        const path = `${userId}/shipping/${escrowPaymentId}/${crypto.randomUUID()}.jpg`
        const { data, error } = await supabase.storage.from('artworks').upload(path, resized, { contentType: 'image/jpeg' })
        if (error || !data) {
          setUploadError(t('shippingPhotosUploadError'))
          setIsUploading(false)
          return
        }
        photoPaths.push(data.path)
      }
    }

    setIsUploading(false)
    mutate.mutate({
      escrowPaymentId,
      carrier: carrier.trim(),
      trackingNumber: trackingNumber.trim(),
      photoPaths: photoPaths.length > 0 ? photoPaths : undefined,
    })
  }

  const isBusy = isUploading || mutate.isPending

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 max-w-sm">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
        {t('guideReminder')}{' '}
        <a href="/guide" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
          {t('guideReminderLink')}
        </a>
      </div>
      <Input
        placeholder={t('carrierPlaceholder')}
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
        disabled={isBusy}
      />
      <Input
        placeholder={t('trackingNumberPlaceholder')}
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        disabled={isBusy}
      />

      {/* Packaging photos */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-medium text-foreground">{t('shippingPhotos')}</p>
        <p className="text-xs text-muted-foreground">{t('shippingPhotosHint')}</p>

        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5">
            {photos.map((photo, i) => (
              <div key={photo.previewUrl} className="group relative aspect-square overflow-hidden rounded border">
                <Image src={photo.previewUrl} alt="" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={isBusy}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <span className="rounded bg-destructive/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {t('shippingPhotosRemove')}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy || photos.length >= 10}
          onClick={() => inputRef.current?.click()}
        >
          {t('shippingPhotosAdd')}
        </Button>
      </div>

      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      {mutate.error && <p className="text-xs text-destructive">{mutate.error.message}</p>}

      <Button type="submit" size="sm" disabled={isBusy || !carrier || !trackingNumber}>
        {isBusy ? t('shippingSubmitting') : t('shippingSubmit')}
      </Button>
    </form>
  )
}
