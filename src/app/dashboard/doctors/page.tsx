'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FieldError } from '@/components/FieldError'
import { registerSchema } from '@/lib/validators'
import { useZodForm } from '@/hooks/useZodForm'

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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', specialty: '', licenseNo: '' })
  const [deleting, setDeleting] = useState<string | null>(null)

  const { validate, getFieldError } = useZodForm(registerSchema)

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

    if (!validate({ name: form.name, email: form.email, password: form.password, phone: form.phone || undefined })) {
      setSubmitting(false)
      return
    }

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

  const startEdit = (doctor: Doctor) => {
    setEditForm({
      name: doctor.user.name || '',
      email: doctor.user.email || '',
      phone: doctor.user.phone || '',
      specialty: doctor.specialty || '',
      licenseNo: doctor.licenseNo || '',
    })
    setEditingId(doctor.id)
  }

  const saveEdit = async (id: string) => {
    try {
      await fetch('/api/doctors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      })
      setEditingId(null)
      fetchDoctors()
    } catch (error) {
      console.error('Error saving doctor:', error)
    }
  }

  const deleteDoctor = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/doctors?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.deactivated) {
        alert('Doctor has existing records and was deactivated instead of deleted.')
      }
      fetchDoctors()
    } catch (error) {
      console.error('Error deleting doctor:', error)
    } finally {
      setDeleting(null)
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
                  <FieldError error={getFieldError('name')} />
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
                  <FieldError error={getFieldError('email')} />
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
                  <FieldError error={getFieldError('password')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    type="tel"
                    placeholder="Digits only, 7-15 characters"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <FieldError error={getFieldError('phone')} />
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
                <div key={doctor.id} className="rounded-lg border overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === doctor.id ? null : doctor.id)}
                  >
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
                      <svg className={`w-5 h-5 text-muted-foreground transition-transform ${expandedId === doctor.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {expandedId === doctor.id && (
                    <div className="px-4 pb-4 pt-0 border-t bg-white/5 space-y-3">
                      {editingId === doctor.id ? (
                        <div className="grid grid-cols-2 gap-3 text-sm pt-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Name</label>
                            <input className="w-full mt-1 p-2 rounded-md bg-white/5 border border-white/10 text-white text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Email</label>
                            <input className="w-full mt-1 p-2 rounded-md bg-white/5 border border-white/10 text-white text-sm" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Phone</label>
                            <input className="w-full mt-1 p-2 rounded-md bg-white/5 border border-white/10 text-white text-sm" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Specialty</label>
                            <input className="w-full mt-1 p-2 rounded-md bg-white/5 border border-white/10 text-white text-sm" value={editForm.specialty} onChange={e => setEditForm({...editForm, specialty: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">License No</label>
                            <input className="w-full mt-1 p-2 rounded-md bg-white/5 border border-white/10 text-white text-sm" value={editForm.licenseNo} onChange={e => setEditForm({...editForm, licenseNo: e.target.value})} />
                          </div>
                          <div className="flex items-end gap-2">
                            <Button size="sm" onClick={() => saveEdit(doctor.id)}>Save</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3 text-sm pt-3">
                            <div>
                              <span className="text-muted-foreground">Phone:</span>
                              <span className="ml-2 text-white">{doctor.user.phone || 'Not provided'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">License:</span>
                              <span className="ml-2 text-white">{doctor.licenseNo || 'Not provided'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Specialty:</span>
                              <span className="ml-2 text-white">{doctor.specialty || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Joined:</span>
                              <span className="ml-2 text-white">{new Date(doctor.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status:</span>
                              <span className={`ml-2 ${doctor.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                {doctor.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">User ID:</span>
                              <span className="ml-2 text-white font-mono text-xs">{doctor.user.id}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(doctor)}>
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => toggleActive(doctor)}>
                              {doctor.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            {doctor._count.treatments === 0 && doctor._count.appointments === 0 && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={deleting === doctor.id}
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${doctor.user.name}?`)) {
                                    deleteDoctor(doctor.id)
                                  }
                                }}
                              >
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {deleting === doctor.id ? 'Deleting...' : 'Delete'}
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
