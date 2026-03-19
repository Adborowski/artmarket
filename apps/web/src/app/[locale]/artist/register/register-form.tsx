'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/src/lib/trpc/client'

const schema = z.object({
  bio: z.string().max(1000).optional(),
})

type Values = z.infer<typeof schema>

export function RegisterArtistForm() {
  const t = useTranslations('artist.register')
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const register = trpc.artist.register.useMutation({
    onSuccess: () => {
      startTransition(() => router.push('/artworks'))
    },
    onError: () => setServerError(t('error')),
  })

  const form = useForm<Values>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { bio: '' },
  })

  function onSubmit(values: Values) {
    setServerError(null)
    register.mutate({ bio: values.bio || undefined })
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bio')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('bioPlaceholder')}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <Button type="submit" className="w-full" disabled={isPending || register.isPending}>
              {t('submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
