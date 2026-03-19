'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export interface PhotoEntry {
  file: File
  previewUrl: string
  isPrimary: boolean
}

interface Props {
  photos: PhotoEntry[]
  onChange: (photos: PhotoEntry[]) => void
}

export function ArtworkPhotoUpload({ photos, onChange }: Props) {
  const t = useTranslations('artwork.new')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const newEntries: PhotoEntry[] = Array.from(files).map((file, i) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: photos.length === 0 && i === 0,
    }))
    onChange([...photos, ...newEntries])
  }

  function remove(index: number) {
    const next = photos.filter((_, i) => i !== index)
    // Ensure there's always a primary if photos remain
    if (next.length > 0 && !next.some((p) => p.isPrimary)) {
      next[0]!.isPrimary = true
    }
    onChange(next)
  }

  function setPrimary(index: number) {
    onChange(photos.map((p, i) => ({ ...p, isPrimary: i === index })))
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, i) => (
            <div key={photo.previewUrl} className="group relative aspect-square overflow-hidden rounded-md border">
              <Image
                src={photo.previewUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              {photo.isPrimary && (
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
                  {t('primaryBadge')}
                </span>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {!photo.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    className="rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-black"
                  >
                    {t('setPrimary')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded bg-destructive/90 px-2 py-0.5 text-xs font-medium text-white"
                >
                  {t('removePhoto')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
      >
        {t('addPhotos')}
      </Button>
    </div>
  )
}
