'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface InjectionMapping {
  id: string
  area: string
  subArea: string | null
  units: number | null
  volume: number | null
  technique: string | null
  needleCannula: string | null
  depth: string | null
  product: { name: string } | null
}

interface Treatment {
  id: string
  type: string
  productName: string
  treatmentDate: string
  units: number | null
  volume: number | null
  notes: string
  status: string
  injectionMappings: InjectionMapping[]
  checkIns: { id: string; status: string; dayNumber: number; riskLevel: string }[]
}

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
  medications: string
  treatments: Treatment[]
  checkIns: any[]
  appointments: any[]
  photos: any[]
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

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

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'RED': return 'destructive'
      case 'ORANGE': return 'destructive'
      case 'YELLOW': return 'secondary'
      case 'GREEN': return 'outline'
      default: return 'outline'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Clinical Timeline' },
    { id: 'injections', label: 'Injection Map' },
    { id: 'checkins', label: 'Check-ins' },
  ]

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

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medications</span>
                <span className="text-right max-w-xs">{patient.medications || 'None'}</span>
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
      )}

      {/* Clinical Timeline Tab */}
      {activeTab === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle>Clinical Timeline</CardTitle>
            <CardDescription>Chronological treatment history</CardDescription>
          </CardHeader>
          <CardContent>
            {patient.treatments.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No treatments recorded</p>
            ) : (
              <div className="space-y-4">
                {patient.treatments.map((treatment) => (
                  <div key={treatment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{treatment.type.replace(/_/g, ' ')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(treatment.treatmentDate)}
                          {treatment.productName && ` • ${treatment.productName}`}
                          {treatment.units && ` • ${treatment.units} units`}
                        </p>
                      </div>
                      <Badge variant={treatment.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {treatment.status}
                      </Badge>
                    </div>
                    {treatment.notes && (
                      <p className="text-sm text-muted-foreground mb-2">{treatment.notes}</p>
                    )}
                    {treatment.checkIns.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {treatment.checkIns.map((ci) => (
                          <Badge key={ci.id} variant={getRiskBadge(ci.riskLevel)} className="text-xs">
                            Day {ci.dayNumber}: {ci.status}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Injection Map Tab */}
      {activeTab === 'injections' && (
        <Card>
          <CardHeader>
            <CardTitle>Injection Mapping</CardTitle>
            <CardDescription>Detailed injection site documentation</CardDescription>
          </CardHeader>
          <CardContent>
            {patient.treatments.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No treatments recorded</p>
            ) : (
              <div className="space-y-6">
                {patient.treatments.map((treatment) => (
                  <div key={treatment.id}>
                    <h3 className="font-semibold mb-3">
                      {treatment.type.replace(/_/g, ' ')} — {formatDate(treatment.treatmentDate)}
                    </h3>
                    {treatment.injectionMappings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No injection mappings recorded</p>
                    ) : (
                      <div className="space-y-2">
                        {treatment.injectionMappings.map((mapping) => (
                          <div key={mapping.id} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{mapping.area}</Badge>
                              {mapping.subArea && <Badge variant="secondary">{mapping.subArea}</Badge>}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              {mapping.units && <span>Units: <strong>{mapping.units}</strong></span>}
                              {mapping.volume && <span>Volume: <strong>{mapping.volume}mL</strong></span>}
                              {mapping.product && <span>Product: {mapping.product.name}</span>}
                              {mapping.technique && <span>Technique: {mapping.technique}</span>}
                              {mapping.needleCannula && <span>Device: {mapping.needleCannula}</span>}
                              {mapping.depth && <span>Depth: {mapping.depth}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Check-ins Tab */}
      {activeTab === 'checkins' && (
        <Card>
          <CardHeader>
            <CardTitle>Recovery Check-ins</CardTitle>
            <CardDescription>Recovery monitoring status</CardDescription>
          </CardHeader>
          <CardContent>
            {patient.checkIns.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No check-ins scheduled</p>
            ) : (
              <div className="space-y-3">
                {patient.checkIns.slice(0, 10).map((checkIn) => (
                  <div key={checkIn.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Day {checkIn.dayNumber} Check-in</p>
                      <p className="text-sm text-muted-foreground">
                        Scheduled: {formatDate(checkIn.scheduledDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRiskBadge(checkIn.riskLevel)}>
                        {checkIn.riskLevel}
                      </Badge>
                      <Badge variant={
                        checkIn.status === 'COMPLETED' ? 'default' :
                        checkIn.status === 'ESCALATED' ? 'destructive' : 'secondary'
                      }>
                        {checkIn.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
