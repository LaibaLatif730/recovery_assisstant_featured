'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Appointment {
  id: string
  appointmentDate: string
  duration: number
  type: string
  status: string
  notes: string | null
  rejectionReason: string | null
  doctor: { user: { name: string } } | null
}

const APPOINTMENT_TYPES = ['CONSULTATION', 'TREATMENT', 'FOLLOW_UP', 'REVIEW', 'OTHER']

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PatientAppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    appointmentDate: '',
    duration: '30',
    type: 'CONSULTATION',
    notes: '',
  })

  useEffect(() => {
    fetch('/api/patient/data')
      .then(r => { if (!r.ok) router.push('/patient/login') })
      .catch(() => router.push('/patient/login'))
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/patient/appointments')
      if (res.ok) {
        const data = await res.json()
        setAppointments(Array.isArray(data) ? data : [])
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/patient/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentDate: form.appointmentDate,
          duration: parseInt(form.duration),
          type: form.type,
          notes: form.notes || undefined,
        }),
      })

      if (res.ok) {
        setSuccess('Appointment request submitted! A receptionist will review it shortly.')
        setShowForm(false)
        setForm({ appointmentDate: '', duration: '30', type: 'CONSULTATION', notes: '' })
        fetchAppointments()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit request')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'PENDING_APPROVAL': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'CANCELLED': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default: return 'bg-white/10 text-white/60 border-white/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL': return 'Pending Approval'
      case 'CONFIRMED': return 'Confirmed'
      case 'CANCELLED': return 'Rejected'
      case 'COMPLETED': return 'Completed'
      default: return status.replace(/_/g, ' ')
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="bg-orbs" />

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Appointments</h1>
            <p className="text-white/60 mt-1">Request and manage your appointments</p>
          </div>
          <div className="flex gap-3">
            <Link href="/patient/dashboard" className="px-4 py-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm">
              Dashboard
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all text-sm"
            >
              {showForm ? 'Cancel' : '+ Request Appointment'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm mb-6">{error}</div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 text-sm mb-6">{success}</div>
        )}

        {showForm && (
          <div className="glass-strong rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Request an Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.appointmentDate}
                    onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 16)}
                    className="w-full h-12 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Duration</label>
                  <select
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full h-12 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Appointment Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-12 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white"
                >
                  {APPOINTMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any specific concerns or requests..."
                  rows={3}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="glass-strong rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white/60 text-lg mb-2">No appointments yet</p>
            <p className="text-white/40 text-sm">Click "Request Appointment" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="glass-strong rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{apt.type.replace(/_/g, ' ')}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm">{formatDateTime(apt.appointmentDate)} · {apt.duration} min</p>
                    {apt.doctor && (
                      <p className="text-white/50 text-sm mt-1">Dr. {apt.doctor.user.name}</p>
                    )}
                    {apt.notes && (
                      <p className="text-white/40 text-sm mt-2 italic">"{apt.notes}"</p>
                    )}
                  </div>
                </div>
                {apt.status === 'CANCELLED' && apt.rejectionReason && (
                  <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-red-300 text-xs font-medium">Rejection reason:</p>
                    <p className="text-red-200/80 text-sm mt-1">{apt.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
