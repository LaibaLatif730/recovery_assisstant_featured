'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export default function CompliancePage() {
  const [activeSection, setActiveSection] = useState('hipaa')

  const sections = [
    { id: 'hipaa', label: 'HIPAA' },
    { id: 'gdpr', label: 'GDPR' },
    { id: 'security', label: 'Security' },
    { id: 'audit', label: 'Audit Trail' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Compliance & Security</h1>
        <p className="text-muted-foreground">HIPAA, GDPR, and data security settings</p>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {sections.map(s => (
          <Button key={s.id} variant={activeSection === s.id ? 'default' : 'ghost'} onClick={() => setActiveSection(s.id)}>{s.label}</Button>
        ))}
      </div>

      {activeSection === 'hipaa' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>HIPAA Compliance</CardTitle><CardDescription>Health Insurance Portability and Accountability Act</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg"><Badge variant="default">Enabled</Badge><h4 className="font-medium mt-2">PHI Encryption at Rest</h4><p className="text-sm text-muted-foreground">AES-256 encryption for all patient data</p></div>
                <div className="p-4 border rounded-lg"><Badge variant="default">Enabled</Badge><h4 className="font-medium mt-2">PHI Encryption in Transit</h4><p className="text-sm text-muted-foreground">TLS 1.3 for all data transmission</p></div>
                <div className="p-4 border rounded-lg"><Badge variant="default">Enabled</Badge><h4 className="font-medium mt-2">Access Controls (RBAC)</h4><p className="text-sm text-muted-foreground">Role-based access with minimum necessary principle</p></div>
                <div className="p-4 border rounded-lg"><Badge variant="default">Enabled</Badge><h4 className="font-medium mt-2">Audit Logging</h4><p className="text-sm text-muted-foreground">All PHI access logged with user, timestamp, action</p></div>
                <div className="p-4 border rounded-lg"><Badge variant="default">Enabled</Badge><h4 className="font-medium mt-2">Automatic Session Timeout</h4><p className="text-sm text-muted-foreground">Sessions expire after 30 minutes of inactivity</p></div>
                <div className="p-4 border rounded-lg"><Badge variant="secondary">Configured</Badge><h4 className="font-medium mt-2">Breach Notification</h4><p className="text-sm text-muted-foreground">Automated breach detection and notification workflow</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Data Retention Policy</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded-lg"><span>Patient Records</span><Badge>10 years from last treatment</Badge></div>
              <div className="flex justify-between items-center p-3 border rounded-lg"><span>Clinical Photos</span><Badge>7 years from last treatment</Badge></div>
              <div className="flex justify-between items-center p-3 border rounded-lg"><span>Audit Logs</span><Badge>Indefinite</Badge></div>
              <div className="flex justify-between items-center p-3 border rounded-lg"><span>Consent Records</span><Badge>Duration of treatment + 10 years</Badge></div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === 'gdpr' && (
        <Card>
          <CardHeader><CardTitle>GDPR Compliance</CardTitle><CardDescription>General Data Protection Regulation</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg"><Badge variant="default">Enabled</Badge><h4 className="font-medium mt-2">Lawful Basis Documented</h4><p className="text-sm text-muted-foreground">Consent or legitimate interest recorded per data processing activity</p></div>
              <div className="p-4 border rounded-lg"><Badge variant="default">Enabled</Badge><h4 className="font-medium mt-2">Data Minimization</h4><p className="text-sm text-muted-foreground">Only necessary data collected for stated purposes</p></div>
              <div className="p-4 border rounded-lg"><Badge variant="default">Enabled</Badge><h4 className="font-medium mt-2">Right to Access</h4><p className="text-sm text-muted-foreground">Patient data export capability available</p></div>
              <div className="p-4 border rounded-lg"><Badge variant="default">Enabled</Badge><h4 className="font-medium mt-2">Right to Erasure</h4><p className="text-sm text-muted-foreground">Patient data deletion capability (subject to legal retention)</p></div>
              <div className="p-4 border rounded-lg"><Badge variant="default">Enabled</Badge><h4 className="font-medium mt-2">Data Portability</h4><p className="text-sm text-muted-foreground">Standard format data export (JSON/CSV)</p></div>
              <div className="p-4 border rounded-lg"><Badge variant="secondary">Configured</Badge><h4 className="font-medium mt-2">DPIA Completed</h4><p className="text-sm text-muted-foreground">Data Protection Impact Assessment for high-risk processing</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'security' && (
        <Card>
          <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg"><Badge variant="default">Active</Badge><h4 className="font-medium mt-2">Multi-Factor Authentication</h4><p className="text-sm text-muted-foreground">TOTP-based MFA for all clinical staff</p></div>
              <div className="p-4 border rounded-lg"><Badge variant="default">Active</Badge><h4 className="font-medium mt-2">Password Policy</h4><p className="text-sm text-muted-foreground">Minimum 8 characters, complexity requirements</p></div>
              <div className="p-4 border rounded-lg"><Badge variant="default">Active</Badge><h4 className="font-medium mt-2">API Rate Limiting</h4><p className="text-sm text-muted-foreground">100 requests per minute per user</p></div>
              <div className="p-4 border rounded-lg"><Badge variant="default">Active</Badge><h4 className="font-medium mt-2">WAF Protection</h4><p className="text-sm text-muted-foreground">Cloudflare WAF enabled</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'audit' && (
        <Card>
          <CardHeader><CardTitle>Audit Trail</CardTitle><CardDescription>Complete logging of all clinical actions</CardDescription></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">All user actions are logged with: User ID, Timestamp, Action, Resource, IP Address, Details.</p>
            <div className="space-y-2">
              <div className="flex justify-between p-2 border rounded text-sm"><span className="text-muted-foreground">Patient data access</span><Badge variant="outline">Logged</Badge></div>
              <div className="flex justify-between p-2 border rounded text-sm"><span className="text-muted-foreground">Photo uploads</span><Badge variant="outline">Logged</Badge></div>
              <div className="flex justify-between p-2 border rounded text-sm"><span className="text-muted-foreground">AI assessments</span><Badge variant="outline">Logged</Badge></div>
              <div className="flex justify-between p-2 border rounded text-sm"><span className="text-muted-foreground">Clinical notes</span><Badge variant="outline">Logged</Badge></div>
              <div className="flex justify-between p-2 border rounded text-sm"><span className="text-muted-foreground">Consent changes</span><Badge variant="outline">Logged</Badge></div>
              <div className="flex justify-between p-2 border rounded text-sm"><span className="text-muted-foreground">Login/logout</span><Badge variant="outline">Logged</Badge></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
