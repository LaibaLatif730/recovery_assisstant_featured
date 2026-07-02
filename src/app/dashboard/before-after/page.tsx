'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'

interface Photo {
  id: string
  imageUrl: string
  uploadDate: string
  timepoint: string | null
  qualityScore: number | null
  aiAnalyses: {
    id: string
    swellingScore: number
    bruisingScore: number
    rednessScore: number
    asymmetryScore: number
    overallScore: number
    riskLevel: string
    clinicalSummary: string | null
  }[]
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  treatments: {
    id: string
    type: string
    treatmentDate: string
  }[]
}

export default function BeforeAfterPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [photosLoading, setPhotosLoading] = useState(false)
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay'>('side-by-side')

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    if (selectedPatient) {
      fetchPhotos(selectedPatient)
    } else {
      setPhotos([])
    }
  }, [selectedPatient])

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients')
      const data = await res.json()
      if (Array.isArray(data)) {
        setPatients(data.filter((p: Patient) => p.treatments?.length > 0))
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPhotos = async (patientId: string) => {
    setPhotosLoading(true)
    try {
      const res = await fetch(`/api/photos?patientId=${patientId}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setPhotos(data.sort((a: Photo, b: Photo) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()))
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
      setPhotos([])
    } finally {
      setPhotosLoading(false)
    }
  }

  const getTimepointLabel = (timepoint: string | null, uploadDate: string) => {
    if (timepoint) return timepoint
    return formatDate(uploadDate)
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'RED': return 'text-red-400'
      case 'ORANGE': return 'text-orange-400'
      case 'YELLOW': return 'text-yellow-400'
      case 'GREEN': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Before & After Intelligence</h1>
        <p className="text-muted-foreground">AI-powered healing progression analysis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
              <option value="">Select a patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button variant={comparisonMode === 'side-by-side' ? 'default' : 'outline'} size="sm" onClick={() => setComparisonMode('side-by-side')}>
                Side by Side
              </Button>
              <Button variant={comparisonMode === 'overlay' ? 'default' : 'outline'} size="sm" onClick={() => setComparisonMode('overlay')}>
                Timeline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {photosLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading photos...</p>
          </CardContent>
        </Card>
      )}

      {!photosLoading && selectedPatient && photos.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Healing Progression</CardTitle>
              <CardDescription>AI-measured recovery metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {photos.map((photo) => {
                  const analysis = photo.aiAnalyses[0]
                  if (!analysis) return null
                  return (
                    <div key={photo.id} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-muted-foreground">
                        {getTimepointLabel(photo.timepoint, photo.uploadDate)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-20">Edema</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${analysis.swellingScore * 100}%` }} />
                          </div>
                          <span className="text-xs w-10 text-right">{(analysis.swellingScore * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-20">Ecchymosis</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${analysis.bruisingScore * 100}%` }} />
                          </div>
                          <span className="text-xs w-10 text-right">{(analysis.bruisingScore * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-20">Erythema</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${analysis.rednessScore * 100}%` }} />
                          </div>
                          <span className="text-xs w-10 text-right">{(analysis.rednessScore * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-20">Asymmetry</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${analysis.asymmetryScore * 100}%` }} />
                          </div>
                          <span className="text-xs w-10 text-right">{(analysis.asymmetryScore * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <Badge variant={analysis.riskLevel === 'RED' || analysis.riskLevel === 'ORANGE' ? 'destructive' : 'outline'}>
                        {analysis.riskLevel}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photo Timeline</CardTitle>
              <CardDescription>Serial clinical photography comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => {
                  const analysis = photo.aiAnalyses[0]
                  return (
                    <div key={photo.id} className="border rounded-lg overflow-hidden">
                      <img src={photo.imageUrl} alt="Recovery" className="w-full h-40 object-cover" />
                      <div className="p-3">
                        <p className="text-sm font-medium">{getTimepointLabel(photo.timepoint, photo.uploadDate)}</p>
                        {analysis && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Overall</span>
                              <span className={getRiskColor(analysis.riskLevel)}>{(analysis.overallScore * 100).toFixed(0)}%</span>
                            </div>
                            {analysis.clinicalSummary && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{analysis.clinicalSummary}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!photosLoading && selectedPatient && photos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No photos uploaded for this patient yet</p>
          </CardContent>
        </Card>
      )}

      {!selectedPatient && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Select a patient to view before/after comparison</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
