'use client'

export function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return (
    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {error}
    </p>
  )
}
