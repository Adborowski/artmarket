'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/src/lib/supabase/client'
import { updateAvatarUrl } from '@/src/lib/profile/actions'

type Props = {
  userId: string
  name: string
  currentAvatarUrl: string | null
  changePhotoLabel: string
  uploadErrorLabel: string
}

export function AvatarUpload({ userId, name, currentAvatarUrl, changePhotoLabel, uploadErrorLabel }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
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
    const path = `${userId}/avatar.${ext}`

    const { data, error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError || !data) {
      setError(uploadErrorLabel)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('artworks').getPublicUrl(data.path)

    await updateAvatarUrl(publicUrl)
    setAvatarUrl(publicUrl)
    setUploading(false)
  }

  return (
    <div className="relative h-32 w-32 shrink-0">
      <div className="relative h-32 w-32 overflow-hidden rounded-full bg-muted ring-4 ring-border">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground">
            {name[0]}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 flex items-end justify-center rounded-full bg-black/0 pb-2 opacity-0 transition-all hover:bg-black/40 hover:opacity-100"
        aria-label={changePhotoLabel}
      >
        <span className="text-xs font-medium text-white drop-shadow">
          {uploading ? '…' : changePhotoLabel}
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
        <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
