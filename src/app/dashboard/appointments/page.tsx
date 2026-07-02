'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments')
      const data = await res.json()
      setAppointments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <Link href="/dashboard/appointments/new">
          <Button>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Book Appointment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Badge variant="outline">All</Badge>
            <Badge>Scheduled</Badge>
            <Badge variant="secondary">Completed</Badge>
            <Badge variant="destructive">Cancelled</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No appointments scheduled</p>
              <Link href="/dashboard/appointments/new" className="mt-4 inline-block">
                <Button>Book your first appointment</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
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
                    <Button size="sm" variant="outline">Edit</Button>
                    {appointment.status === 'SCHEDULED' && (
                      <>
                        <Button size="sm" variant="outline">Confirm</Button>
                        <Button size="sm" variant="destructive">Cancel</Button>
                      </>
                    )}
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
