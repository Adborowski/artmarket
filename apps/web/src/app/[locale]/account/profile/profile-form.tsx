'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { trpc } from '@/src/lib/trpc/client'

const schema = z.object({ name: z.string().min(1) })
type Values = z.infer<typeof schema>

export function ProfileForm({ initialName }: { initialName: string }) {
  const t = useTranslations('account.profile')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<Values>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { name: initialName },
  })

  const update = trpc.user.updateProfile.useMutation({
    onSuccess: () => setSaved(true),
  })

  function onSubmit(values: Values) {
    setSaved(false)
    startTransition(() => {
      update.mutate({ name: values.name })
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nameLabel')}</FormLabel>
              <FormControl>
                <Input {...field} onChange={(e) => { field.onChange(e); setSaved(false) }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {update.error && <p className="text-sm text-destructive">{t('error')}</p>}
        {saved && <p className="text-sm text-green-600">{t('saved')}</p>}
        <Button type="submit" disabled={update.isPending || isPending}>
          {update.isPending || isPending ? t('saving') : t('save')}
        </Button>
      </form>
    </Form>
  )
}
