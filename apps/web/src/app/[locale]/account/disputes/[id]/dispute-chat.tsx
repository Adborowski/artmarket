'use client'

// NOTE: Live message delivery requires enabling Realtime on the DisputeMessage table.
// Run in Supabase SQL editor:
//   ALTER PUBLICATION supabase_realtime ADD TABLE "DisputeMessage";

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/src/lib/trpc/client'
import { createClient } from '@/src/lib/supabase/client'
import type { DisputeMessage } from '@artmarket/api'

type DisputeStatus = 'OPEN' | 'PENDING_REFUND_OFFER' | 'ESCALATED' | 'RESOLVED'
type UserRole = 'buyer' | 'artist' | 'admin'

export function DisputeChat({
  disputeId,
  initialMessages,
  currentUserId,
  initialStatus,
  resolvedOutcome,
  userRole,
}: {
  disputeId: string
  initialMessages: DisputeMessage[]
  currentUserId: string
  initialStatus: DisputeStatus
  resolvedOutcome: string | null
  userRole: UserRole
}) {
  const t = useTranslations('dispute')
  const [messages, setMessages] = useState<DisputeMessage[]>(initialMessages)
  const [status, setStatus] = useState<DisputeStatus>(initialStatus)
  const [body, setBody] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { refetch } = trpc.dispute.getById.useQuery(
    { disputeId },
    { enabled: false },
  )

  async function refreshDispute() {
    const result = await refetch()
    if (result.data) {
      setMessages(result.data.messages)
      setStatus(result.data.status as DisputeStatus)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`dispute:${disputeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'DisputeMessage',
        filter: `disputeId=eq.${disputeId}`,
      }, async () => { await refreshDispute() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [disputeId])

  const sendMessage = trpc.dispute.sendMessage.useMutation({
    onSuccess: async () => {
      setBody('')
      await refreshDispute()
    },
  })

  const releaseFunds = trpc.dispute.releaseFunds.useMutation({ onSuccess: refreshDispute })
  const offerRefund = trpc.dispute.offerRefund.useMutation({ onSuccess: refreshDispute })
  const confirmRefund = trpc.dispute.confirmRefund.useMutation({ onSuccess: refreshDispute })
  const rejectRefund = trpc.dispute.rejectRefund.useMutation({ onSuccess: refreshDispute })
  const escalate = trpc.dispute.escalate.useMutation({ onSuccess: refreshDispute })
  const adminResolve = trpc.dispute.adminResolve.useMutation({ onSuccess: refreshDispute })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    sendMessage.mutate({ disputeId, body: body.trim() })
  }

  const isResolved = status === 'RESOLVED'

  return (
    <div className="flex flex-col gap-4">
      {/* Status action panel */}
      {!isResolved && (
        <ActionPanel
          disputeId={disputeId}
          status={status}
          userRole={userRole}
          releaseFunds={releaseFunds}
          offerRefund={offerRefund}
          confirmRefund={confirmRefund}
          rejectRefund={rejectRefund}
          escalate={escalate}
          adminResolve={adminResolve}
          t={t}
        />
      )}

      {isResolved && resolvedOutcome && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {resolvedOutcome === 'RELEASED' ? t('outcomeReleased') : t('outcomeRefunded')}
        </div>
      )}

      {/* Message list */}
      <div className="flex flex-col gap-3 rounded-lg border p-4 min-h-64 max-h-[32rem] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender.id === currentUserId
            return (
              <div key={msg.id} className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-muted-foreground">
                  {isOwn ? t('you') : msg.sender.name}
                </span>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  isOwn
                    ? 'bg-foreground text-background rounded-br-sm'
                    : 'bg-muted rounded-bl-sm'
                }`}>
                  {msg.body}
                </div>
                <span className="text-xs text-muted-foreground/60">
                  {new Date(msg.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isResolved && status !== 'ESCALATED' && userRole !== 'admin' && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('messagePlaceholder')}
            rows={2}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" disabled={sendMessage.isPending || !body.trim()} className="self-end">
            {sendMessage.isPending ? t('sending') : t('send')}
          </Button>
        </form>
      )}
    </div>
  )
}

function ActionPanel({
  disputeId,
  status,
  userRole,
  releaseFunds,
  offerRefund,
  confirmRefund,
  rejectRefund,
  escalate,
  adminResolve,
  t,
}: {
  disputeId: string
  status: DisputeStatus
  userRole: UserRole
  releaseFunds: ReturnType<typeof trpc.dispute.releaseFunds.useMutation>
  offerRefund: ReturnType<typeof trpc.dispute.offerRefund.useMutation>
  confirmRefund: ReturnType<typeof trpc.dispute.confirmRefund.useMutation>
  rejectRefund: ReturnType<typeof trpc.dispute.rejectRefund.useMutation>
  escalate: ReturnType<typeof trpc.dispute.escalate.useMutation>
  adminResolve: ReturnType<typeof trpc.dispute.adminResolve.useMutation>
  t: ReturnType<typeof useTranslations<'dispute'>>
}) {
  const busy =
    releaseFunds.isPending || offerRefund.isPending || confirmRefund.isPending ||
    rejectRefund.isPending || escalate.isPending || adminResolve.isPending

  if (status === 'ESCALATED') {
    if (userRole === 'admin') {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-sm font-medium text-red-800">{t('adminResolve')}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => adminResolve.mutate({ disputeId, outcome: 'RELEASED' })}
            >
              {t('adminRelease')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              disabled={busy}
              onClick={() => adminResolve.mutate({ disputeId, outcome: 'REFUNDED' })}
            >
              {t('adminRefund')}
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {t('waitingAdmin')}
      </div>
    )
  }

  if (status === 'PENDING_REFUND_OFFER') {
    if (userRole === 'buyer') {
      return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <p className="text-sm font-medium text-blue-800">{t('pendingRefundOffer')}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => confirmRefund.mutate({ disputeId })}
            >
              {t('confirmRefund')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => rejectRefund.mutate({ disputeId })}
            >
              {t('rejectRefund')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50 ml-auto"
              disabled={busy}
              onClick={() => escalate.mutate({ disputeId })}
            >
              {t('escalate')}
            </Button>
          </div>
        </div>
      )
    }
    if (userRole === 'artist') {
      return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {t('waitingForBuyer')}
        </div>
      )
    }
    // admin can still resolve
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
        <p className="text-sm font-medium text-red-800">{t('adminResolve')}</p>
        <div className="flex gap-2">
          <Button size="sm" disabled={busy} onClick={() => adminResolve.mutate({ disputeId, outcome: 'RELEASED' })}>
            {t('adminRelease')}
          </Button>
          <Button
            size="sm" variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            disabled={busy}
            onClick={() => adminResolve.mutate({ disputeId, outcome: 'REFUNDED' })}
          >
            {t('adminRefund')}
          </Button>
        </div>
      </div>
    )
  }

  // OPEN state
  if (userRole === 'buyer') {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">{t('actionsTitle')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={busy}
            onClick={() => releaseFunds.mutate({ disputeId })}
          >
            {t('releaseFunds')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-200 text-amber-700 hover:bg-amber-50 ml-auto"
            disabled={busy}
            onClick={() => escalate.mutate({ disputeId })}
          >
            {t('escalate')}
          </Button>
        </div>
      </div>
    )
  }

  if (userRole === 'artist') {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">{t('actionsTitle')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            disabled={busy}
            onClick={() => offerRefund.mutate({ disputeId })}
          >
            {t('offerRefund')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-200 text-amber-700 hover:bg-amber-50 ml-auto"
            disabled={busy}
            onClick={() => escalate.mutate({ disputeId })}
          >
            {t('escalate')}
          </Button>
        </div>
      </div>
    )
  }

  // admin, OPEN state
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-sm font-medium text-red-800">{t('adminResolve')}</p>
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => adminResolve.mutate({ disputeId, outcome: 'RELEASED' })}>
          {t('adminRelease')}
        </Button>
        <Button
          size="sm" variant="outline"
          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          disabled={busy}
          onClick={() => adminResolve.mutate({ disputeId, outcome: 'REFUNDED' })}
        >
          {t('adminRefund')}
        </Button>
      </div>
    </div>
  )
}
