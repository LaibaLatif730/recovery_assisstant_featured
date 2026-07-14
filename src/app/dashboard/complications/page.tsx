'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import { FieldError } from '@/components/FieldError'
import { complicationSchema } from '@/lib/validators'
import { useZodForm } from '@/hooks/useZodForm'

interface Complication {
  id: string
  complicationType: string
  description: string | null
  severity: string
  onsetDate: string
  resolutionDate: string | null
  treatmentGiven: string | null
  outcome: string | null
  batchNumber: string | null
  productUsed: string | null
  reportedToRegulatory: boolean
  createdAt: string
  patient: { id: string; firstName: string; lastName: string; phone: string | null }
  treatment: { id: string; type: string; treatmentDate: string; productName: string | null } | null
}

const COMPLICATION_TYPES = [
  { value: 'BRUISING', label: 'Bruising (Ecchymosis)' },
  { value: 'SWELLING', label: 'Swelling (Edema)' },
  { value: 'DELAYED_SWELLING', label: 'Delayed Swelling' },
  { value: 'INFECTION', label: 'Infection' },
  { value: 'NODULES', label: 'Nodules' },
  { value: 'GRANULOMA', label: 'Granuloma' },
  { value: 'TYNDALL_EFFECT', label: 'Tyndall Effect' },
  { value: 'PTOSIS', label: 'Ptosis' },
  { value: 'SMILE_ASYMMETRY', label: 'Smile Asymmetry' },
  { value: 'VASCULAR_OCCLUSION', label: 'Vascular Occlusion' },
  { value: 'SKIN_NECROSIS', label: 'Skin Necrosis' },
  { value: 'HYPERSENSITIVITY', label: 'Hypersensitivity' },
  { value: 'MIGRATION', label: 'Migration' },
  { value: 'INFLAMMATION', label: 'Inflammation' },
  { value: 'OTHER', label: 'Other' },
]

const SEVERITY_OPTIONS = [
  { value: 'MILD', label: 'Mild', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'MODERATE', label: 'Moderate', color: 'bg-orange-100 text-orange-800' },
  { value: 'SEVERE', label: 'Severe', color: 'bg-red-100 text-red-800' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-200 text-red-900' },
]

export default function ComplicationsPage() {
  const [complications, setComplications] = useState<Complication[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({
    patientId: '',
    treatmentId: '',
    complicationType: 'BRUISING',
    description: '',
    severity: 'MILD',
    onsetDate: new Date().toISOString().split('T')[0],
    treatmentGiven: '',
    outcome: '',
    batchNumber: '',
    productUsed: '',
  })
  const [formError, setFormError] = useState('')
  const { validate, getFieldError } = useZodForm(complicationSchema)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ complicationType: '', description: '', severity: '', treatmentGiven: '', outcome: '' })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchComplications()
    fetchPatients()
  }, [filter])

  const fetchComplications = async () => {
    try {
      const url = filter ? `/api/complications?severity=${filter}` : '/api/complications'
      const res = await fetch(url)
      const data = await res.json()
      setComplications(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching complications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients')
      const data = await res.json()
      setPatients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!validate(form)) {
      return
    }

    try {
      const res = await fetch('/api/complications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setShowForm(false)
        setForm({
          patientId: '', treatmentId: '', complicationType: 'BRUISING', description: '',
          severity: 'MILD', onsetDate: new Date().toISOString().split('T')[0],
          treatmentGiven: '', outcome: '', batchNumber: '', productUsed: '',
        })
        fetchComplications()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Failed to create complication')
      }
    } catch (error) {
      console.error('Error creating complication:', error)
      setFormError('Failed to create complication')
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'SEVERE': return 'destructive'
      case 'MODERATE': return 'secondary'
      default: return 'outline'
    }
  }

  const getComplicationLabel = (type: string) => {
    return COMPLICATION_TYPES.find(c => c.value === type)?.label || type
  }

  const startEdit = (comp: Complication) => {
    setEditingId(comp.id)
    setEditForm({
      complicationType: comp.complicationType,
      description: comp.description || '',
      severity: comp.severity,
      treatmentGiven: comp.treatmentGiven || '',
      outcome: comp.outcome || '',
    })
  }

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/complications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setEditingId(null)
        fetchComplications()
      }
    } catch (error) {
      console.error('Error updating complication:', error)
    }
  }

  const deleteComplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this complication?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/complications/${id}`, { method: 'DELETE' })
      fetchComplications()
    } catch (error) {
      console.error('Error deleting complication:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const stats = {
    total: complications.length,
    active: complications.filter(c => !c.resolutionDate).length,
    critical: complications.filter(c => c.severity === 'CRITICAL' || c.severity === 'SEVERE').length,
    vascular: complications.filter(c => c.complicationType === 'VASCULAR_OCCLUSION' || c.complicationType === 'SKIN_NECROSIS').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Complications</h1>
          <p className="text-muted-foreground">Track and manage treatment complications</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Report Complication'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Complications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active (Unresolved)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Severe/Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-800">{stats.vascular}</div>
            <p className="text-xs text-muted-foreground">Vascular Events</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Report Complication</CardTitle>
            <CardDescription>Document a treatment complication</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                  {formError}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient *</label>
                  <Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} required>
                    <option value="">Select patient</option>
                    {patients.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </Select>
                  <FieldError error={getFieldError('patientId')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Complication Type *</label>
                  <Select value={form.complicationType} onChange={(e) => setForm({ ...form, complicationType: e.target.value })} required>
                    {COMPLICATION_TYPES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Select>
                  <FieldError error={getFieldError('complicationType')} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Severity *</label>
                  <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} required>
                    {SEVERITY_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </Select>
                  <FieldError error={getFieldError('severity')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Onset Date *</label>
                  <Input type="date" value={form.onsetDate} onChange={(e) => setForm({ ...form, onsetDate: e.target.value })} required />
                  <FieldError error={getFieldError('onsetDate')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Used</label>
                  <Input value={form.productUsed} onChange={(e) => setForm({ ...form, productUsed: e.target.value })} placeholder="Product name" maxLength={100} />
                  <FieldError error={getFieldError('productUsed')} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the complication..." rows={3} maxLength={2000} />
                <FieldError error={getFieldError('description')} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Treatment Given</label>
                  <Textarea value={form.treatmentGiven} onChange={(e) => setForm({ ...form, treatmentGiven: e.target.value })} placeholder="Treatment interventions..." rows={2} maxLength={1000} />
                  <FieldError error={getFieldError('treatmentGiven')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Outcome</label>
                  <Textarea value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} placeholder="Outcome of treatment..." rows={2} maxLength={1000} />
                  <FieldError error={getFieldError('outcome')} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Report Complication</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Button variant={filter === '' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('')}>All</Button>
            <Button variant={filter === 'MILD' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('MILD')}>Mild</Button>
            <Button variant={filter === 'MODERATE' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('MODERATE')}>Moderate</Button>
            <Button variant={filter === 'SEVERE' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('SEVERE')}>Severe</Button>
            <Button variant={filter === 'CRITICAL' ? 'destructive' : 'outline'} size="sm" onClick={() => setFilter('CRITICAL')}>Critical</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : complications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No complications recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complications.map((comp) => (
                <div key={comp.id} className="p-4 border rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingId === comp.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Select value={editForm.complicationType} onChange={(e) => setEditForm({ ...editForm, complicationType: e.target.value })}>
                              {COMPLICATION_TYPES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </Select>
                            <Select value={editForm.severity} onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}>
                              {SEVERITY_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </Select>
                          </div>
                          <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
                          <Textarea value={editForm.treatmentGiven} onChange={(e) => setEditForm({ ...editForm, treatmentGiven: e.target.value })} rows={2} placeholder="Treatment given" />
                          <Textarea value={editForm.outcome} onChange={(e) => setEditForm({ ...editForm, outcome: e.target.value })} rows={2} placeholder="Outcome" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(comp.id)}>Save</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getSeverityBadge(comp.severity)}>{comp.severity}</Badge>
                            <span className="font-medium">{getComplicationLabel(comp.complicationType)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {comp.patient.firstName} {comp.patient.lastName}
                            {comp.treatment && ` • ${comp.treatment.type.replace(/_/g, ' ')}`}
                            {` • Onset: ${formatDate(comp.onsetDate)}`}
                          </p>
                          {comp.description && <p className="text-sm mt-1">{comp.description}</p>}
                          {comp.treatmentGiven && <p className="text-sm text-muted-foreground mt-1">Treatment: {comp.treatmentGiven}</p>}
                          {comp.outcome && <p className="text-sm text-muted-foreground">Outcome: {comp.outcome}</p>}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        {comp.resolutionDate ? (
                          <Badge variant="outline">Resolved</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                        {comp.reportedToRegulatory && <Badge variant="destructive" className="ml-2">Reported</Badge>}
                      </div>
                      {editingId !== comp.id && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => startEdit(comp)}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button size="sm" variant="destructive" disabled={deletingId === comp.id} onClick={() => deleteComplication(comp.id)}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </>
                      )}
                    </div>
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
