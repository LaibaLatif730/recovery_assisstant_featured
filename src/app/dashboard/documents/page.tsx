'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'

interface ClinicalDocument {
  id: string
  documentType: string
  content: string
  generatedBy: string
  doctorApproved: boolean
  createdAt: string
  treatment: {
    id: string
    type: string
    treatmentDate: string
    patient: { firstName: string; lastName: string }
  }
}

const DOCUMENT_TYPES = [
  { value: 'SOAP', label: 'SOAP Note' },
  { value: 'PROCEDURE', label: 'Procedure Note' },
  { value: 'RECOVERY_SUMMARY', label: 'Recovery Summary' },
]

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ClinicalDocument[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState('')
  const [selectedType, setSelectedType] = useState('SOAP')
  const [viewingDoc, setViewingDoc] = useState<ClinicalDocument | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchDocuments()
    fetchTreatments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/clinical-documents')
      const data = await res.json()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching documents:', error)
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

  const handleGenerate = async () => {
    if (!selectedTreatment) return
    setGenerating(true)
    try {
      const res = await fetch('/api/clinical-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treatmentId: selectedTreatment,
          documentType: selectedType,
        }),
      })

      if (res.ok) {
        const doc = await res.json()
        setViewingDoc(doc)
        fetchDocuments()
      }
    } catch (error) {
      console.error('Error generating document:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async (docId: string) => {
    try {
      const res = await fetch('/api/clinical-documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, doctorApproved: true }),
      })
      if (res.ok) {
        setToast({ message: 'Document approved successfully', type: 'success' })
        setViewingDoc(null)
        fetchDocuments()
        setTimeout(() => setToast(null), 3000)
      } else {
        setToast({ message: 'Failed to approve document', type: 'error' })
        setTimeout(() => setToast(null), 3000)
      }
    } catch (error) {
      console.error('Error approving document:', error)
      setToast({ message: 'Failed to approve document', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const handleDiscard = async (docId: string) => {
    if (!confirm('Are you sure you want to discard this document?')) return
    try {
      const res = await fetch('/api/clinical-documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId }),
      })
      if (res.ok) {
        setToast({ message: 'Document discarded', type: 'success' })
        setViewingDoc(null)
        fetchDocuments()
        setTimeout(() => setToast(null), 3000)
      } else {
        setToast({ message: 'Failed to discard document', type: 'error' })
        setTimeout(() => setToast(null), 3000)
      }
    } catch (error) {
      console.error('Error discarding document:', error)
      setToast({ message: 'Failed to discard document', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const getDocTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(d => d.value === type)?.label || type
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`p-4 rounded-xl text-sm ${
          toast.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-300' :
          'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clinical Documents</h1>
          <p className="text-muted-foreground">Auto-generated SOAP notes, procedure documentation, recovery summaries</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Document</CardTitle>
          <CardDescription>Create AI-generated clinical documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Treatment</label>
              <Select value={selectedTreatment} onChange={(e) => setSelectedTreatment(e.target.value)}>
                <option value="">Select treatment</option>
                {treatments.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.patient.firstName} {t.patient.lastName} — {t.type.replace(/_/g, ' ')} ({formatDate(t.treatmentDate)})
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-48 space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={!selectedTreatment || generating}>
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {viewingDoc && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Document</CardTitle>
              <Button variant="outline" onClick={() => setViewingDoc(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white/5 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono">{viewingDoc.content}</pre>
            </div>
            <div className="mt-4 flex gap-2">
              {!viewingDoc.doctorApproved ? (
                <>
                  <Button onClick={() => handleApprove(viewingDoc.id)}>Approve Document</Button>
                  <Button variant="destructive" onClick={() => handleDiscard(viewingDoc.id)}>Discard</Button>
                </>
              ) : (
                <Button disabled>Approved</Button>
              )}
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(viewingDoc.content)}>
                Copy to Clipboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generated Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No documents generated yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 border rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setViewingDoc(doc)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{getDocTypeLabel(doc.documentType)}</Badge>
                        {doc.doctorApproved ? (
                          <Badge variant="default">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Pending Approval</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {doc.treatment.patient.firstName} {doc.treatment.patient.lastName} — {doc.treatment.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatDate(doc.createdAt)}</p>
                    </div>
                    <Button size="sm" variant="outline">View</Button>
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
