'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime } from '@/lib/utils'

interface Appointment {
  id: string
  appointmentDate: string
  duration: number
  type: string
  status: string
  notes: string
  patient: { id: string; firstName: string; lastName: string; phone: string }
  doctor: { user: { name: string } } | null
}

const APPOINTMENT_TYPES = ['CONSULTATION', 'TREATMENT', 'FOLLOW_UP', 'REVIEW', 'EMERGENCY', 'OTHER']

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [editForm, setEditForm] = useState({
    appointmentDate: '', duration: '', type: '', notes: '', status: ''
  })
  const [error, setError] = useState('')
  const [showSlotSuggestion, setShowSlotSuggestion] = useState(false)
  const [slotForm, setSlotForm] = useState({ date: '', doctorId: '', duration: '30' })
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async (date?: string) => {
    try {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      const url = date ? `/api/appointments?${params}` : '/api/appointments'
      const res = await fetch(url)
      const data = await res.json()
      setAppointments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateFilter = (date: string) => {
    setDateFilter(date)
    fetchAppointments(date || undefined)
  }

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setEditForm({
      appointmentDate: appointment.appointmentDate ? new Date(appointment.appointmentDate).toISOString().slice(0, 16) : '',
      duration: appointment.duration?.toString() || '30',
      type: appointment.type,
      notes: appointment.notes || '',
      status: appointment.status,
    })
  }

  const handleUpdate = async () => {
    setError('')
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAppointment?.id,
          ...editForm,
          duration: parseInt(editForm.duration) || 30,
        }),
      })
      if (res.ok) {
        setEditingAppointment(null)
        fetchAppointments(dateFilter || undefined)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update appointment')
      }
    } catch {
      setError('Failed to update appointment')
    }
  }

  const handleConfirm = async (id: string) => {
    setError('')
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'CONFIRMED' }),
      })
      if (res.ok) fetchAppointments(dateFilter || undefined)
      else setError('Failed to confirm appointment')
    } catch {
      setError('Failed to confirm appointment')
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    setError('')
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'CANCELLED' }),
      })
      if (res.ok) fetchAppointments(dateFilter || undefined)
      else setError('Failed to cancel appointment')
    } catch {
      setError('Failed to cancel appointment')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this appointment?')) return
    setError('')
    try {
      const res = await fetch(`/api/appointments?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchAppointments(dateFilter || undefined)
      else setError('Failed to delete appointment')
    } catch {
      setError('Failed to delete appointment')
    }
  }

  const fetchAvailableSlots = async () => {
    if (!slotForm.date) return
    setLoadingSlots(true)
    try {
      const params = new URLSearchParams({ date: slotForm.date, duration: slotForm.duration })
      if (slotForm.doctorId) params.set('doctorId', slotForm.doctorId)
      const res = await fetch(`/api/ai/suggest-slots?${params}`)
      const data = await res.json()
      if (res.ok) setAvailableSlots(data.availableSlots)
    } catch {}
    finally { setLoadingSlots(false) }
  }

  const filteredAppointments = appointments
    .filter(a => filter === 'ALL' || a.status === filter)
    .filter(a => {
      if (!dateFilter) return true
      const aptDate = new Date(a.appointmentDate).toISOString().slice(0, 10)
      return aptDate === dateFilter
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'default'
      case 'COMPLETED': return 'default'
      case 'CANCELLED': return 'destructive'
      case 'NO_SHOW': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-muted-foreground">Manage patient appointments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSlotSuggestion(!showSlotSuggestion)}>
            {showSlotSuggestion ? 'Cancel' : 'Suggest Slots'}
          </Button>
          <Link href="/dashboard/appointments/new">
            <Button>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      {showSlotSuggestion && (
        <Card>
          <CardHeader>
            <CardTitle>AI Slot Suggestion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Date</label>
                <Input type="date" value={slotForm.date} onChange={e => setSlotForm({...slotForm, date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Duration (min)</label>
                <Input type="number" value={slotForm.duration} onChange={e => setSlotForm({...slotForm, duration: e.target.value})} className="w-20" />
              </div>
              <Button onClick={fetchAvailableSlots} disabled={loadingSlots || !slotForm.date}>
                {loadingSlots ? 'Finding...' : 'Find Slots'}
              </Button>
            </div>
            {availableSlots.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Available slots on {slotForm.date}:</p>
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map(slot => (
                    <Badge key={slot} variant="outline" className="cursor-pointer hover:bg-primary/20">{slot}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}
      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Appointment</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date & Time</label>
                <Input type="datetime-local" value={editForm.appointmentDate} onChange={(e) => setEditForm({ ...editForm, appointmentDate: e.target.value })} min={new Date().toISOString().slice(0, 16)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (min)</label>
                <Input type="number" min="15" max="180" value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                  {APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} />
            </div>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['ALL', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
                <Badge
                  key={status}
                  variant={
                    filter === status ? 'default' :
                    status === 'CANCELLED' ? 'destructive' :
                    status === 'COMPLETED' ? 'secondary' : 'outline'
                  }
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => setFilter(status)}
                >
                  {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Filter by date:</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => handleDateFilter(e.target.value)}
                className="w-40"
              />
              {dateFilter && (
                <Button variant="ghost" size="sm" onClick={() => handleDateFilter('')}>Clear</Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No appointments scheduled</p>
              <Link href="/dashboard/appointments/new" className="mt-4 inline-block">
                <Button>Book your first appointment</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="p-4 border rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {appointment.type.replace(/_/g, ' ')} • {appointment.duration} min
                        </p>
                        {appointment.doctor && (
                          <p className="text-sm text-muted-foreground">
                            Dr. {appointment.doctor.user.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatDateTime(appointment.appointmentDate)}</p>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground max-w-xs truncate">{appointment.notes}</p>
                        )}
                      </div>
                      <Badge variant={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(appointment)}>Edit</Button>
                    {appointment.status === 'SCHEDULED' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleConfirm(appointment.id)}>Confirm</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleCancel(appointment.id)}>Cancel</Button>
                      </>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(appointment.id)}>Delete</Button>
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
