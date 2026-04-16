import { getTranslations } from 'next-intl/server'
import { redirect } from '@/src/i18n/navigation'
import { getSessionUser } from '@/src/lib/data'
import { db } from '@artmarket/db'
import { notFound } from 'next/navigation'
import { ProfileForm } from './profile-form'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const user = await getSessionUser()
  if (!user) {
    redirect({ href: '/auth/sign-in', locale })
    return null
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  })
  if (!dbUser) notFound()

  const t = await getTranslations('account.profile')

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">{t('title')}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{dbUser.email}</p>
      <ProfileForm initialName={dbUser.name} />
    </main>
  )
}
