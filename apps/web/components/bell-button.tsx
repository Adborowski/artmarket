'use client'

// NOTE: Live bell updates require enabling Realtime on the Notification table.
// Run in Supabase SQL editor:
//   ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Link } from '@/src/i18n/navigation'
import { createClient } from '@/src/lib/supabase/client'

export function BellButton({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return

      channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'Notification',
          filter: `userId=eq.${data.user.id}`,
        }, () => {
          setCount((c) => c + 1)
        })
        .subscribe()
    })

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Link
      href="/account/notifications"
      className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label="Powiadomienia"
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
