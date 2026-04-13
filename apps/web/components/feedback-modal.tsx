'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { trpc } from '@/src/lib/trpc/client'
import { createClient } from '@/src/lib/supabase/client'

type FeedbackType = 'problem' | 'feature'

export function FeedbackModal({ trigger }: { trigger: React.ReactNode }) {
  const t = useTranslations('feedback')
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('problem')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
    })
  }, [open])

  const submit = trpc.feedback.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Reset after close animation
      setTimeout(() => {
        setSubmitted(false)
        setType('problem')
        setSubject('')
        setDescription('')
      }, 200)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit.mutate({ type, subject, description, email })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <p className="font-medium">{t('successTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('successBody')}</p>
            <Button variant="outline" className="mt-4" onClick={() => handleOpenChange(false)}>
              {t('close')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type toggle */}
            <div className="flex rounded-lg border p-1 gap-1">
              <button
                type="button"
                onClick={() => setType('problem')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  type === 'problem'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('typeProblem')}
              </button>
              <button
                type="button"
                onClick={() => setType('feature')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  type === 'feature'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('typeFeature')}
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-subject">{t('subject')}</Label>
              <Input
                id="fb-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-description">{t('description')}</Label>
              <Textarea
                id="fb-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                maxLength={5000}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-email">{t('email')}</Label>
              <Input
                id="fb-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {submit.error && (
              <p className="text-sm text-destructive">{t('error')}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={submit.isPending}>
                {submit.isPending ? t('sending') : t('send')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
