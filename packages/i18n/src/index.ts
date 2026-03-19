// Shared translation keys and types used by both web (next-intl) and mobile (i18next).
// Actual translation strings live in:
//   apps/web/messages/{pl,en}.json
//   apps/mobile/locales/{pl,en}.json
//
// This package exports the shared key type so both apps stay in sync.

export type Locale = 'pl' | 'en'
export const locales: Locale[] = ['pl', 'en']
export const defaultLocale: Locale = 'pl'
