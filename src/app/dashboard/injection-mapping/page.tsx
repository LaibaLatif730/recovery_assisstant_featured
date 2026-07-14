'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { FieldError } from '@/components/FieldError'
import { injectionMappingSchema } from '@/lib/validators'
import { useZodForm } from '@/hooks/useZodForm'

interface InjectionMapping {
  id: string
  area: string
  subArea: string | null
  units: number | null
  volume: number | null
  technique: string | null
  needleCannula: string | null
  depth: string | null
  aspiration: string | null
  notes: string | null
  createdAt: string
  treatment: { id: string; type: string; treatmentDate: string }
  doctor: { user: { name: string } } | null
  product: { id: string; name: string; category: string } | null
  batch: { id: string; batchNumber: string; expiryDate: string } | null
}

interface Treatment {
  id: string
  type: string
  treatmentDate: string
  patient: { id: string; firstName: string; lastName: string }
}

const INJECTION_AREAS = [
  'Forehead', 'Glabella', 'Crow\'s Feet', 'Lips', 'Cheeks', 'Jawline',
  'Chin', 'Temple', 'Nose', 'Nasolabial Folds', 'Marionette Lines',
  'Tear Trough', 'Neck'
]

const DEPTH_OPTIONS = [
  { value: 'INTRADERMAL', label: 'Intradermal' },
  { value: 'SUBDERMAL', label: 'Subdermal' },
  { value: 'DEEP_DERMAL', label: 'Deep Dermal' },
  { value: 'SUPRAPERIOSTEAL', label: 'Supraperiosteal' },
  { value: 'OTHER', label: 'Other' },
]

const TECHNIQUE_OPTIONS = [
  'Linear Threading', 'Serial Puncture', 'Fanning', 'Cross-hatching',
  'Bolus', 'Subcision', 'Cannula', 'Other'
]

export default function InjectionMappingPage() {
  const [mappings, setMappings] = useState<InjectionMapping[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState('')
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({
    treatmentId: '',
    area: '',
    subArea: '',
    units: '',
    volume: '',
    technique: '',
    needleCannula: '',
    depth: '',
    aspiration: 'N/A',
    notes: '',
  })
  const { validate, getFieldError } = useZodForm(injectionMappingSchema)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ area: '', subArea: '', units: '', volume: '', technique: '', needleCannula: '', depth: '', aspiration: 'N/A', notes: '' })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMappings()
    fetchTreatments()
  }, [])

  const fetchMappings = async () => {
    try {
      const url = filter ? `/api/injection-mappings?treatmentId=${filter}` : '/api/injection-mappings'
      const res = await fetch(url)
      const data = await res.json()
      setMappings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching mappings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTreatments = async () => {
    try {
      const res = await fetch('/api/treatments')
      const data = await res.json()
      setTreatments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching treatments:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate({
      treatmentId: form.treatmentId,
      area: form.area,
      subArea: form.subArea || undefined,
      units: form.units ? parseFloat(form.units) : undefined,
      volume: form.volume ? parseFloat(form.volume) : undefined,
      technique: form.technique || undefined,
      needleCannula: form.needleCannula || undefined,
      depth: form.depth || undefined,
      aspiration: form.aspiration || undefined,
      notes: form.notes || undefined,
    })) {
      return
    }
    try {
      const res = await fetch('/api/injection-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          units: form.units ? parseFloat(form.units) : undefined,
          volume: form.volume ? parseFloat(form.volume) : undefined,
        }),
      })

      if (res.ok) {
        setShowForm(false)
        setForm({ treatmentId: '', area: '', subArea: '', units: '', volume: '', technique: '', needleCannula: '', depth: '', aspiration: 'N/A', notes: '' })
        fetchMappings()
      }
    } catch (error) {
      console.error('Error creating mapping:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this injection mapping?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/injection-mappings?id=${id}`, { method: 'DELETE' })
      fetchMappings()
    } catch (error) {
      console.error('Error deleting mapping:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const startEdit = (mapping: InjectionMapping) => {
    setEditingId(mapping.id)
    setEditForm({
      area: mapping.area,
      subArea: mapping.subArea || '',
      units: mapping.units?.toString() || '',
      volume: mapping.volume?.toString() || '',
      technique: mapping.technique || '',
      needleCannula: mapping.needleCannula || '',
      depth: mapping.depth || '',
      aspiration: mapping.aspiration || 'N/A',
      notes: mapping.notes || '',
    })
  }

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch('/api/injection-mappings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      })
      if (res.ok) {
        setEditingId(null)
        fetchMappings()
      }
    } catch (error) {
      console.error('Error updating mapping:', error)
    }
  }

  const groupedByArea = mappings.reduce((acc, mapping) => {
    if (!acc[mapping.area]) acc[mapping.area] = []
    acc[mapping.area].push(mapping)
    return acc
  }, {} as Record<string, InjectionMapping[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Injection Mapping</h1>
          <p className="text-muted-foreground">Document and track injection sites per treatment</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Mapping'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Injection Mapping</CardTitle>
            <CardDescription>Record injection details for a treatment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Treatment *</label>
                  <Select value={form.treatmentId} onChange={(e) => setForm({ ...form, treatmentId: e.target.value })} required>
                    <option value="">Select treatment</option>
                    {treatments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.patient.firstName} {t.patient.lastName} — {t.type.replace(/_/g, ' ')} ({formatDate(t.treatmentDate)})
                      </option>
                    ))}
                  </Select>
                  <FieldError error={getFieldError('treatmentId')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Area *</label>
                  <Select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required>
                    <option value="">Select area</option>
                    {INJECTION_AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </Select>
                  <FieldError error={getFieldError('area')} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sub-Area</label>
                  <Input value={form.subArea} onChange={(e) => setForm({ ...form, subArea: e.target.value })} placeholder="e.g., Left side" maxLength={100} />
                  <FieldError error={getFieldError('subArea')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Units</label>
                  <Input type="number" step="0.5" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} placeholder="Units" />
                  <FieldError error={getFieldError('units')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Volume (mL)</label>
                  <Input type="number" step="0.05" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} placeholder="Volume" />
                  <FieldError error={getFieldError('volume')} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Technique</label>
                  <Select value={form.technique} onChange={(e) => setForm({ ...form, technique: e.target.value })}>
                    <option value="">Select technique</option>
                    {TECHNIQUE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                  <FieldError error={getFieldError('technique')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Needle/Cannula</label>
                  <Input value={form.needleCannula} onChange={(e) => setForm({ ...form, needleCannula: e.target.value })} placeholder="e.g., 30G needle" maxLength={50} />
                  <FieldError error={getFieldError('needleCannula')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Depth</label>
                  <Select value={form.depth} onChange={(e) => setForm({ ...form, depth: e.target.value })}>
                    <option value="">Select depth</option>
                    {DEPTH_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional clinical notes" maxLength={1000} />
                <FieldError error={getFieldError('notes')} />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Mapping</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Injection Sites</CardTitle>
          <CardDescription>All recorded injection mappings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No injection mappings recorded yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByArea).map(([area, areaMappings]) => (
                <div key={area}>
                  <h3 className="text-lg font-semibold mb-3">{area}</h3>
                  <div className="space-y-2">
                    {areaMappings.map((mapping) => (
                      <div key={mapping.id} className="p-4 border rounded-lg hover:bg-white/5 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {editingId === mapping.id ? (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Select value={editForm.area} onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}>
                                    {INJECTION_AREAS.map((a) => (
                                      <option key={a} value={a}>{a}</option>
                                    ))}
                                  </Select>
                                  <Input value={editForm.subArea} onChange={(e) => setEditForm({ ...editForm, subArea: e.target.value })} placeholder="Sub-area" />
                                </div>
                                <div className="flex gap-2">
                                  <Input type="number" step="0.5" value={editForm.units} onChange={(e) => setEditForm({ ...editForm, units: e.target.value })} placeholder="Units" />
                                  <Input type="number" step="0.05" value={editForm.volume} onChange={(e) => setEditForm({ ...editForm, volume: e.target.value })} placeholder="Volume (mL)" />
                                  <Input value={editForm.technique} onChange={(e) => setEditForm({ ...editForm, technique: e.target.value })} placeholder="Technique" />
                                </div>
                                <div className="flex gap-2">
                                  <Input value={editForm.needleCannula} onChange={(e) => setEditForm({ ...editForm, needleCannula: e.target.value })} placeholder="Needle/Cannula" />
                                  <Select value={editForm.depth} onChange={(e) => setEditForm({ ...editForm, depth: e.target.value })}>
                                    <option value="">Depth</option>
                                    {DEPTH_OPTIONS.map((d) => (
                                      <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                  </Select>
                                </div>
                                <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes" />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveEdit(mapping.id)}>Save</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">{mapping.area}</Badge>
                                  {mapping.subArea && <Badge variant="secondary">{mapping.subArea}</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {mapping.treatment.type.replace(/_/g, ' ')} — {formatDate(mapping.treatment.treatmentDate)}
                                </p>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                  {mapping.units && <span>Units: <strong>{mapping.units}</strong></span>}
                                  {mapping.volume && <span>Volume: <strong>{mapping.volume}mL</strong></span>}
                                  {mapping.product && <span>Product: <strong>{mapping.product.name}</strong></span>}
                                  {mapping.technique && <span>Technique: {mapping.technique}</span>}
                                  {mapping.needleCannula && <span>Device: {mapping.needleCannula}</span>}
                                  {mapping.depth && <span>Depth: {mapping.depth}</span>}
                                </div>
                                {mapping.notes && <p className="text-sm text-muted-foreground mt-1">{mapping.notes}</p>}
                              </>
                            )}
                          </div>
                          {editingId !== mapping.id && (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => startEdit(mapping)}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                              <Button size="sm" variant="destructive" disabled={deletingId === mapping.id} onClick={() => handleDelete(mapping.id)}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
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
