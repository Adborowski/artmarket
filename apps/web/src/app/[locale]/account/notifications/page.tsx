import { getTranslations } from 'next-intl/server'
import { redirect } from '@/src/i18n/navigation'
import { getSessionUser } from '@/src/lib/data'
import { db } from '@artmarket/db'
import { MarkAllReadOnMount } from './mark-read'

export default async function NotificationsPage({
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

  const [t, notifications] = await Promise.all([
    getTranslations('notifications'),
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <MarkAllReadOnMount />
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border p-4 transition-colors ${
                !n.read ? 'border-foreground/20 bg-muted/50' : ''
              }`}
            >
              {n.link ? (
                <a href={n.link} className="block group">
                  <p className={`text-sm font-medium group-hover:underline ${!n.read ? 'text-foreground' : 'text-foreground'}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    {n.createdAt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </a>
              ) : (
                <>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    {n.createdAt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
