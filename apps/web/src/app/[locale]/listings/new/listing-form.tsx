'use client'

import { useForm, useWatch } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/src/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { trpc } from '@/src/lib/trpc/client'
import { useState } from 'react'

const PLATFORM_FEE = 0.10

const schema = z.object({
  startPrice: z.string().min(1),
  reservePrice: z.string().optional(),
  durationDays: z.enum(['1', '7', '14', '30']),
})

type Values = z.infer<typeof schema>

export function ListingForm({ artworkId }: { artworkId: string }) {
  const t = useTranslations('listing.new')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<Values>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { startPrice: '', reservePrice: '', durationDays: '14' },
  })

  const startPriceValue = useWatch({ control: form.control, name: 'startPrice' })
  const startPriceNum = parseInt(startPriceValue, 10)
  const previewPrice = Number.isFinite(startPriceNum) && startPriceNum > 0 ? startPriceNum : null

  const create = trpc.listing.create.useMutation({
    onSuccess: (data) => router.push(`/listings/${data.id}`),
    onError: () => setError(t('error')),
  })

  function onSubmit(values: Values) {
    setError(null)
    create.mutate({
      artworkId,
      startPrice: parseInt(values.startPrice, 10),
      reservePrice: values.reservePrice ? parseInt(values.reservePrice, 10) : undefined,
      durationDays: parseInt(values.durationDays, 10) as 1 | 7 | 14 | 30,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="startPrice" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('startPrice')}</FormLabel>
            <FormControl><Input type="number" min={1} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="reservePrice" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('reservePrice')}</FormLabel>
            <FormControl><Input type="number" min={1} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {/* Fee breakdown */}
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm space-y-1.5">
          <p className="font-medium">{t('feeStructureTitle')}</p>
          <div className="flex justify-between text-muted-foreground">
            <span>{t('feePlatform')}</span>
            <span>10%</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t('feeStripe')}</span>
            <span>{t('feeStripeIncluded')}</span>
          </div>
          <div className="border-t pt-1.5 flex justify-between font-medium">
            <span>{t('feeYouReceive')}</span>
            <span>
              {previewPrice !== null
                ? `${Math.round(previewPrice * (1 - PLATFORM_FEE)).toLocaleString('pl-PL')} PLN`
                : '90%'}
            </span>
          </div>
        </div>

        <FormField control={form.control} name="durationDays" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('duration')}</FormLabel>
            <FormControl>
              <select className="w-full rounded-md border px-3 py-2 text-sm" {...field}>
                <option value="1">{t('duration1')}</option>
                <option value="7">{t('duration7')}</option>
                <option value="14">{t('duration14')}</option>
                <option value="30">{t('duration30')}</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={create.isPending}>
          {t('submit')}
        </Button>
      </form>
    </Form>
  )
}
