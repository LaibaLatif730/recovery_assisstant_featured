'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  createdAt: string
  _count: {
    treatments: number
    checkIns: number
    appointments: number
  }
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPatients()
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Patients</h1>
          <p className="text-muted-foreground">Manage your patient records</p>
        </div>
        <Link href="/dashboard/patients/new">
          <Button>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Patient
          </Button>
        </Link>
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
              <Link href="/dashboard/patients/new" className="mt-4 inline-block">
                <Button>Add your first patient</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {patients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/dashboard/patients/${patient.id}`}
                  className="block p-4 rounded-lg border hover:bg-white/5 transition-colors"
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
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
