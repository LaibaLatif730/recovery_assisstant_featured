'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
