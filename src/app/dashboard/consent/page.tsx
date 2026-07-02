'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'

interface ConsentRecord {
  id: string
  consentType: string
  version: string
  status: string
  givenDate: string
  withdrawnDate: string | null
  createdAt: string
  patient: { id: string; firstName: string; lastName: string; email: string | null }
}

const CONSENT_TYPES = [
  { value: 'TREATMENT', label: 'Treatment Consent' },
  { value: 'PHOTO', label: 'Photo Documentation Consent' },
  { value: 'DATA', label: 'Data Processing Consent' },
  { value: 'MARKETING', label: 'Marketing Consent' },
  { value: 'RESEARCH', label: 'Research Consent' },
]

export default function ConsentPage() {
  const [records, setRecords] = useState<ConsentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { fetchRecords() }, [filter])

  const fetchRecords = async () => {
    try {
      const url = filter ? `/api/consent?status=${filter}` : '/api/consent'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setRecords(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching consent records:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'WITHDRAWN': return 'destructive'
      case 'EXPIRED': return 'secondary'
      default: return 'outline'
    }
  }

  const stats = {
    total: records.length,
    active: records.filter(r => r.status === 'ACTIVE').length,
    withdrawn: records.filter(r => r.status === 'WITHDRAWN').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Consent Management</h1>
        <p className="text-muted-foreground">Track patient consent records and versions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stats.total}</div><p className="text-xs text-muted-foreground">Total Records</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{stats.active}</div><p className="text-xs text-muted-foreground">Active Consents</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{stats.withdrawn}</div><p className="text-xs text-muted-foreground">Withdrawn</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Button variant={filter === '' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('')}>All</Button>
            <Button variant={filter === 'ACTIVE' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('ACTIVE')}>Active</Button>
            <Button variant={filter === 'WITHDRAWN' ? 'destructive' : 'outline'} size="sm" onClick={() => setFilter('WITHDRAWN')}>Withdrawn</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : records.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No consent records found</p>
          ) : (
            <div className="space-y-3">
              {records.map(record => (
                <div key={record.id} className="p-4 border rounded-lg hover:bg-white/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{record.patient.firstName} {record.patient.lastName}</span>
                        <Badge variant={getStatusBadge(record.status)}>{record.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {CONSENT_TYPES.find(c => c.value === record.consentType)?.label || record.consentType} • Version {record.version}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Given: {formatDate(record.givenDate)}
                        {record.withdrawnDate && ` • Withdrawn: ${formatDate(record.withdrawnDate)}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Consent Policy</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p><strong>Image Retention:</strong> Patient photos are retained for 7 years from last treatment date, or as required by local regulations.</p>
            <p><strong>Data Retention:</strong> Clinical records are retained for 10 years from last treatment. Audit logs are retained indefinitely.</p>
            <p><strong>Access Control:</strong> Only authorized clinical staff can access patient records. All access is logged.</p>
            <p><strong>Right to Erasure:</strong> Patients may request data deletion subject to legal retention requirements.</p>
            <p><strong>Consent Versioning:</strong> Each consent form version is tracked. Patients must re-consent when forms are updated.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
