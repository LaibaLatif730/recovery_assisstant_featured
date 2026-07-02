'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Analytics {
  totalPatients: number
  totalTreatments: number
  totalAppointments: number
  completedCheckIns: number
  pendingCheckIns: number
  escalatedCheckIns: number
  riskDistribution: { level: string; count: number }[]
  recentAlerts: any[]
  complications: { total: number; active: number; vascular: number }
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics')
      const data = await res.json()
      if (data && !data.error) setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Clinical Dashboard</h1>
        <p className="text-muted-foreground">Clinical decision support overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">Active patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatments</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalTreatments || 0}</div>
            <p className="text-xs text-muted-foreground">Total procedures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.pendingCheckIns || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting clinician review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated Cases</CardTitle>
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics?.escalatedCheckIns || 0}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clinical Risk Distribution</CardTitle>
            <CardDescription>Patient recovery risk classification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.riskDistribution.map((risk) => (
                <div key={risk.level} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      risk.level === 'RED' ? 'destructive' :
                      risk.level === 'ORANGE' ? 'destructive' :
                      risk.level === 'YELLOW' ? 'secondary' : 'outline'
                    }>
                      {risk.level}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {risk.level === 'GREEN' ? 'Normal Recovery' :
                       risk.level === 'YELLOW' ? 'Needs Review (24h)' :
                       risk.level === 'ORANGE' ? 'Priority Review (4h)' : 'Immediate Alert'}
                    </span>
                  </div>
                  <span className="font-medium">{risk.count}</span>
                </div>
              ))}
              {(!analytics?.riskDistribution || analytics.riskDistribution.length === 0) && (
                <p className="text-sm text-muted-foreground">No risk data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clinical Alerts</CardTitle>
            <CardDescription>Patients requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.recentAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{alert.patient.firstName} {alert.patient.lastName}</p>
                    <p className="text-sm text-muted-foreground">Day {alert.dayNumber} check-in</p>
                  </div>
                  <Badge variant={alert.riskLevel === 'RED' || alert.riskLevel === 'ORANGE' ? 'destructive' : 'secondary'}>
                    {alert.riskLevel}
                  </Badge>
                </div>
              ))}
              {(!analytics?.recentAlerts || analytics.recentAlerts.length === 0) && (
                <p className="text-sm text-muted-foreground">No recent alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Clinical Actions</CardTitle>
          <CardDescription>Quick access to clinical workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/dashboard/patients/new" className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-white/5 transition-colors">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="text-sm font-medium text-white">Add Patient</span>
            </Link>
            <Link href="/dashboard/injection-mapping" className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-white/5 transition-colors">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="text-sm font-medium text-white">Injection Map</span>
            </Link>
            <Link href="/dashboard/complications" className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-white/5 transition-colors">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium text-white">Complications</span>
            </Link>
            <Link href="/dashboard/documents" className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-white/5 transition-colors">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-white">Documents</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
