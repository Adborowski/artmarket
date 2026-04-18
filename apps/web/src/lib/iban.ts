/**
 * Validates an IBAN using format check + MOD-97 checksum (ISO 13616).
 * Accepts spaces (normalised internally).
 */
export function isValidIban(raw: string): boolean {
  const iban = raw.replace(/\s+/g, '').toUpperCase()

  if (iban.length < 15 || iban.length > 34) return false
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false

  // Move first 4 chars to the end, then convert letters → digits (A=10 … Z=35)
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  const numeric = rearranged
    .split('')
    .map((c) => (c >= 'A' ? (c.charCodeAt(0) - 55).toString() : c))
    .join('')

  // MOD-97 on a large number — process in chunks to avoid overflow
  let remainder = 0
  for (const ch of numeric) {
    remainder = (remainder * 10 + parseInt(ch, 10)) % 97
  }

  return remainder === 1
}
