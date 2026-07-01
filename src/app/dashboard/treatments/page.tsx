'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface Treatment {
  id: string
  type: string
  productName: string
  treatmentDate: string
  status: string
  units: number
  patient: { id: string; firstName: string; lastName: string }
  doctor: { user: { name: string } } | null
  checkIns: { id: string; status: string }[]
}

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTreatments()
  }, [])

  const fetchTreatments = async () => {
    try {
      const res = await fetch('/api/treatments')
      const data = await res.json()
      setTreatments(data)
    } catch (error) {
      console.error('Error fetching treatments:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Treatments</h1>
          <p className="text-muted-foreground">Track and manage treatments</p>
        </div>
        <Link href="/dashboard/treatments/new">
          <Button>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Treatment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Badge variant="outline">All</Badge>
            <Badge>Completed</Badge>
            <Badge variant="secondary">Scheduled</Badge>
            <Badge variant="destructive">Follow-up Needed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : treatments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No treatments recorded yet</p>
              <Link href="/dashboard/treatments/new" className="mt-4 inline-block">
                <Button>Record your first treatment</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {treatments.map((treatment) => (
                <div key={treatment.id} className="p-4 border rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {treatment.type.replace(/_/g, ' ')}
                          {treatment.productName && ` - ${treatment.productName}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {treatment.patient.firstName} {treatment.patient.lastName}
                          {treatment.doctor && ` • Dr. ${treatment.doctor.user.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm">{formatDate(treatment.treatmentDate)}</p>
                        {treatment.units && (
                          <p className="text-xs text-muted-foreground">{treatment.units} units</p>
                        )}
                      </div>
                      <Badge variant={
                        treatment.status === 'COMPLETED' ? 'default' :
                        treatment.status === 'FOLLOW_UP_NEEDED' ? 'destructive' : 'secondary'
                      }>
                        {treatment.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {treatment.checkIns.map((checkIn) => (
                      <Badge
                        key={checkIn.id}
                        variant={checkIn.status === 'COMPLETED' ? 'outline' : 'secondary'}
                        className="text-xs"
                      >
                        {checkIn.status === 'COMPLETED' ? '✓' : '○'}
                      </Badge>
                    ))}
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
