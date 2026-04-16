import { db, type NotificationType } from '@artmarket/db'
import { getResend } from './resend'

type NotifyInput = {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
}

const APP_URL = process.env.APP_URL ?? 'https://artmarket.pl'
const FROM = `Artmarket <${process.env.SUPPORT_EMAIL ?? 'onboarding@resend.dev'}>`

export async function notify(input: NotifyInput): Promise<void> {
  // 1. Create in-app notification row
  await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  })

  // 2. Send email — fire and forget (never block the caller)
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { email: true },
  })
  if (!user) return

  const linkHtml = input.link
    ? `<p style="margin-top:16px"><a href="${APP_URL}${input.link}" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:6px">Przejdź →</a></p>`
    : ''

  getResend().emails.send({
    from: FROM,
    to: user.email,
    subject: input.title,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 8px">${input.title}</h2>
      <p style="color:#555;margin:0">${input.body}</p>
      ${linkHtml}
      <p style="color:#bbb;font-size:12px;margin-top:32px">Artmarket — marketplace sztuki oryginalnej</p>
    </div>`,
  }).catch((err: unknown) => {
    console.error('[notify] Email failed:', err)
  })
}
