'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface DoctorData {
  todayAppointments: {
    id: string
    appointmentDate: string
    type: string
    status: string
    patient: { id: string; firstName: string; lastName: string; phone: string }
  }[]
  flaggedCheckIns: {
    id: string
    dayNumber: number
    riskLevel: string
    scheduledDate: string
    patient: { id: string; firstName: string; lastName: string }
    treatment: { type: string } | null
    photos: {
      aiAnalyses: { riskLevel: string; clinicalSummary: string | null; createdAt: string }[]
    }[]
  }[]
  pendingCheckIns: number
  totalPatients: number
  recentTreatments: {
    id: string
    type: string
    treatmentDate: string
    patient: { firstName: string; lastName: string }
  }[]
}

export default function DoctorDashboardPage() {
  const [data, setData] = useState<DoctorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchDashboard = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/analytics')
      if (!res.ok) {
        setError(true)
        return
      }
      const d = await res.json()
      if (d && !d.error) {
        setData(d)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-muted-foreground mb-4">Failed to load dashboard</p>
        <Button onClick={fetchDashboard}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Doctor Dashboard</h1>
        <p className="text-muted-foreground">Today&apos;s schedule & AI-flagged cases</p>
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
            <CardTitle className="text-sm font-medium">AI-Flagged Cases</CardTitle>
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.flaggedCheckIns.length}</div>
            <p className="text-xs text-muted-foreground">Needs review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Check-ins</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingCheckIns}</div>
            <p className="text-xs text-muted-foreground">Awaiting patient response</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Today&apos;s Schedule</CardTitle>
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
                        {' · '}{appt.type.replace(/_/g, ' ')}
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
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm">AI-Flagged Aftercare</CardTitle>
            <Link href="/dashboard/checkins">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.flaggedCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No flagged cases</p>
            ) : (
              <div className="space-y-3">
                {data.flaggedCheckIns.slice(0, 5).map((checkIn) => (
                  <Link
                    key={checkIn.id}
                    href={`/dashboard/checkins`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{checkIn.patient.firstName} {checkIn.patient.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        Day {checkIn.dayNumber} · {checkIn.treatment?.type?.replace(/_/g, ' ') || 'N/A'}
                      </p>
                      {checkIn.photos[0]?.aiAnalyses[0]?.clinicalSummary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {checkIn.photos[0].aiAnalyses[0].clinicalSummary}
                        </p>
                      )}
                    </div>
                    <Badge variant={checkIn.riskLevel === 'RED' ? 'destructive' : 'destructive'}>
                      {checkIn.riskLevel}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm">Recent Treatments</CardTitle>
          <Link href="/dashboard/treatments">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data.recentTreatments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No treatments yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentTreatments.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                  <div>
                    <span className="font-medium">{t.type.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground ml-2">{t.patient.firstName} {t.patient.lastName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(t.treatmentDate)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
