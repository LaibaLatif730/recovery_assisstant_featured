'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  dateOfBirth: string
  address: string
  medicalHistory: any
  allergies: string
  treatments: any[]
  checkIns: any[]
  appointments: any[]
  photos: any[]
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPatient()
  }, [params.id])

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${params.id}`)
      const data = await res.json()
      setPatient(data)
    } catch (error) {
      console.error('Error fetching patient:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Patient not found</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-muted-foreground">{patient.email} {patient.phone && `• ${patient.phone}`}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
          <Button>Edit Patient</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender</span>
              <span>{patient.gender || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth</span>
              <span>{patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="text-right max-w-xs">{patient.address || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allergies</span>
              <span className="text-right max-w-xs">{patient.allergies || 'None'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Treatments</span>
              <span className="font-medium">{patient.treatments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-ins</span>
              <span className="font-medium">{patient.checkIns.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Appointments</span>
              <span className="font-medium">{patient.appointments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Photos Uploaded</span>
              <span className="font-medium">{patient.photos.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Treatment History</CardTitle>
            <CardDescription>Past treatments and procedures</CardDescription>
          </div>
          <Button size="sm">Record Treatment</Button>
        </CardHeader>
        <CardContent>
          {patient.treatments.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No treatments recorded yet</p>
          ) : (
            <div className="space-y-4">
              {patient.treatments.map((treatment) => (
                <div key={treatment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{treatment.type.replace(/_/g, ' ')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(treatment.treatmentDate)}
                        {treatment.productName && ` • ${treatment.productName}`}
                      </p>
                    </div>
                    <Badge variant={treatment.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {treatment.status}
                    </Badge>
                  </div>
                  {treatment.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{treatment.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
          <CardDescription>Recovery monitoring status</CardDescription>
        </CardHeader>
        <CardContent>
          {patient.checkIns.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No check-ins scheduled</p>
          ) : (
            <div className="space-y-3">
              {patient.checkIns.slice(0, 5).map((checkIn) => (
                <div key={checkIn.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Day {checkIn.dayNumber} Check-in</p>
                    <p className="text-sm text-muted-foreground">
                      Scheduled: {formatDate(checkIn.scheduledDate)}
                    </p>
                  </div>
                  <Badge variant={
                    checkIn.status === 'COMPLETED' ? 'default' :
                    checkIn.status === 'ESCALATED' ? 'destructive' : 'secondary'
                  }>
                    {checkIn.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
