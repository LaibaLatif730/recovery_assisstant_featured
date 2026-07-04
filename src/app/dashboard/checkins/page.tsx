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
  symptoms: string | null
  completedDate: string | null
  patient: { id: string; firstName: string; lastName: string; phone: string }
  treatment: { id: string; type: string; treatmentDate: string }
  photos: any[]
  aiAnalyses: any[]
}

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchCheckIns()
  }, [filter])

  const fetchCheckIns = async () => {
    try {
      const url = filter === 'all' ? '/api/checkins' : `/api/checkins?status=${filter}`
      const res = await fetch(url)
      const data = await res.json()
      setCheckIns(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching check-ins:', error)
      setCheckIns([])
    } finally {
      setLoading(false)
    }
  }

  const toggleDetails = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'RED': return 'destructive'
      case 'ORANGE': return 'destructive'
      case 'YELLOW': return 'secondary'
      case 'GREEN': return 'outline'
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
          <h1 className="text-2xl font-bold text-white">Recovery Check-ins</h1>
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
                <div key={checkIn.id} className="p-4 border rounded-lg hover:bg-white/5 transition-colors">
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

                  {/* Collapsed: always show patient message and AI response */}
                  {checkIn.patientMessage && (
                    <div className="mt-4 p-3 bg-white/5 rounded-md">
                      <p className="text-sm font-medium text-white">Patient Message:</p>
                      <p className="text-sm text-gray-300">{checkIn.patientMessage}</p>
                    </div>
                  )}

                  {checkIn.aiResponse && (
                    <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                      <p className="text-sm font-medium text-blue-400">AI Response:</p>
                      <p className="text-sm text-blue-300">{checkIn.aiResponse}</p>
                    </div>
                  )}

                  {/* Expanded details section */}
                  {expandedId === checkIn.id && (
                    <div className="mt-4 p-4 bg-white/5 rounded-lg space-y-3 border border-white/10">
                      <h4 className="font-medium text-white">Full Details</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Patient ID:</span> {checkIn.patient.id}</div>
                        <div><span className="text-muted-foreground">Phone:</span> {checkIn.patient.phone || 'N/A'}</div>
                        <div><span className="text-muted-foreground">Treatment ID:</span> {checkIn.treatment.id}</div>
                        <div><span className="text-muted-foreground">Treatment Date:</span> {formatDate(checkIn.treatment.treatmentDate)}</div>
                        <div><span className="text-muted-foreground">Completed:</span> {checkIn.completedDate ? formatDate(checkIn.completedDate) : 'Not completed'}</div>
                        {checkIn.symptoms && <div className="col-span-2"><span className="text-muted-foreground">Symptoms:</span> {checkIn.symptoms}</div>}
                      </div>
                      {checkIn.photos.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-white mb-2">Photos ({checkIn.photos.length})</p>
                          <div className="flex gap-2">
                            {checkIn.photos.map((photo: any) => (
                              <div key={photo.id} className="w-16 h-16 rounded bg-white/10 flex items-center justify-center text-xs text-muted-foreground">
                                Photo
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {checkIn.aiAnalyses.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-white mb-2">AI Analyses</p>
                          {checkIn.aiAnalyses.map((analysis: any) => (
                            <div key={analysis.id} className="p-2 bg-blue-500/10 rounded text-xs">
                              Edema: {analysis.edemaScore}/10 | Ecchymosis: {analysis.ecchymosisScore}/10 | Erythema: {analysis.erythemaScore}/10
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleDetails(checkIn.id)}>
                      {expandedId === checkIn.id ? 'Hide Details' : 'View Details'}
                    </Button>
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
