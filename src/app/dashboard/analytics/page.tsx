'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'

const Charts = dynamic(() => import('./charts'), { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div> })

interface Analytics {
  totalPatients: number
  totalTreatments: number
  totalAppointments: number
  completedCheckIns: number
  pendingCheckIns: number
  escalatedCheckIns: number
  riskDistribution: { level: string; count: number }[]
  treatmentTypeDistribution: { type: string; count: number }[]
  complicationStats: { type: string; count: number }[]
  weeklyTrend: { date: string; count: number }[]
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => { setAnalytics(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    if (!analytics) return { responseRate: 0, interventionRate: 0 }
    const total = (analytics.completedCheckIns || 0) + (analytics.pendingCheckIns || 0) + (analytics.escalatedCheckIns || 0)
    return {
      responseRate: total > 0 ? Math.round((analytics.completedCheckIns / total) * 100) : 0,
      interventionRate: total > 0 ? Math.round((analytics.escalatedCheckIns / total) * 100) : 0,
    }
  }, [analytics])

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-white">Clinical Analytics</h1></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><div className="h-8 w-20 bg-white/10 rounded animate-pulse mb-2"></div><div className="h-4 w-32 bg-white/5 rounded animate-pulse"></div></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Clinical Analytics</h1>
        <p className="text-muted-foreground">Practice performance and outcome metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Response Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.responseRate}%</div><p className="text-xs text-muted-foreground">Check-in completion</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Intervention Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.interventionRate}%</div><p className="text-xs text-muted-foreground">Cases requiring review</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Patients</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{analytics?.totalPatients || 0}</div><p className="text-xs text-muted-foreground">Registered</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Treatments</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{analytics?.totalTreatments || 0}</div><p className="text-xs text-muted-foreground">Procedures</p></CardContent></Card>
      </div>

      <Charts
        riskDistribution={analytics?.riskDistribution || []}
        complicationStats={analytics?.complicationStats || []}
        weeklyTrend={analytics?.weeklyTrend || []}
        treatmentTypeDistribution={analytics?.treatmentTypeDistribution || []}
      />

      <Card>
        <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg"><div className="text-3xl font-bold text-primary">{analytics?.totalPatients || 0}</div><p className="text-sm text-muted-foreground">Patients</p></div>
            <div className="text-center p-4 border rounded-lg"><div className="text-3xl font-bold text-primary">{analytics?.totalTreatments || 0}</div><p className="text-sm text-muted-foreground">Treatments</p></div>
            <div className="text-center p-4 border rounded-lg"><div className="text-3xl font-bold text-primary">{analytics?.totalAppointments || 0}</div><p className="text-sm text-muted-foreground">Appointments</p></div>
            <div className="text-center p-4 border rounded-lg"><div className="text-3xl font-bold text-primary">{analytics?.completedCheckIns || 0}</div><p className="text-sm text-muted-foreground">Check-ins</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
