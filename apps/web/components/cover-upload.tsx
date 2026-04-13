'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/src/lib/supabase/client'
import { updateCoverUrl } from '@/src/lib/profile/actions'

type Props = {
  userId: string
  currentCoverUrl: string | null
  changeCoverLabel: string
  uploadErrorLabel: string
}

export function CoverUpload({ userId, currentCoverUrl, changeCoverLabel, uploadErrorLabel }: Props) {
  const [coverUrl, setCoverUrl] = useState(currentCoverUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/cover.${ext}`

    const { data, error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError || !data) {
      setError(uploadErrorLabel)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('artworks').getPublicUrl(data.path)

    await updateCoverUrl(publicUrl)
    setCoverUrl(publicUrl)
    setUploading(false)
  }

  return (
    <div className="relative h-48 w-full sm:h-56 overflow-hidden rounded-2xl bg-muted">
      {coverUrl ? (
        <Image src={coverUrl} alt="Cover" fill className="object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 flex items-end justify-end bg-black/0 p-4 opacity-0 transition-all hover:bg-black/30 hover:opacity-100"
        aria-label={changeCoverLabel}
      >
        <span className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          {uploading ? '…' : changeCoverLabel}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-destructive/90 px-2 py-1 text-xs text-destructive-foreground">
          {error}
        </p>
      )}
    </div>
  )
}
