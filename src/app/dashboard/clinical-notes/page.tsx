'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { FieldError } from '@/components/FieldError'
import { clinicalNoteSchema } from '@/lib/validators'
import { useZodForm } from '@/hooks/useZodForm'

interface ClinicalNote {
  id: string
  noteType: string
  content: string
  isAiGenerated: boolean
  isPrivate: boolean
  createdAt: string
  patient: { id: string; firstName: string; lastName: string }
  treatment: { id: string; type: string; treatmentDate: string } | null
}

const NOTE_TYPES = [
  { value: 'SOAP', label: 'SOAP Note' },
  { value: 'PROCEDURE', label: 'Procedure Note' },
  { value: 'PROGRESS', label: 'Progress Note' },
  { value: 'RECOVERY_SUMMARY', label: 'Recovery Summary' },
  { value: 'COMMUNICATION', label: 'Communication Log' },
  { value: 'AUDIT', label: 'Audit Report' },
]

export default function ClinicalNotesPage() {
  const [notes, setNotes] = useState<ClinicalNote[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({
    patientId: '',
    treatmentId: '',
    noteType: 'SOAP',
    content: '',
    isPrivate: false,
  })
  const [formError, setFormError] = useState('')
  const { validate, getFieldError } = useZodForm(clinicalNoteSchema)

  useEffect(() => {
    fetchNotes()
    fetchPatients()
  }, [filter])

  const fetchNotes = async () => {
    try {
      const url = filter ? `/api/clinical-notes?noteType=${filter}` : '/api/clinical-notes'
      const res = await fetch(url)
      const data = await res.json()
      setNotes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching notes:', error)
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
      const res = await fetch('/api/clinical-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setShowForm(false)
        setForm({ patientId: '', treatmentId: '', noteType: 'SOAP', content: '', isPrivate: false })
        fetchNotes()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Failed to create note')
      }
    } catch (error) {
      console.error('Error creating note:', error)
      setFormError('Failed to create note')
    }
  }

  const getNoteTypeLabel = (type: string) => {
    return NOTE_TYPES.find(n => n.value === type)?.label || type
  }

  const getNoteTypeBadge = (type: string) => {
    switch (type) {
      case 'SOAP': return 'default'
      case 'PROCEDURE': return 'secondary'
      case 'PROGRESS': return 'outline'
      case 'RECOVERY_SUMMARY': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clinical Notes</h1>
          <p className="text-muted-foreground">SOAP notes, procedure documentation, and clinical records</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Note'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Clinical Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                  {formError}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-3">
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
                  <label className="text-sm font-medium">Note Type *</label>
                  <Select value={form.noteType} onChange={(e) => setForm({ ...form, noteType: e.target.value })} required>
                    {NOTE_TYPES.map((n) => (
                      <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                  </Select>
                  <FieldError error={getFieldError('noteType')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Private Note</label>
                  <Select value={form.isPrivate ? 'true' : 'false'} onChange={(e) => setForm({ ...form, isPrivate: e.target.value === 'true' })}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </Select>
                  <FieldError error={getFieldError('isPrivate')} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content *</label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Enter clinical note content..."
                  rows={8}
                  required
                  maxLength={5000}
                />
                <FieldError error={getFieldError('content')} />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Note</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex gap-2 flex-wrap">
            <Button variant={filter === '' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('')}>All</Button>
            {NOTE_TYPES.map((n) => (
              <Button key={n.value} variant={filter === n.value ? 'default' : 'outline'} size="sm" onClick={() => setFilter(n.value)}>
                {n.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No clinical notes found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="p-4 border rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getNoteTypeBadge(note.noteType)}>{getNoteTypeLabel(note.noteType)}</Badge>
                      {note.isAiGenerated && <Badge variant="secondary">AI Generated</Badge>}
                      {note.isPrivate && <Badge variant="outline">Private</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(note.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {note.patient.firstName} {note.patient.lastName}
                    {note.treatment && ` • ${note.treatment.type.replace(/_/g, ' ')}`}
                  </p>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-mono">{note.content}</pre>
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
