'use client'

import { useState } from 'react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { trpc } from '@/src/lib/trpc/client'
import { stripePromise } from '@/src/lib/stripe/client'

// Inner form — must be rendered inside <Elements>
function CardForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations('billing')
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const createSetupIntent = trpc.billing.createSetupIntent.useMutation()
  const confirmPaymentMethod = trpc.billing.confirmPaymentMethod.useMutation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setError(null)
    setLoading(true)

    try {
      const { clientSecret } = await createSetupIntent.mutateAsync()

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      })

      if (stripeError) {
        setError(stripeError.message ?? t('cardError'))
        return
      }

      if (setupIntent?.payment_method) {
        await confirmPaymentMethod.mutateAsync({
          paymentMethodId: setupIntent.payment_method as string,
        })
        onSuccess()
      }
    } catch {
      setError(t('cardError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('cardPrompt')}</p>
      <div className="rounded-md border px-3 py-2.5">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '14px',
                color: 'hsl(var(--foreground))',
                '::placeholder': { color: 'hsl(var(--muted-foreground))' },
              },
            },
          }}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? t('saving') : t('saveCard')}
      </Button>
    </form>
  )
}

// Public export — wraps the form in the Stripe Elements provider
export function CardSetupForm({ onSuccess }: { onSuccess: () => void }) {
  return (
    <Elements stripe={stripePromise}>
      <CardForm onSuccess={onSuccess} />
    </Elements>
  )
}
