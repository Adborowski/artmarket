import { SignInForm } from './sign-in-form'

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignInForm locale={locale} />
    </main>
  )
}
