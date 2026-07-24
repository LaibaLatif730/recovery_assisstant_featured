'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FieldError } from '@/components/FieldError'
import { patientSchema } from '@/lib/validators'
import { useZodForm } from '@/hooks/useZodForm'

export default function NewPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    medicalHistory: '',
    allergies: '',
    initialPassword: '',
  })

  const { validate, errors } = useZodForm(patientSchema)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.role === 'DOCTOR' || d?.role === 'RECEPTIONIST') {
          setAuthorized(true)
        } else {
          router.replace('/dashboard/patients')
        }
      })
      .catch(() => router.replace('/dashboard/patients'))
  }, [router])

  if (!authorized) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const validation = validate(form)
    if (!validation) {
      const firstError = Object.values(errors)[0]
      setError(firstError || 'Please fix the form errors')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/dashboard/patients')
      } else {
        setError(data.error || 'Failed to create patient')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Add New Patient</h1>
        <p className="text-muted-foreground">Register a new patient in the system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>Enter the patient&apos;s details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">{error}</div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="e.g., John"
                  required
                />
                <FieldError error={errors.firstName} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="e.g., Smith"
                  required
                />
                <FieldError error={errors.lastName} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="patient@email.com"
                />
                <FieldError error={errors.email} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Digits only, 7-15 characters"
                />
                <FieldError error={errors.phone} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Birth</label>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
                <FieldError error={errors.dateOfBirth} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender</label>
                <Select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                maxLength={200}
              />
              <FieldError error={errors.address} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Medical History</label>
              <Textarea
                value={form.medicalHistory}
                onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                placeholder="Any relevant medical conditions..."
                rows={3}
                maxLength={1000}
              />
              <FieldError error={errors.medicalHistory} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Allergies</label>
              <Input
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                placeholder="Known allergies..."
                maxLength={500}
              />
              <FieldError error={errors.allergies} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Password (for patient portal)</label>
              <Input
                type="password"
                value={form.initialPassword}
                onChange={(e) => setForm({ ...form, initialPassword: e.target.value })}
                placeholder="Min 6 characters"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Patient can log in with their email and this password</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Patient'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
