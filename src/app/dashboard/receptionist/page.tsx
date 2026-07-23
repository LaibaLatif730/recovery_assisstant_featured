'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface AppointmentRequest {
  id: string
  appointmentDate: string
  type: string
  duration: number
  notes: string | null
  patient: { id: string; firstName: string; lastName: string; email: string; phone: string }
  doctor: { user: { name: string } } | null
}

interface ReceptionistData {
  todayAppointments: {
    id: string
    appointmentDate: string
    type: string
    status: string
    patient: { id: string; firstName: string; lastName: string; phone: string }
    doctor: { user: { name: string } } | null
  }[]
  upcomingAppointments: {
    id: string
    appointmentDate: string
    type: string
    status: string
    patient: { id: string; firstName: string; lastName: string }
    doctor: { user: { name: string } } | null
  }[]
  todayCompletedCheckIns: {
    id: string
    dayNumber: number
    completedDate: string
    patient: { firstName: string; lastName: string }
  }[]
  totalPatients: number
  priorityFlaggedPatients: {
    id: string
    firstName: string
    lastName: string
    phone: string
  }[]
}

export default function ReceptionistDashboardPage() {
  const [data, setData] = useState<ReceptionistData | null>(null)
  const [requests, setRequests] = useState<AppointmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
    fetch('/api/appointment-requests')
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setRequests(d) })
      .catch(() => {})
  }, [])

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/appointment-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== id))
      }
    } catch {
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/appointment-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason: rejectReason || 'Rejected by receptionist' }),
      })
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== id))
        setRejectModal(null)
        setRejectReason('')
      }
    } catch {
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-8 text-muted-foreground">Failed to load dashboard</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Receptionist Dashboard</h1>
        <p className="text-muted-foreground">Today&apos;s schedule & appointments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Appointments</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Completed</CardTitle>
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.todayCompletedCheckIns.length}</div>
            <p className="text-xs text-muted-foreground">Patient responses today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Active in system</p>
          </CardContent>
        </Card>
      </div>

      {requests.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
              <CardTitle className="text-sm">Pending Appointment Requests ({requests.length})</CardTitle>
            </div>
            <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">Action Needed</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5">
                  <div className="flex-1">
                    <p className="font-medium text-white">{req.patient.firstName} {req.patient.lastName}</p>
                    <p className="text-sm text-white/60">
                      {new Date(req.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' · '}{req.type.replace(/_/g, ' ')} · {req.duration} min
                    </p>
                    {req.patient.email && (
                      <p className="text-xs text-white/40 mt-1">{req.patient.email} · {req.patient.phone}</p>
                    )}
                    {req.notes && (
                      <p className="text-xs text-white/40 mt-1 italic">"{req.notes}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={processingId === req.id}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {processingId === req.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setRejectModal(req.id)}
                      disabled={processingId === req.id}
                      className="px-4 py-2 rounded-lg bg-red-600/20 text-red-300 text-sm font-medium hover:bg-red-600/30 transition-colors border border-red-500/30 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-2">Reject Appointment Request</h3>
            <p className="text-white/60 text-sm mb-4">Provide a reason (optional):</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Doctor unavailable at requested time..."
              rows={3}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="px-4 py-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectModal)}
                disabled={processingId === rejectModal}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                {processingId === rejectModal ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm">Today&apos;s Schedule</CardTitle>
            <Link href="/dashboard/appointments">
              <Button variant="ghost" size="sm">Manage</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.todayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No appointments today</p>
            ) : (
              <div className="space-y-3">
                {data.todayAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{appt.patient.firstName} {appt.patient.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appt.appointmentDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {appt.doctor && ` · Dr. ${appt.doctor.user.name}`}
                      </p>
                    </div>
                    <Badge variant={appt.status === 'CONFIRMED' ? 'default' : 'secondary'}>{appt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming appointments</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingAppointments.slice(0, 5).map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{appt.patient.firstName} {appt.patient.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(appt.appointmentDate)}
                        {appt.doctor && ` · Dr. ${appt.doctor.user.name}`}
                      </p>
                    </div>
                    <Badge variant="outline">{appt.type.replace(/_/g, ' ')}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Today&apos;s Check-in Completions</CardTitle>
          <CardDescription>Patient recovery responses received today</CardDescription>
        </CardHeader>
        <CardContent>
          {data.todayCompletedCheckIns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No check-ins completed today</p>
          ) : (
            <div className="space-y-2">
              {data.todayCompletedCheckIns.map((ci) => (
                <div key={ci.id} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                  <div>
                    <span className="font-medium">{ci.patient.firstName} {ci.patient.lastName}</span>
                    <span className="text-muted-foreground ml-2">Day {ci.dayNumber} completed</span>
                  </div>
                  <Badge variant="outline" className="text-green-600">Done</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
