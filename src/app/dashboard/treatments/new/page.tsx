'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FieldError } from '@/components/FieldError'
import { treatmentSchema } from '@/lib/validators'
import { useZodForm } from '@/hooks/useZodForm'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

export default function NewTreatmentPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    patientId: '',
    type: 'BOTOX',
    productName: '',
    units: '',
    injectionAreas: '',
    treatmentDate: new Date().toISOString().split('T')[0],
    notes: '',
    aftercareNotes: '',
    numberOfCheckIns: '5',
    status: 'SCHEDULED',
  })
  const { validate, getFieldError } = useZodForm(treatmentSchema)

  useEffect(() => {
    fetchPatients()
  }, [])

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
    setLoading(true)
    setError('')

    if (!validate({ ...form, units: form.units ? parseFloat(form.units) : undefined })) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          units: form.units ? parseFloat(form.units) : undefined,
          numberOfCheckIns: parseInt(form.numberOfCheckIns) || 5,
        }),
      })

      if (res.ok) {
        router.push('/dashboard/treatments')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to record treatment')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const treatmentTypes = [
    { value: 'BOTOX', label: 'Botox' },
    { value: 'FILLER_HYALURONIC', label: 'Hyaluronic Acid Filler' },
    { value: 'FILLER_CALCIUM_HYDROXYLAPATITE', label: 'Calcium Hydroxylapatite Filler' },
    { value: 'FILLER_POLY_L_LACTIC', label: 'Poly-L-Lactic Acid Filler' },
    { value: 'FILLER_POLYALKYLIMIDE', label: 'Polyalkylimide Filler' },
    { value: 'FILLER_POLYMETHYLMETHACRYLATE', label: 'PMMA Filler' },
    { value: 'MESOTHERAPY', label: 'Mesotherapy' },
    { value: 'PRP', label: 'PRP (Platelet-Rich Plasma)' },
    { value: 'SKIN_BOOSTER', label: 'Skin Booster' },
    { value: 'MICRONEEDLING', label: 'Microneedling' },
    { value: 'PDO_THREADS', label: 'PDO Threads' },
    { value: 'FAT_DISSOLVING', label: 'Fat Dissolving' },
    { value: 'OTHER', label: 'Other' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Record Treatment</h1>
        <p className="text-muted-foreground">Document a new treatment procedure</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Treatment Details</CardTitle>
          <CardDescription>Enter the treatment information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">{error}</div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Patient *</label>
              <Select
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                required
              >
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </Select>
              <FieldError error={getFieldError('patientId')} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Treatment Type *</label>
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  required
                >
                  {treatmentTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
                <FieldError error={getFieldError('type')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FOLLOW_UP_NEEDED">Follow-up Needed</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Treatment Date *</label>
                <Input
                  type="date"
                  value={form.treatmentDate}
                  onChange={(e) => setForm({ ...form, treatmentDate: e.target.value })}
                  min={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  required
                />
                <FieldError error={getFieldError('treatmentDate')} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  placeholder="e.g., Botox, Juvederm"
                  maxLength={100}
                />
                <FieldError error={getFieldError('productName')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Units</label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.units}
                  onChange={(e) => setForm({ ...form, units: e.target.value })}
                  placeholder="Number of units"
                />
                <FieldError error={getFieldError('units')} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Injection Areas</label>
              <Input
                value={form.injectionAreas}
                onChange={(e) => setForm({ ...form, injectionAreas: e.target.value })}
                placeholder="e.g., Forehead, Crow's feet, Glabella"
                maxLength={200}
              />
              <FieldError error={getFieldError('injectionAreas')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Treatment Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes about the treatment..."
                rows={3}
                maxLength={1000}
              />
              <FieldError error={getFieldError('notes')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Aftercare Instructions</label>
              <Textarea
                value={form.aftercareNotes}
                onChange={(e) => setForm({ ...form, aftercareNotes: e.target.value })}
                placeholder="Specific aftercare instructions for this patient..."
                rows={3}
                maxLength={1000}
              />
              <FieldError error={getFieldError('aftercareNotes')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Check-ins</label>
              <Input
                type="number"
                min="0"
                max="30"
                value={form.numberOfCheckIns}
                onChange={(e) => setForm({ ...form, numberOfCheckIns: e.target.value })}
                placeholder="How many follow-up check-ins?"
              />
              <p className="text-xs text-muted-foreground">Set to 0 if no check-ins needed. Doctor can add more later.</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Recording...' : 'Record Treatment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
