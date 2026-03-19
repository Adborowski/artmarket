'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Link } from '@/src/i18n/navigation'
import { signIn } from '@/src/lib/auth/actions'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type Values = z.infer<typeof schema>

export function SignInForm({ locale }: { locale: string }) {
  const t = useTranslations('auth')
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<Values>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: Values) {
    setServerError(null)
    startTransition(async () => {
      const result = await signIn(locale, values.email, values.password)
      if (result?.error) setServerError(t('signIn.error'))
    })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t('signIn.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('emailPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('password')}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {t('signIn.submit')}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('signIn.noAccount')}{' '}
          <Link href="/auth/sign-up" className="underline underline-offset-4">
            {t('signIn.signUpLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
