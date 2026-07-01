'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Analytics {
  totalPatients: number
  totalTreatments: number
  totalAppointments: number
  completedCheckIns: number
  pendingCheckIns: number
  escalatedCheckIns: number
  riskDistribution: { level: string; count: number }[]
  treatmentTypeDistribution: { type: string; count: number }[]
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics')
      const data = await res.json()
      setAnalytics(data)
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
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-muted-foreground">Clinic performance insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.completedCheckIns && analytics.pendingCheckIns
                ? Math.round((analytics.completedCheckIns / (analytics.completedCheckIns + analytics.pendingCheckIns)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Check-in completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctor Intervention Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.escalatedCheckIns && analytics.completedCheckIns
                ? Math.round((analytics.escalatedCheckIns / (analytics.completedCheckIns + analytics.escalatedCheckIns)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Cases requiring review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatment Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalAppointments && analytics.totalTreatments
                ? Math.round((analytics.totalTreatments / analytics.totalAppointments) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Treatments per appointment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">Registered patients</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Patient recovery risk levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.riskDistribution.map((risk) => (
                <div key={risk.level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      risk.level === 'CRITICAL' ? 'destructive' :
                      risk.level === 'HIGH' ? 'destructive' :
                      risk.level === 'MEDIUM' ? 'secondary' : 'outline'
                    }>
                      {risk.level}
                    </Badge>
                    <span className="text-sm font-medium">{risk.count}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        risk.level === 'CRITICAL' ? 'bg-red-600' :
                        risk.level === 'HIGH' ? 'bg-orange-500' :
                        risk.level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{
                        width: `${analytics?.riskDistribution
                          ? (risk.count / Math.max(...analytics.riskDistribution.map(r => r.count), 1)) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              ))}
              {(!analytics?.riskDistribution || analytics.riskDistribution.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No risk data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Treatment Types</CardTitle>
            <CardDescription>Distribution of treatments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.treatmentTypeDistribution.map((treatment) => (
                <div key={treatment.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{treatment.type.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium">{treatment.count}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${analytics?.treatmentTypeDistribution
                          ? (treatment.count / Math.max(...analytics.treatmentTypeDistribution.map(t => t.count), 1)) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              ))}
              {(!analytics?.treatmentTypeDistribution || analytics.treatmentTypeDistribution.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No treatment data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">{analytics?.totalPatients || 0}</div>
              <p className="text-sm text-muted-foreground">Total Patients</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">{analytics?.totalTreatments || 0}</div>
              <p className="text-sm text-muted-foreground">Total Treatments</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">{analytics?.totalAppointments || 0}</div>
              <p className="text-sm text-muted-foreground">Total Appointments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
