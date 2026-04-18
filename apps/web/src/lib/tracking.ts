const CARRIER_PATTERNS: { pattern: RegExp; url: (nr: string) => string }[] = [
  {
    pattern: /inpost/i,
    url: (nr) => `https://inpost.pl/sledz-przesylke?number=${encodeURIComponent(nr)}`,
  },
  {
    pattern: /dhl/i,
    url: (nr) => `https://www.dhl.com/pl-en/home/tracking.html?tracking-id=${encodeURIComponent(nr)}`,
  },
  {
    pattern: /dpd/i,
    url: (nr) => `https://www.dpd.com.pl/apps/tracking/#!/show/result/1/${encodeURIComponent(nr)}`,
  },
  {
    pattern: /gls/i,
    url: (nr) => `https://gls-group.eu/track/${encodeURIComponent(nr)}`,
  },
  {
    pattern: /poczta|polska|pp\b/i,
    url: (nr) => `https://emonitoring.poczta-polska.pl/?numer=${encodeURIComponent(nr)}`,
  },
  {
    pattern: /ups/i,
    url: (nr) => `https://www.ups.com/track?tracknum=${encodeURIComponent(nr)}`,
  },
  {
    pattern: /fedex/i,
    url: (nr) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(nr)}`,
  },
]

/** Returns a direct tracking URL for known carriers, or null for unrecognised ones. */
export function getTrackingUrl(carrier: string, trackingNumber: string): string | null {
  const match = CARRIER_PATTERNS.find(({ pattern }) => pattern.test(carrier))
  return match ? match.url(trackingNumber) : null
}
