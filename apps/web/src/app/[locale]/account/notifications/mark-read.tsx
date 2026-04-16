'use client'

import { useEffect } from 'react'
import { trpc } from '@/src/lib/trpc/client'

export function MarkAllReadOnMount() {
  const markAllRead = trpc.notification.markAllRead.useMutation()

  useEffect(() => {
    markAllRead.mutate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
