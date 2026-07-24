'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const RISK_COLORS: Record<string, string> = {
  GREEN: '#22c55e', YELLOW: '#eab308', ORANGE: '#f97316', RED: '#ef4444',
}

interface Props {
  riskDistribution: { level: string; count: number }[]
  complicationStats: { type: string; count: number }[]
  weeklyTrend: { date: string; count: number }[]
  treatmentTypeDistribution: { type: string; count: number }[]
}

export default function Charts({ riskDistribution = [], complicationStats = [], weeklyTrend = [], treatmentTypeDistribution = [] }: Props) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Risk Distribution" desc="Patient recovery classification">
          {riskDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="level">
                  {riskDistribution.map((e, i) => <Cell key={i} fill={RISK_COLORS[e.level] || '#6b7280'} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty msg="No risk data" />}
        </Card>
        <Card title="Complications" desc="Incident tracking">
          {complicationStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complicationStats}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="type" tick={{ fontSize: 12 }} /><YAxis /><Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty msg="No complications" />}
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Check-in Activity" desc="Weekly submissions">
          {weeklyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis /><Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty msg="No data" />}
        </Card>
        <Card title="Treatment Types" desc="Procedures performed">
          {treatmentTypeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={treatmentTypeDistribution}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="type" tick={{ fontSize: 12 }} /><YAxis /><Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty msg="No data" />}
        </Card>
      </div>
    </>
  )
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
      <div className="p-6 pb-0"><h3 className="text-xl font-bold text-white">{title}</h3><p className="text-sm text-white/60">{desc}</p></div>
      <div className="p-6 pt-0">{children}</div>
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-sm text-muted-foreground text-center py-12">{msg}</p>
}
