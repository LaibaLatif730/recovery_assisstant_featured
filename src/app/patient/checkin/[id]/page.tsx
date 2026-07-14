'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'

interface Analysis {
  id: string
  swellingScore: number
  bruisingScore: number
  rednessScore: number
  asymmetryScore: number
  overallScore: number
  confidenceScore: number
  status: string
  findings: string
  recommendations: string
}

interface CheckInData {
  id: string
  dayNumber: number
  scheduledDate: string
  status: string
  riskLevel: string
  patientMessage: string
  aiResponse: string
  patient: { id: string; firstName: string; lastName: string }
  treatment: { id: string; type: string; productName: string; treatmentDate: string }
  photos: { id: string; imageUrl: string; uploadDate: string; aiAnalyses: Analysis[] }[]
  aiAnalyses: Analysis[]
}

export default function CheckInPage() {
  const params = useParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [checkIn, setCheckIn] = useState<CheckInData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [patientName, setPatientName] = useState('')

  useEffect(() => {
    const name = localStorage.getItem('patientName')
    setPatientName(name || '')
    fetchCheckIn()
  }, [params.id])

  const fetchCheckIn = async () => {
    try {
      const id = (params.id as string).replace(/\s/g, '+')

      const res = await fetch(`/api/patient/checkin?checkInId=${id}`)
      if (!res.ok) {
        router.push('/patient/login')
        return
      }
      const data = await res.json()
      setCheckIn(data)
    } catch (error) {
      console.error('Error fetching check-in:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/patient/auth/logout', { method: 'POST' })
    } catch {}
    localStorage.removeItem('patientName')
    router.push('/patient/login')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !checkIn) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', selectedFile)
      formData.append('checkInId', checkIn.id)
      formData.append('message', message)

      const res = await fetch('/api/patient/checkin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      console.log('Upload response:', data)

      if (res.ok) {
        setUploadResult(data)
        fetchCheckIn()
        setSelectedFile(null)
        setPreviewUrl(null)
        setMessage('')
      } else {
        console.error('Upload failed:', data.error)
        alert('Upload failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
    } finally {
      setUploading(false)
    }
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'badge-glass badge-danger'
      case 'HIGH': return 'badge-glass badge-danger'
      case 'MEDIUM': return 'badge-glass badge-warning'
      default: return 'badge-glass badge-success'
    }
  }

  const getRiskGlow = (level: string) => {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH': return 'glow-danger'
      case 'MEDIUM': return 'glow-primary'
      default: return 'glow-success'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!checkIn || !checkIn.patient || !checkIn.treatment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-strong p-8 text-center">
          <p className="text-white/70">Check-in not found</p>
          <Button onClick={() => router.push('/patient/dashboard')} className="btn-primary mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="bg-orbs" />
      
      {/* Header */}
      <header className="header-glass sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/patient/dashboard')} 
              className="btn-glass"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Button>
            <div className="flex items-center gap-2">
              <span className={`${getRiskBadge(checkIn.riskLevel)}`}>
                {checkIn.riskLevel} Risk
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {checkIn.patient.firstName[0]}{checkIn.patient.lastName[0]}
              </div>
              <span className="text-white/90 font-medium hidden sm:block">{patientName}</span>
            </div>
            <Button onClick={handleLogout} className="btn-danger">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Check-in Info Card */}
        <div className="glass-strong p-6 animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-primary">
              <span className="text-2xl font-bold text-white">D{checkIn.dayNumber}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Day {checkIn.dayNumber} Recovery Check-in</h1>
              <p className="text-white/60">
                {checkIn.treatment.type.replace(/_/g, ' ')} • {formatDate(checkIn.scheduledDate)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-subtle p-4 rounded-xl">
              <p className="text-white/50 text-sm mb-1">Treatment</p>
              <p className="text-white font-medium">{checkIn.treatment.productName || checkIn.treatment.type.replace(/_/g, ' ')}</p>
            </div>
            <div className="glass-subtle p-4 rounded-xl">
              <p className="text-white/50 text-sm mb-1">Treatment Date</p>
              <p className="text-white font-medium">{formatDate(checkIn.treatment.treatmentDate)}</p>
            </div>
            <div className="glass-subtle p-4 rounded-xl">
              <p className="text-white/50 text-sm mb-1">Status</p>
              <p className="text-white font-medium">{checkIn.status}</p>
            </div>
            <div className="glass-subtle p-4 rounded-xl">
              <p className="text-white/50 text-sm mb-1">Patient</p>
              <p className="text-white font-medium">{checkIn.patient.firstName} {checkIn.patient.lastName}</p>
            </div>
          </div>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className={`glass-strong p-6 ${getRiskGlow(uploadResult.riskLevel)} animate-fade-in`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                uploadResult.riskLevel === 'LOW' 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                  : uploadResult.riskLevel === 'MEDIUM'
                  ? 'bg-gradient-to-br from-yellow-500 to-amber-500'
                  : 'bg-gradient-to-br from-red-500 to-rose-500'
              }`}>
                {uploadResult.riskLevel === 'LOW' ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : uploadResult.riskLevel === 'MEDIUM' ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Analysis Complete</h2>
                <p className={`text-sm ${
                  uploadResult.riskLevel === 'LOW' ? 'text-green-300' :
                  uploadResult.riskLevel === 'MEDIUM' ? 'text-yellow-300' : 'text-red-300'
                }`}>
                  {uploadResult.riskLevel === 'LOW' ? 'Recovery looks great!' :
                   uploadResult.riskLevel === 'MEDIUM' ? 'Needs monitoring' : 'Requires attention'}
                </p>
              </div>
              <span className={`${getRiskBadge(uploadResult.riskLevel)} ml-auto`}>
                {uploadResult.riskLevel} Risk
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="glass-subtle p-4 rounded-xl text-center">
                <p className="text-white/50 text-sm mb-2">Overall Score</p>
                <div className={`text-4xl font-bold ${
                  uploadResult.riskLevel === 'LOW' ? 'text-green-400' :
                  uploadResult.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {(uploadResult.analysis.overallScore * 100).toFixed(0)}%
                </div>
              </div>
              <div className="glass-subtle p-4 rounded-xl text-center">
                <p className="text-white/50 text-sm mb-2">Confidence</p>
                <div className="text-4xl font-bold text-white">
                  {(uploadResult.analysis.confidenceScore * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* AI Response Message */}
            <div className={`p-4 rounded-xl mb-6 ${
              uploadResult.riskLevel === 'LOW' ? 'bg-green-500/10 border border-green-500/20' :
              uploadResult.riskLevel === 'MEDIUM' ? 'bg-yellow-500/10 border border-yellow-500/20' :
              'bg-red-500/10 border border-red-500/20'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  uploadResult.riskLevel === 'LOW' ? 'bg-green-500/20' :
                  uploadResult.riskLevel === 'MEDIUM' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                }`}>
                  <svg className={`w-4 h-4 ${
                    uploadResult.riskLevel === 'LOW' ? 'text-green-400' :
                    uploadResult.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className={`text-sm ${
                  uploadResult.riskLevel === 'LOW' ? 'text-green-200' :
                  uploadResult.riskLevel === 'MEDIUM' ? 'text-yellow-200' : 'text-red-200'
                }`}>
                  {uploadResult.aiResponse}
                </p>
              </div>
            </div>

            {/* Next Check-in Scheduled */}
            {uploadResult.nextCheckIn && (
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Next check-in scheduled</p>
                    <p className="text-indigo-300 text-sm">
                      {uploadResult.riskLevel === 'HIGH' ? 'In 12 hours' : 'In 24 hours'} - You'll be reminded to upload a photo
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Escalation Notice */}
            {uploadResult.shouldEscalate && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Doctor notified</p>
                    <p className="text-red-300 text-sm">Our medical team will contact you shortly</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-subtle p-4 rounded-xl">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Findings
                </h3>
                <ul className="space-y-2">
                  {((uploadResult.findings || []) as any[]).map((f: any, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                      <span className={`mt-0.5 ${
                        f.severity === 'significant' ? 'text-red-400' :
                        f.severity === 'mild' ? 'text-yellow-400' : 'text-green-400'
                      }`}>•</span>
                      <span>
                        <span className="font-medium">{f.description}</span>
                        {f.severity !== 'none' && (
                          <span className={`ml-1 text-xs ${
                            f.severity === 'significant' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            ({f.severity})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-subtle p-4 rounded-xl">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {(uploadResult.recommendations || []).map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                      <span className="text-green-400 mt-0.5">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Detected Labels */}
            {uploadResult.visionLabels && uploadResult.visionLabels.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-purple-300 text-sm font-medium">AI Vision Detected</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uploadResult.visionLabels.map((label: any, i: number) => (
                    <span key={i} className="badge-glass badge-info">
                      {label.name} ({Math.round(label.score * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-white/40 text-xs text-center">
                {uploadResult.disclaimer || 'This analysis is generated by AI and should not replace professional medical advice. Always consult your healthcare provider for clinical decisions.'}
              </p>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="glass-strong p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Upload Recovery Photo</h2>
              <p className="text-white/50 text-sm">Take a clear photo of the treated area</p>
            </div>
          </div>

          <div 
            className={`upload-zone mb-6 ${selectedFile ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-xl" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/70 font-medium">Click to take or upload a photo</p>
                  <p className="text-white/40 text-sm mt-1">JPG, PNG up to 10MB</p>
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-white/80 font-medium text-sm block mb-2">How are you feeling? (Optional)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe any symptoms or concerns..."
                className="textarea-glass"
                rows={3}
              />
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="btn-primary w-full h-14 text-lg"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing your photo...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload & Analyze
              </span>
            )}
          </Button>
        </div>

        {/* Previous Photos */}
        {(checkIn.photos || []).length > 0 && (
          <div className="glass p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Uploaded Photos</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(checkIn.photos || []).map((photo) => (
                <div key={photo.id} className="glass-subtle rounded-xl overflow-hidden card-hover">
                  <img
                    src={photo.imageUrl}
                    alt="Recovery photo"
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3">
                    <p className="text-white/50 text-xs">{formatDate(photo.uploadDate)}</p>
                    {(photo.aiAnalyses || [])[0] && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`${getRiskBadge(
                          photo.aiAnalyses[0].overallScore > 0.6 ? 'HIGH' :
                          photo.aiAnalyses[0].overallScore > 0.3 ? 'MEDIUM' : 'LOW'
                        )}`}>
                          {(photo.aiAnalyses[0].overallScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous AI Response */}
        {checkIn.aiResponse && !uploadResult && (
          <div className="glass-strong p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">AI Assessment</h2>
            </div>
            <p className="text-white/80">{checkIn.aiResponse}</p>
          </div>
        )}
      </main>
    </div>
  )
}
