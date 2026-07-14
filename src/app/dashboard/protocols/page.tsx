'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'

interface Protocol {
  id: string
  procedureType: string
  category: string
  substance: string | null
  typicalVolumes: string | null
  recoveryTimeline: string
  normalSymptoms: string
  warningSigns: string
  emergencySigns: string
  followUpSchedule: string
  contraindications: string
  postProcedureInstructions: string
}

const EMPTY_FORM = {
  procedureType: '',
  category: 'INJECTABLE',
  substance: '',
  typicalVolumes: '',
  recoveryTimeline: '',
  normalSymptoms: '',
  warningSigns: '',
  emergencySigns: '',
  followUpSchedule: '',
  contraindications: '',
  postProcedureInstructions: '',
}

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  useEffect(() => { fetchProtocols() }, [])

  const fetchProtocols = async () => {
    try {
      const res = await fetch('/api/protocols')
      if (res.ok) {
        const data = await res.json()
        setProtocols(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching protocols:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseJsonArray = (str: string): string[] => {
    try { return JSON.parse(str) } catch { return [] }
  }

  const parseSchedule = (str: string): { day: number; type: string; purpose: string }[] => {
    try { return JSON.parse(str) } catch { return [] }
  }

  const startEdit = (p: Protocol) => {
    setEditingId(p.id)
    setShowForm(true)
    setForm({
      procedureType: p.procedureType,
      category: p.category,
      substance: p.substance || '',
      typicalVolumes: p.typicalVolumes || '',
      recoveryTimeline: p.recoveryTimeline,
      normalSymptoms: p.normalSymptoms,
      warningSigns: p.warningSigns,
      emergencySigns: p.emergencySigns,
      followUpSchedule: p.followUpSchedule,
      contraindications: p.contraindications,
      postProcedureInstructions: p.postProcedureInstructions,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.procedureType) {
      setFormError('Procedure type is required')
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...form } : form
      const res = await fetch('/api/protocols', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowForm(false)
        setEditingId(null)
        setForm(EMPTY_FORM)
        fetchProtocols()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Failed to save protocol')
      }
    } catch (error) {
      setFormError('Failed to save protocol')
    }
  }

  const deleteProtocol = async (id: string) => {
    if (!confirm('Are you sure you want to delete this protocol?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/protocols/${id}`, { method: 'DELETE' })
      fetchProtocols()
    } catch (error) {
      console.error('Error deleting protocol:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const formField = (label: string, key: keyof typeof form, opts?: { required?: boolean; rows?: number }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label} {opts?.required && '*'}</label>
      {opts?.rows ? (
        <Textarea
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          rows={opts.rows}
          placeholder={`JSON array: ["item1", "item2"]`}
        />
      ) : (
        <Input
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          required={opts?.required}
        />
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Treatment Protocols</h1>
          <p className="text-muted-foreground">Evidence-based procedure protocols and recovery guidelines</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM) }}>
          {showForm ? 'Cancel' : '+ New Protocol'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Protocol' : 'New Protocol'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">{formError}</div>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Procedure Type *</label>
                  <Input value={form.procedureType} onChange={(e) => setForm({ ...form, procedureType: e.target.value })} required placeholder="e.g. BOTOX_LIPS" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="INJECTABLE">Injectable</option>
                    <option value="LASER">Laser</option>
                    <option value="SURGICAL">Surgical</option>
                    <option value="SKIN_CARE">Skin Care</option>
                    <option value="BODY">Body</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Substance</label>
                  <Input value={form.substance} onChange={(e) => setForm({ ...form, substance: e.target.value })} placeholder="e.g. Hyaluronic Acid" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {formField('Typical Volumes', 'typicalVolumes')}
                {formField('Recovery Timeline', 'recoveryTimeline', { required: true })}
              </div>
              {formField('Normal Symptoms (JSON array)', 'normalSymptoms', { rows: 2 })}
              {formField('Warning Signs (JSON array)', 'warningSigns', { rows: 2 })}
              {formField('Emergency Signs (JSON array)', 'emergencySigns', { rows: 2 })}
              {formField('Contraindications (JSON array)', 'contraindications', { rows: 2 })}
              {formField('Post-Procedure Instructions (JSON array)', 'postProcedureInstructions', { rows: 2 })}
              {formField('Follow-up Schedule (JSON array)', 'followUpSchedule', { rows: 2 })}
              <div className="flex gap-4 pt-4">
                <Button type="submit">{editingId ? 'Save Changes' : 'Create Protocol'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Protocol Library</CardTitle><CardDescription>Standardized protocols for each procedure type</CardDescription></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : protocols.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No protocols configured</p>
          ) : (
            <div className="space-y-4">
              {protocols.map(protocol => (
                <div key={protocol.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 hover:bg-white/5 cursor-pointer flex items-center justify-between" onClick={() => setExpandedProtocol(expandedProtocol === protocol.id ? null : protocol.id)}>
                    <div>
                      <h3 className="font-medium">{protocol.procedureType.replace(/_/g, ' ')}</h3>
                      <p className="text-sm text-muted-foreground">{protocol.category} {protocol.substance && `• ${protocol.substance}`}</p>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {protocol.typicalVolumes && <Badge variant="outline">{protocol.typicalVolumes}</Badge>}
                      <Button variant="ghost" size="sm" onClick={() => setExpandedProtocol(expandedProtocol === protocol.id ? null : protocol.id)}>
                        {expandedProtocol === protocol.id ? '▲' : '▼'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => startEdit(protocol)}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button variant="destructive" size="sm" disabled={deletingId === protocol.id} onClick={() => deleteProtocol(protocol.id)}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  {expandedProtocol === protocol.id && (
                    <div className="p-4 border-t space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Normal Symptoms</h4>
                          <ul className="text-sm space-y-1">
                            {parseJsonArray(protocol.normalSymptoms).map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-yellow-600">Warning Signs</h4>
                          <ul className="text-sm space-y-1">
                            {parseJsonArray(protocol.warningSigns).map((s, i) => <li key={i} className="text-yellow-400">• {s}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-red-600">Emergency Signs</h4>
                          <ul className="text-sm space-y-1">
                            {parseJsonArray(protocol.emergencySigns).map((s, i) => <li key={i} className="text-red-400">• {s}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Contraindications</h4>
                          <ul className="text-sm space-y-1">
                            {parseJsonArray(protocol.contraindications).map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Follow-up Schedule</h4>
                        <div className="flex flex-wrap gap-2">
                          {parseSchedule(protocol.followUpSchedule).map((s, i) => (
                            <Badge key={i} variant="outline">Day {s.day}: {s.purpose}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Post-Procedure Instructions</h4>
                        <ul className="text-sm space-y-1">
                          {parseJsonArray(protocol.postProcedureInstructions).map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
