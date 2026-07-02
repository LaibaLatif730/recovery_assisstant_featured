'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Protocol {
  id: string
  procedureType: string
  category: string
  substance: string | null
  typicalVolumes: string | null
  recoveryTimeline: string
  normalSymptoms: string
  warningSigns: string
  emergencySigns: string
  followUpSchedule: string
  contraindications: string
  postProcedureInstructions: string
}

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null)

  useEffect(() => { fetchProtocols() }, [])

  const fetchProtocols = async () => {
    try {
      const res = await fetch('/api/protocols')
      if (res.ok) {
        const data = await res.json()
        setProtocols(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching protocols:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseJsonArray = (str: string): string[] => {
    try { return JSON.parse(str) } catch { return [] }
  }

  const parseSchedule = (str: string): { day: number; type: string; purpose: string }[] => {
    try { return JSON.parse(str) } catch { return [] }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Treatment Protocols</h1>
        <p className="text-muted-foreground">Evidence-based procedure protocols and recovery guidelines</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Protocol Library</CardTitle><CardDescription>Standardized protocols for each procedure type</CardDescription></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : protocols.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No protocols configured</p>
          ) : (
            <div className="space-y-4">
              {protocols.map(protocol => (
                <div key={protocol.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 hover:bg-white/5 cursor-pointer flex items-center justify-between" onClick={() => setExpandedProtocol(expandedProtocol === protocol.id ? null : protocol.id)}>
                    <div>
                      <h3 className="font-medium">{protocol.procedureType.replace(/_/g, ' ')}</h3>
                      <p className="text-sm text-muted-foreground">{protocol.category} {protocol.substance && `• ${protocol.substance}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {protocol.typicalVolumes && <Badge variant="outline">{protocol.typicalVolumes}</Badge>}
                      <Button variant="ghost" size="sm">{expandedProtocol === protocol.id ? '▲' : '▼'}</Button>
                    </div>
                  </div>

                  {expandedProtocol === protocol.id && (
                    <div className="p-4 border-t space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Normal Symptoms</h4>
                          <ul className="text-sm space-y-1">
                            {parseJsonArray(protocol.normalSymptoms).map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-yellow-600">Warning Signs</h4>
                          <ul className="text-sm space-y-1">
                            {parseJsonArray(protocol.warningSigns).map((s, i) => <li key={i} className="text-yellow-400">• {s}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-red-600">Emergency Signs</h4>
                          <ul className="text-sm space-y-1">
                            {parseJsonArray(protocol.emergencySigns).map((s, i) => <li key={i} className="text-red-400">• {s}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Contraindications</h4>
                          <ul className="text-sm space-y-1">
                            {parseJsonArray(protocol.contraindications).map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Follow-up Schedule</h4>
                        <div className="flex flex-wrap gap-2">
                          {parseSchedule(protocol.followUpSchedule).map((s, i) => (
                            <Badge key={i} variant="outline">Day {s.day}: {s.purpose}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Post-Procedure Instructions</h4>
                        <ul className="text-sm space-y-1">
                          {parseJsonArray(protocol.postProcedureInstructions).map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}
                        </ul>
                      </div>
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
