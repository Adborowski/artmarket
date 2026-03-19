'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArtworkPhotoUpload, type PhotoEntry } from '@/components/artwork-photo-upload'
import { createClient } from '@/src/lib/supabase/client'
import { trpc } from '@/src/lib/trpc/client'

// Supabase Storage bucket: "artworks" (public, authenticated upload)
// Required RLS policies — run in Supabase SQL editor:
//
//   create policy "Authenticated users can upload artwork photos"
//   on storage.objects for insert to authenticated
//   with check (bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text);
//
//   create policy "Public read access for artwork photos"
//   on storage.objects for select to public
//   using (bucket_id = 'artworks');

const currentYear = new Date().getFullYear()

const schema = z.object({
  title: z.string().min(1).max(200),
  medium: z.string().max(100).optional(),
  dimensions: z.string().max(100).optional(),
  year: z.string().optional(),
  description: z.string().max(2000).optional(),
})

type Values = z.infer<typeof schema>

interface Props {
  userId: string
}

export function ArtworkForm({ userId }: Props) {
  const t = useTranslations('artwork.new')
  const router = useRouter()
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const createArtwork = trpc.artwork.create.useMutation({
    onSuccess: () => {
      startTransition(() => router.push('/artworks'))
    },
    onError: () => setUploadError(t('error')),
  })

  const form = useForm<Values>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { title: '', medium: '', dimensions: '', year: '', description: '' },
  })

  async function onSubmit(values: Values) {
    setPhotoError(null)
    setUploadError(null)

    if (photos.length === 0) {
      setPhotoError(t('photosHint'))
      return
    }

    const supabase = createClient()

    // Upload photos directly to Supabase Storage from the browser
    const uploadedPhotos: { storagePath: string; order: number; isPrimary: boolean }[] = []
    for (const [i, photo] of photos.entries()) {
      const ext = photo.file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${crypto.randomUUID()}.${ext}`
      const { data, error } = await supabase.storage.from('artworks').upload(path, photo.file)
      if (error || !data) {
        setUploadError(t('uploadError'))
        return
      }
      uploadedPhotos.push({ storagePath: data.path, order: i, isPrimary: photo.isPrimary })
    }

    const yearNum = values.year ? parseInt(values.year, 10) : undefined
    createArtwork.mutate({
      title: values.title,
      medium: values.medium || undefined,
      dimensions: values.dimensions || undefined,
      year: yearNum && !isNaN(yearNum) && yearNum >= 1800 && yearNum <= currentYear ? yearNum : undefined,
      description: values.description || undefined,
      photos: uploadedPhotos,
    })
  }

  const isBusy = isPending || createArtwork.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('artworkTitle')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="medium"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('medium')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('mediumPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dimensions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('dimensions')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('dimensionsPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem className="w-32">
              <FormLabel>{t('year')}</FormLabel>
              <FormControl>
                <Input type="text" inputMode="numeric" maxLength={4} placeholder={String(currentYear)} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('description')}</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">{t('photos')}</p>
          <p className="text-sm text-muted-foreground">{t('photosHint')}</p>
          <ArtworkPhotoUpload photos={photos} onChange={setPhotos} />
          {photoError && <p className="text-sm text-destructive">{photoError}</p>}
        </div>

        {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

        <Button type="submit" disabled={isBusy}>
          {t('submit')}
        </Button>
      </form>
    </Form>
  )
}
