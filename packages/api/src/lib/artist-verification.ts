// ASP Warsaw student email domain.
const ASP_DOMAIN = '@asp.waw.pl'

/**
 * Returns true if the email is eligible for artist registration.
 * In development, set BYPASS_ARTIST_VERIFICATION=true to skip the domain check.
 */
export function isEligibleArtistEmail(email: string): boolean {
  if (
    process.env['NODE_ENV'] !== 'production' &&
    process.env['BYPASS_ARTIST_VERIFICATION'] === 'true'
  ) {
    return true
  }
  return email.toLowerCase().endsWith(ASP_DOMAIN)
}
