'use client'

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen relative">
      <div className="bg-orbs" />
      {children}
    </div>
  )
}
