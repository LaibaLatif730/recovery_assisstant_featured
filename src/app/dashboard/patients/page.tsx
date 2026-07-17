'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  isActive: boolean
  createdAt: string
  _count: {
    treatments: number
    checkIns: number
    appointments: number
  }
}

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userRole, setUserRole] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPatients()
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUserRole(d.role))
  }, [])

  const fetchPatients = async () => {
    try {
      const res = await fetch(`/api/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      const data = await res.json()
      setPatients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching patients:', error)
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPatients()
  }

  const deletePatient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    setDeletingId(id)
    try {
      await fetch(`/api/patients/${id}`, { method: 'DELETE' })
      fetchPatients()
    } catch (error) {
      console.error('Error deleting patient:', error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Patients</h1>
          <p className="text-muted-foreground">Manage your patient records</p>
        </div>
        {(userRole === 'ADMIN' || userRole === 'DOCTOR' || userRole === 'RECEPTIONIST') && (
          <Link href="/dashboard/patients/new">
            <Button>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Patient
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              placeholder="Search patients by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="outline">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8">
              <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-muted-foreground">No patients found</p>
              {(userRole === 'ADMIN' || userRole === 'DOCTOR' || userRole === 'RECEPTIONIST') && (
                <Link href="/dashboard/patients/new" className="mt-4 inline-block">
                  <Button>Add your first patient</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 rounded-lg border hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-medium text-primary">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{patient.firstName} {patient.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{patient.email || patient.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm"><span className="font-medium">{patient._count.treatments}</span> treatments</p>
                        <p className="text-sm text-muted-foreground">{patient._count.checkIns} check-ins</p>
                      </div>
                      <Badge variant="outline">{patient.gender || 'N/A'}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/patients/${patient.id}`)
                        }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
        {(userRole === 'ADMIN' || userRole === 'DOCTOR' || userRole === 'RECEPTIONIST') && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingId === patient.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePatient(patient.id, `${patient.firstName} ${patient.lastName}`)
                          }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
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
