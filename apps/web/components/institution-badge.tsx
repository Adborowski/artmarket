import type { Institution } from '@artmarket/institutions'

export function InstitutionBadge({ institution }: { institution: Institution }) {
  return (
    <span
      title={institution.name}
      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
    >
      🎓 {institution.shortName}
    </span>
  )
}
