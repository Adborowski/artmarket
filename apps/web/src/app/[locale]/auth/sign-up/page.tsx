import { SignUpForm } from './sign-up-form'

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignUpForm locale={locale} />
    </main>
  )
}
