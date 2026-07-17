'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface AdminData {
  totalDoctors: number
  totalReceptionists: number
  totalPatients: number
  totalTreatments: number
  totalAppointments: number
  recentPatients: number
  recentTreatments: number
  recentAppointments: number
  unreportedComplications: number
  staffActivity: {
    id: string
    action: string
    entity: string
    entityId: string | null
    createdAt: string
    user: { name: string; role: string } | null
  }[]
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [digest, setDigest] = useState('')
  const [loadingDigest, setLoadingDigest] = useState(false)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fetchDigest = async () => {
    setLoadingDigest(true)
    try {
      const res = await fetch('/api/admin/activity-digest')
      const d = await res.json()
      if (res.ok) setDigest(d.digest)
    } catch {}
    finally { setLoadingDigest(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-8 text-muted-foreground">Failed to load dashboard</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-muted-foreground">Staff & system overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalDoctors}</div>
            <p className="text-xs text-muted-foreground">Active staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receptionists</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalReceptionists}</div>
            <p className="text-xs text-muted-foreground">Active staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPatients}</div>
            <p className="text-xs text-muted-foreground">+{data.recentPatients} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unreported</CardTitle>
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.unreportedComplications}</div>
            <p className="text-xs text-muted-foreground">Complications pending regulatory report</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">30-Day Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Patients added</span><span className="font-medium">{data.recentPatients}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Treatments logged</span><span className="font-medium">{data.recentTreatments}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Appointments booked</span><span className="font-medium">{data.recentAppointments}</span></div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">AI Weekly Digest</CardTitle>
              <CardDescription>AI-generated activity summary</CardDescription>
            </div>
            <button onClick={fetchDigest} className="text-xs text-primary hover:underline" disabled={loadingDigest}>
              {loadingDigest ? 'Generating...' : digest ? 'Refresh' : 'Generate'}
            </button>
          </CardHeader>
          <CardContent>
            {digest ? (
              <p className="text-sm whitespace-pre-wrap">{digest}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Click "Generate" for an AI summary of this week's clinic activity.</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Staff Activity Log</CardTitle>
            <CardDescription>Recent actions across all staff</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.staffActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                data.staffActivity.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                    <div>
                      <span className="font-medium">{log.user?.name || 'System'}</span>
                      <span className="text-muted-foreground ml-2">{log.action} {log.entity}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
