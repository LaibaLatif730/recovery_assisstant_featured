'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Doctor {
  id: string
  specialty: string | null
  licenseNo: string | null
  isActive: boolean
  createdAt: string
  user: { id: string; name: string; email: string; phone: string | null }
  _count: { treatments: number; appointments: number }
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
    licenseNo: '',
  })

  useEffect(() => { fetchDoctors() }, [])

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors')
      const data = await res.json()
      setDoctors(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to add doctor')
        return
      }

      setForm({ name: '', email: '', password: '', phone: '', specialty: '', licenseNo: '' })
      setShowForm(false)
      fetchDoctors()
    } catch {
      setError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (doctor: Doctor) => {
    try {
      await fetch('/api/doctors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doctor.id, isActive: !doctor.isActive }),
      })
      fetchDoctors()
    } catch (error) {
      console.error('Error toggling doctor:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Doctors</h1>
          <p className="text-muted-foreground">Manage clinic doctors and staff</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
          </svg>
          {showForm ? 'Cancel' : 'Add Doctor'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Doctor</CardTitle>
            <CardDescription>Create a new doctor account with login credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">{error}</div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    placeholder="Dr. Jane Smith"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="doctor@clinic.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password *</label>
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Specialty</label>
                  <Input
                    placeholder="e.g., Dermatology, Plastic Surgery"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">License Number</label>
                  <Input
                    placeholder="Medical license number"
                    value={form.licenseNo}
                    onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Doctor Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-8">
              <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-muted-foreground mb-4">No doctors registered yet</p>
              <Button onClick={() => setShowForm(true)}>Add your first doctor</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {doctor.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{doctor.user.name}</h3>
                      <p className="text-sm text-muted-foreground">{doctor.user.email}</p>
                      {doctor.specialty && (
                        <p className="text-xs text-muted-foreground mt-0.5">{doctor.specialty}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <p className="text-white">{doctor._count.treatments} treatments</p>
                      <p className="text-muted-foreground">{doctor._count.appointments} appointments</p>
                    </div>
                    <Badge variant={doctor.isActive ? 'outline' : 'destructive'}>
                      {doctor.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(doctor)}
                    >
                      {doctor.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
