'use client'

import { useState, useEffect } from 'react'

function getTimeLeft(endsAt: Date) {
  const total = endsAt.getTime() - Date.now()
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  }
}

export function Countdown({ endsAt, endedLabel }: { endsAt: Date; endedLabel: string }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endsAt))

  useEffect(() => {
    if (timeLeft.total <= 0) return
    const timer = setInterval(() => setTimeLeft(getTimeLeft(endsAt)), 1000)
    return () => clearInterval(timer)
  }, [endsAt])

  if (timeLeft.total <= 0) return <p className="text-lg font-semibold text-muted-foreground">{endedLabel}</p>

  return (
    <p className="text-xl font-bold tabular-nums">
      {timeLeft.days > 0 && `${timeLeft.days}d `}
      {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </p>
  )
}
