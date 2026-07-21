'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FieldError } from '@/components/FieldError'
import { appointmentSchema } from '@/lib/validators'
import { useZodForm } from '@/hooks/useZodForm'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [form, setForm] = useState({
    patientName: '',
    type: 'CONSULTATION',
    appointmentDate: '',
    duration: '30',
    notes: '',
  })
  const { validate, getFieldError } = useZodForm(appointmentSchema)

  useEffect(() => {
    fetch('/api/patients')
      .then(r => r.ok ? r.json() : [])
      .then(data => setPatients(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validate({ ...form, duration: parseInt(form.duration) })) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: form.patientName,
          duration: parseInt(form.duration),
          type: form.type,
          appointmentDate: form.appointmentDate,
          notes: form.notes || undefined,
        }),
      })

      if (res.ok) {
        router.push('/dashboard/appointments')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to book appointment')
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
        <h1 className="text-2xl font-bold text-white">Book Appointment</h1>
        <p className="text-muted-foreground">Schedule a new appointment</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
          <CardDescription>Enter the appointment information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">{error}</div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Patient Name *</label>
              <Select
                value={form.patientName}
                onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                required
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={`${patient.firstName} ${patient.lastName}`}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </Select>
              {patients.length === 0 && (
                <p className="text-xs text-muted-foreground">No registered patients found. Please register a patient first.</p>
              )}
              <FieldError error={getFieldError('patientName')} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Appointment Type *</label>
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  required
                >
                  <option value="CONSULTATION">Consultation</option>
                  <option value="TREATMENT">Treatment</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="REVIEW">Review</option>
                  <option value="OTHER">Other</option>
                </Select>
                
                <FieldError error={getFieldError('type')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (minutes) *</label>
                <Select
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  required
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </Select>
                <FieldError error={getFieldError('duration')} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date & Time *</label>
              <Input
                type="datetime-local"
                value={form.appointmentDate}
                onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
              <FieldError error={getFieldError('appointmentDate')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
                maxLength={1000}
              />
              <FieldError error={getFieldError('notes')} />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
