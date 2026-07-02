'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface QueryResult {
  intent: string
  query: string
  count: number
  patients?: any[]
  checkIns?: any[]
  complications?: any[]
  message?: string
  suggestions?: string[]
}

const SUGGESTED_QUERIES = [
  'Show all patients with prolonged swelling over 10 days',
  'Which lip filler patients missed Day 5 check-in?',
  'Show all vascular occlusion alerts this month',
  'Find all complications by product batch',
  'Show patients with active complications',
  'Which patients need follow-up this week?',
]

export default function ClinicalQueriesPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [history, setHistory] = useState<{ query: string; result: QueryResult }[]>([])

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/clinical-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()
      setResult(data)
      setHistory(prev => [{ query: q, result: data }, ...prev.slice(0, 9)])
    } catch (error) {
      console.error('Error executing query:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Clinical Knowledge Assistant</h1>
        <p className="text-muted-foreground">Ask clinical questions in natural language</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a clinical question... e.g., Show all patients with prolonged swelling"
              className="flex-1"
            />
            <Button onClick={() => handleSearch()} disabled={loading || !query.trim()}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {SUGGESTED_QUERIES.map((q, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => { setQuery(q); handleSearch(q) }}
              >
                {q}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Results</CardTitle>
              <Badge variant="outline">{result.count} found</Badge>
            </div>
            <CardDescription>{result.intent.replace(/_/g, ' ')}</CardDescription>
          </CardHeader>
          <CardContent>
            {result.patients && result.patients.length > 0 && (
              <div className="space-y-3">
                {result.patients.map((p: any) => (
                  <div key={p.id} className="p-3 border rounded-lg hover:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.phone && <p className="text-sm text-muted-foreground">{p.phone}</p>}
                      </div>
                      <div className="flex gap-2">
                        {p.treatments?.map((t: any, i: number) => (
                          <Badge key={i} variant="secondary">{t.type?.replace(/_/g, ' ')}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.checkIns && result.checkIns.length > 0 && (
              <div className="space-y-3">
                {result.checkIns.map((ci: any) => (
                  <div key={ci.id} className="p-3 border rounded-lg hover:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{ci.patient}</p>
                        <p className="text-sm text-muted-foreground">
                          Day {ci.dayNumber} • {ci.treatment} • Scheduled: {new Date(ci.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">{ci.phone}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.complications && result.complications.length > 0 && (
              <div className="space-y-3">
                {result.complications.map((c: any) => (
                  <div key={c.id} className="p-3 border rounded-lg hover:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{c.patient}</p>
                        <p className="text-sm text-muted-foreground">
                          {c.type?.replace(/_/g, ' ')} • {c.severity} • {new Date(c.onsetDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={c.severity === 'CRITICAL' || c.severity === 'SEVERE' ? 'destructive' : 'secondary'}>
                        {c.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.message && (
              <p className="text-muted-foreground">{result.message}</p>
            )}

            {result.suggestions && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Try these queries:</p>
                <div className="flex flex-wrap gap-2">
                  {result.suggestions.map((s, i) => (
                    <Button key={i} variant="outline" size="sm" onClick={() => { setQuery(s); handleSearch(s) }}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-white/5 cursor-pointer" onClick={() => { setQuery(h.query); handleSearch(h.query) }}>
                  <span className="text-sm">{h.query}</span>
                  <Badge variant="outline">{h.result.count} results</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
