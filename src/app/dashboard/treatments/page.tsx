'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'

interface Treatment {
  id: string
  type: string
  productName: string
  treatmentDate: string
  status: string
  units: number
  volume: number
  notes: string
  aftercareNotes: string
  patient: { id: string; firstName: string; lastName: string }
  doctor: { user: { name: string } } | null
  checkIns: { id: string; status: string; dayNumber: number }[]
}

const TREATMENT_TYPES = [
  'BOTOX', 'FILLER_HYALURONIC', 'FILLER_CALCIUM_HYDROXYLAPATITE',
  'FILLER_POLY_L_LACTIC', 'FILLER_POLYALKYLIMIDE', 'FILLER_POLYMETHYLMETHACRYLATE',
  'MESOTHERAPY', 'PRP', 'SKIN_BOOSTER', 'MICRONEEDLING', 'PDO_THREADS',
  'FAT_DISSOLVING', 'OTHER'
]

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null)
  const [editForm, setEditForm] = useState({
    type: '', productName: '', units: '', notes: '', aftercareNotes: '', status: '', treatmentDate: ''
  })
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetchTreatments()
  }, [])

  const fetchTreatments = async () => {
    try {
      const res = await fetch('/api/treatments')
      const data = await res.json()
      setTreatments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching treatments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTreatments = filter === 'ALL'
    ? treatments
    : treatments.filter((t) => t.status === filter)

  const handleEdit = (treatment: Treatment) => {
    setEditingTreatment(treatment)
    setEditForm({
      type: treatment.type,
      productName: treatment.productName || '',
      units: treatment.units?.toString() || '',
      notes: treatment.notes || '',
      aftercareNotes: treatment.aftercareNotes || '',
      status: treatment.status,
      treatmentDate: treatment.treatmentDate?.split('T')[0] || '',
    })
    setSelectedTreatment(null)
  }

  const handleUpdate = async () => {
    setError('')
    try {
      const res = await fetch('/api/treatments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTreatment?.id,
          ...editForm,
          units: editForm.units ? parseFloat(editForm.units) : undefined,
        }),
      })
      if (res.ok) {
        setEditingTreatment(null)
        fetchTreatments()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update treatment')
      }
    } catch {
      setError('Failed to update treatment')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this treatment?')) return
    try {
      const res = await fetch(`/api/treatments?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSelectedTreatment(null)
        fetchTreatments()
      }
    } catch {
      setError('Failed to delete treatment')
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

      {error && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Treatment Details Modal */}
      {selectedTreatment && (
        <Card className="border-indigo-500/30 bg-indigo-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Treatment Details</h2>
              <Button size="sm" variant="outline" onClick={() => setSelectedTreatment(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{selectedTreatment.type.replace(/_/g, ' ')}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant={selectedTreatment.status === 'COMPLETED' ? 'default' : 'secondary'}>{selectedTreatment.status.replace(/_/g, ' ')}</Badge></div>
              <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selectedTreatment.patient.firstName} {selectedTreatment.patient.lastName}</span></div>
              <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{formatDate(selectedTreatment.treatmentDate)}</span></div>
              {selectedTreatment.productName && <div><span className="text-muted-foreground">Product:</span> <span className="font-medium">{selectedTreatment.productName}</span></div>}
              {selectedTreatment.units && <div><span className="text-muted-foreground">Units:</span> <span className="font-medium">{selectedTreatment.units}</span></div>}
              {selectedTreatment.doctor && <div><span className="text-muted-foreground">Doctor:</span> <span className="font-medium">Dr. {selectedTreatment.doctor.user.name}</span></div>}
            </div>
            {selectedTreatment.notes && (
              <div><span className="text-muted-foreground text-sm">Notes:</span><p className="text-sm mt-1">{selectedTreatment.notes}</p></div>
            )}
            {selectedTreatment.aftercareNotes && (
              <div><span className="text-muted-foreground text-sm">Aftercare:</span><p className="text-sm mt-1">{selectedTreatment.aftercareNotes}</p></div>
            )}
            {selectedTreatment.checkIns.length > 0 && (
              <div>
                <span className="text-muted-foreground text-sm">Check-ins:</span>
                <div className="flex gap-2 mt-1">
                  {selectedTreatment.checkIns.map((ci) => (
                    <Badge key={ci.id} variant={ci.status === 'COMPLETED' ? 'outline' : 'secondary'} className="text-xs">
                      Day {ci.dayNumber}: {ci.status === 'COMPLETED' ? 'Done' : ci.status}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => handleEdit(selectedTreatment)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedTreatment.id)}>Delete</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Treatment Modal */}
      {editingTreatment && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Treatment</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                  {TREATMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FOLLOW_UP_NEEDED">Follow-up Needed</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Product</label>
                <Input value={editForm.productName} onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Units</label>
                <Input type="number" value={editForm.units} onChange={(e) => setEditForm({ ...editForm, units: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={editForm.treatmentDate} onChange={(e) => setEditForm({ ...editForm, treatmentDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Aftercare Notes</label>
              <Textarea value={editForm.aftercareNotes} onChange={(e) => setEditForm({ ...editForm, aftercareNotes: e.target.value })} rows={3} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleUpdate}>Save Changes</Button>
              <Button variant="outline" onClick={() => setEditingTreatment(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex gap-2">
            {[
              { key: 'ALL', label: 'All', variant: 'outline' },
              { key: 'COMPLETED', label: 'Completed', variant: 'default' },
              { key: 'SCHEDULED', label: 'Scheduled', variant: 'secondary' },
              { key: 'FOLLOW_UP_NEEDED', label: 'Follow-up Needed', variant: 'destructive' },
            ].map((tab) => (
              <Badge
                key={tab.key}
                variant={filter === tab.key ? 'default' : 'outline'}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTreatments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {filter === 'ALL' ? 'No treatments recorded yet' : `No ${filter.toLowerCase().replace(/_/g, ' ')} treatments`}
              </p>
              {filter === 'ALL' && (
                <Link href="/dashboard/treatments/new" className="mt-4 inline-block">
                  <Button>Record your first treatment</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTreatments.map((treatment) => (
                <div key={treatment.id} className="p-4 border rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedTreatment(treatment)}>
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
