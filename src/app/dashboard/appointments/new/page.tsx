'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    patientId: '',
    type: 'CONSULTATION',
    appointmentDate: '',
    duration: '30',
    notes: '',
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients')
      const data = await res.json()
      setPatients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          duration: parseInt(form.duration),
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
              <label className="text-sm font-medium">Patient *</label>
              <Select
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                required
              >
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </Select>
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
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date & Time *</label>
              <Input
                type="datetime-local"
                value={form.appointmentDate}
                onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
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
