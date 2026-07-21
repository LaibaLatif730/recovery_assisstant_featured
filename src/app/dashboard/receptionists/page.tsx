'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FieldError } from '@/components/FieldError'
import { registerSchema } from '@/lib/validators'
import { useZodForm } from '@/hooks/useZodForm'

interface Receptionist {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: string
}

export default function ReceptionistsPage() {
  const [receptionists, setReceptionists] = useState<Receptionist[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' })
  const [deleting, setDeleting] = useState<string | null>(null)

  const { validate, getFieldError } = useZodForm(registerSchema)

  useEffect(() => { fetchReceptionists() }, [])

  const fetchReceptionists = async () => {
    try {
      const res = await fetch('/api/receptionists')
      const data = await res.json()
      setReceptionists(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching receptionists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    if (!validate({ name: form.name, email: form.email, password: form.password, phone: form.phone || undefined })) {
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/receptionists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to add receptionist')
        return
      }

      setForm({ name: '', email: '', password: '', phone: '' })
      setShowForm(false)
      fetchReceptionists()
    } catch {
      setError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (r: Receptionist) => {
    try {
      const newRole = r.role === 'INACTIVE' ? 'RECEPTIONIST' : 'INACTIVE'
      await fetch('/api/receptionists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, role: newRole }),
      })
      fetchReceptionists()
    } catch (error) {
      console.error('Error toggling receptionist:', error)
    }
  }

  const startEdit = (r: Receptionist) => {
    setEditForm({ name: r.name || '', email: r.email || '', phone: r.phone || '' })
    setEditingId(r.id)
  }

  const saveEdit = async (id: string) => {
    try {
      await fetch('/api/receptionists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      })
      setEditingId(null)
      fetchReceptionists()
    } catch (error) {
      console.error('Error saving receptionist:', error)
    }
  }

  const deleteReceptionist = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/receptionists?id=${id}`, { method: 'DELETE' })
      fetchReceptionists()
    } catch (error) {
      console.error('Error deleting receptionist:', error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Receptionists</h1>
          <p className="text-muted-foreground">Manage receptionist accounts</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
          </svg>
          {showForm ? 'Cancel' : 'Add Receptionist'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Receptionist</CardTitle>
            <CardDescription>Create a new receptionist account with login credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">{error}</div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <FieldError error={getFieldError('name')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="receptionist@clinic.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                  <FieldError error={getFieldError('email')} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password *</label>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <FieldError error={getFieldError('password')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    type="tel"
                    placeholder="Digits only, 7-15 characters"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <FieldError error={getFieldError('phone')} />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Receptionist Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : receptionists.length === 0 ? (
            <div className="text-center py-8">
              <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-muted-foreground mb-4">No receptionists registered yet</p>
              <Button onClick={() => setShowForm(true)}>Add your first receptionist</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {receptionists.map((r) => (
                <div key={r.id} className="rounded-lg border overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{r.name}</h3>
                        <p className="text-sm text-muted-foreground">{r.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={r.role === 'INACTIVE' ? 'destructive' : 'outline'}>
                        {r.role === 'INACTIVE' ? 'Inactive' : 'Active'}
                      </Badge>
                      <svg className={`w-5 h-5 text-muted-foreground transition-transform ${expandedId === r.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {expandedId === r.id && (
                    <div className="px-4 pb-4 pt-0 border-t bg-white/5 space-y-3">
                      {editingId === r.id ? (
                        <div className="grid grid-cols-2 gap-3 text-sm pt-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Name</label>
                            <input className="w-full mt-1 p-2 rounded-md bg-white/5 border border-white/10 text-white text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Email</label>
                            <input className="w-full mt-1 p-2 rounded-md bg-white/5 border border-white/10 text-white text-sm" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Phone</label>
                            <input className="w-full mt-1 p-2 rounded-md bg-white/5 border border-white/10 text-white text-sm" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                          </div>
                          <div className="flex items-end gap-2">
                            <Button size="sm" onClick={() => saveEdit(r.id)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3 text-sm pt-3">
                            <div>
                              <span className="text-muted-foreground">Phone:</span>
                              <span className="ml-2 text-white">{r.phone || 'Not provided'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Joined:</span>
                              <span className="ml-2 text-white">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status:</span>
                              <span className={`ml-2 ${r.role !== 'INACTIVE' ? 'text-green-400' : 'text-red-400'}`}>
                                {r.role !== 'INACTIVE' ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">User ID:</span>
                              <span className="ml-2 text-white font-mono text-xs">{r.id}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => toggleActive(r)}>
                              {r.role === 'INACTIVE' ? 'Activate' : 'Deactivate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={deleting === r.id}
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${r.name}?`)) {
                                  deleteReceptionist(r.id)
                                }
                              }}
                            >
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              {deleting === r.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </>
                      )}
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
