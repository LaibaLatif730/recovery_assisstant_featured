'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface WhatsAppIntake {
  id: string
  phone: string
  name: string | null
  email: string | null
  reason: string | null
  rawMessage: string | null
  status: string
  reviewedAt: string | null
  reviewedBy: { name: string; email: string } | null
  rejectionReason: string | null
  createdAt: string
}

export default function IntakePage() {
  const [intakes, setIntakes] = useState<WhatsAppIntake[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })

  useEffect(() => {
    fetchIntakes()
  }, [filter])

  const fetchIntakes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/intake?status=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setIntakes(data.intakes)
        if (filter === 'ALL' || filter === 'PENDING') {
          const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
            fetch('/api/intake?status=PENDING&limit=1'),
            fetch('/api/intake?status=APPROVED&limit=1'),
            fetch('/api/intake?status=REJECTED&limit=1'),
          ])
          const [pending, approved, rejected] = await Promise.all([
            pendingRes.json(),
            approvedRes.json(),
            rejectedRes.json(),
          ])
          setStats({
            pending: pending.pagination.total,
            approved: approved.pagination.total,
            rejected: rejected.pagination.total,
            total: pending.pagination.total + approved.pagination.total + rejected.pagination.total,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching intakes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/intake/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        fetchIntakes()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to approve intake')
      }
    } catch (error) {
      console.error('Error approving intake:', error)
      alert('Failed to approve intake')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setProcessingId(rejectModal.id)
    try {
      const res = await fetch(`/api/intake/${rejectModal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (res.ok) {
        setRejectModal(null)
        setRejectReason('')
        fetchIntakes()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to reject intake')
      }
    } catch (error) {
      console.error('Error rejecting intake:', error)
      alert('Failed to reject intake')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
      case 'APPROVED': return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>
      case 'REJECTED': return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WhatsApp Intake</h1>
        <p className="text-muted-foreground">Review and manage patient registration requests from WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={filter === 'PENDING' ? 'ring-2 ring-yellow-500' : ''} onClick={() => setFilter('PENDING')}>
          <CardContent className="p-4 cursor-pointer">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card className={filter === 'APPROVED' ? 'ring-2 ring-green-500' : ''} onClick={() => setFilter('APPROVED')}>
          <CardContent className="p-4 cursor-pointer">
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card className={filter === 'REJECTED' ? 'ring-2 ring-red-500' : ''} onClick={() => setFilter('REJECTED')}>
          <CardContent className="p-4 cursor-pointer">
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
        <Card className={filter === 'ALL' ? 'ring-2 ring-primary' : ''} onClick={() => setFilter('ALL')}>
          <CardContent className="p-4 cursor-pointer">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">All Time</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intake Requests</CardTitle>
          <CardDescription>
            {filter === 'PENDING' ? 'Awaiting review and approval' :
             filter === 'APPROVED' ? 'Successfully onboarded patients' :
             filter === 'REJECTED' ? 'Declined requests' :
             'All intake requests'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : intakes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {filter.toLowerCase()} intake requests
            </div>
          ) : (
            <div className="space-y-4">
              {intakes.map((intake) => (
                <div key={intake.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{intake.name || 'Unknown Name'}</h3>
                        {getStatusBadge(intake.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{intake.phone}</p>
                      {intake.email && (
                        <p className="text-sm text-muted-foreground">{intake.email}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{formatDate(intake.createdAt)}</div>
                      {intake.reviewedAt && (
                        <div>Reviewed: {formatDate(intake.reviewedAt)}</div>
                      )}
                      {intake.reviewedBy && (
                        <div>By: {intake.reviewedBy.name}</div>
                      )}
                    </div>
                  </div>

                  {intake.reason && (
                    <div className="p-3 bg-muted rounded-md">
                      <div className="text-sm font-medium mb-1">Reason for visit:</div>
                      <div className="text-sm">{intake.reason}</div>
                    </div>
                  )}

                  {intake.rejectionReason && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                      <div className="text-sm font-medium mb-1 text-red-500">Rejection reason:</div>
                      <div className="text-sm">{intake.rejectionReason}</div>
                    </div>
                  )}

                  {intake.status === 'PENDING' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(intake.id)}
                        disabled={processingId === intake.id}
                      >
                        {processingId === intake.id ? 'Processing...' : 'Approve & Create Patient'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectModal({ id: intake.id, name: intake.name || intake.phone })}
                        disabled={processingId === intake.id}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Intake Request</CardTitle>
              <CardDescription>
                Are you sure you want to reject the request from {rejectModal.name}?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason for rejection (optional)</label>
                <textarea
                  className="w-full mt-1 p-2 rounded-md bg-white/5 border border-white/10 text-white h-20"
                  placeholder="e.g., Spam, incomplete information, invalid phone number..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectModal(null)
                    setRejectReason('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processingId === rejectModal.id}
                >
                  {processingId === rejectModal.id ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
