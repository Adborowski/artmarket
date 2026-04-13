import { loadStripe } from '@stripe/stripe-js'

// Singleton promise — loadStripe is called only once across the app lifetime.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

export { stripePromise }
