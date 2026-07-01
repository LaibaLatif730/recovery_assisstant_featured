'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface CheckIn {
  id: string
  dayNumber: number
  scheduledDate: string
  status: string
  riskLevel: string
  patientMessage: string
  aiResponse: string
  patient: { id: string; firstName: string; lastName: string; phone: string }
  treatment: { id: string; type: string }
  photos: any[]
  aiAnalyses: any[]
}

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchCheckIns()
  }, [filter])

  const fetchCheckIns = async () => {
    try {
      const url = filter === 'all' ? '/api/checkins' : `/api/checkins?status=${filter}`
      const res = await fetch(url)
      const data = await res.json()
      setCheckIns(data)
    } catch (error) {
      console.error('Error fetching check-ins:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default'
      case 'ESCALATED': return 'destructive'
      case 'PENDING': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recovery Check-ins</h1>
          <p className="text-muted-foreground">Monitor patient recovery progress</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'PENDING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('PENDING')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'COMPLETED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('COMPLETED')}
            >
              Completed
            </Button>
            <Button
              variant={filter === 'ESCALATED' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setFilter('ESCALATED')}
            >
              Escalated
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : checkIns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No check-ins found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {checkIns.map((checkIn) => (
                <div key={checkIn.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-medium text-primary">
                          {checkIn.patient.firstName[0]}{checkIn.patient.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {checkIn.patient.firstName} {checkIn.patient.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Day {checkIn.dayNumber} check-in • {checkIn.treatment.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Scheduled: {formatDate(checkIn.scheduledDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRiskBadgeVariant(checkIn.riskLevel)}>
                        {checkIn.riskLevel}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(checkIn.status)}>
                        {checkIn.status}
                      </Badge>
                    </div>
                  </div>

                  {checkIn.patientMessage && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700">Patient Message:</p>
                      <p className="text-sm text-gray-600">{checkIn.patientMessage}</p>
                    </div>
                  )}

                  {checkIn.aiResponse && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium text-blue-700">AI Response:</p>
                      <p className="text-sm text-blue-600">{checkIn.aiResponse}</p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline">View Details</Button>
                    {checkIn.status === 'ESCALATED' && (
                      <Button size="sm">Take Action</Button>
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
