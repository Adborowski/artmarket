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

export function DisputeChat({
  disputeId,
  initialMessages,
  currentUserId,
  isResolved,
}: {
  disputeId: string
  initialMessages: DisputeMessage[]
  currentUserId: string
  isResolved: boolean
}) {
  const t = useTranslations('dispute')
  const [messages, setMessages] = useState<DisputeMessage[]>(initialMessages)
  const [body, setBody] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { refetch } = trpc.dispute.getById.useQuery(
    { disputeId },
    { enabled: false },
  )

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime — new messages from the other party
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`dispute:${disputeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'DisputeMessage',
        filter: `disputeId=eq.${disputeId}`,
      }, async () => {
        const result = await refetch()
        if (result.data) setMessages(result.data.messages)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [disputeId])

  const sendMessage = trpc.dispute.sendMessage.useMutation({
    onSuccess: async () => {
      setBody('')
      const result = await refetch()
      if (result.data) setMessages(result.data.messages)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    sendMessage.mutate({ disputeId, body: body.trim() })
  }

  return (
    <div className="flex flex-col gap-4">
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
      {!isResolved && (
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
