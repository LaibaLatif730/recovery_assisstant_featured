'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/FieldError'

export default function PatientLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'pin' | 'set-pin'>('phone')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')

  const validatePhone = (value: string): boolean => {
    const cleaned = value.replace(/[\s\-()+\s]/g, '')
    if (!cleaned) {
      setFieldError('Phone number is required')
      return false
    }
    if (!/^\d+$/.test(cleaned)) {
      setFieldError('Phone must contain only digits')
      return false
    }
    if (cleaned.length < 7 || cleaned.length > 15) {
      setFieldError('Phone must be 7-15 digits')
      return false
    }
    setFieldError('')
    return true
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validatePhone(phone)) return
    setStep('pin')
  }

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!pin || pin.length < 4) {
      setFieldError('PIN must be at least 4 digits')
      return
    }
    setFieldError('')

    setLoading(true)
    try {
      const res = await fetch('/api/patient/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      })

      if (res.ok) {
        router.push('/patient/dashboard')
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid credentials')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldError('')

    if (pin.length < 4 || pin.length > 6) {
      setFieldError('PIN must be 4-6 digits')
      return
    }
    if (!/^\d+$/.test(pin)) {
      setFieldError('PIN must contain only numbers')
      return
    }
    if (pin !== pinConfirm) {
      setFieldError('PINs do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/patient/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin, pinConfirm }),
      })

      if (res.ok) {
        router.push('/patient/dashboard')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to set PIN')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="bg-orbs" />

      <div className="absolute top-8 left-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-white">AI Clinic</span>
      </div>

      <div className="glass-strong w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto mb-6 glow-accent">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Patient Portal</h1>
          <p className="text-white/60">
            {step === 'phone' && 'Enter your phone number to sign in'}
            {step === 'pin' && 'Enter your PIN'}
            {step === 'set-pin' && 'Set your 4-6 digit PIN'}
          </p>
        </div>

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 block">Phone Number</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <Input
                  type="tel"
                  placeholder="+1-555-0101"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-glass pl-12"
                  required
                />
              </div>
              <FieldError error={fieldError} />
            </div>
            <Button type="submit" className="btn-primary w-full h-14 text-lg" disabled={loading}>
              <span className="flex items-center justify-center gap-2">
                Continue
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Button>
          </form>
        )}

        {step === 'pin' && (
          <form onSubmit={handlePinLogin} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 block">Enter your PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="input-glass text-center text-2xl tracking-[0.5em]"
                autoFocus
                required
              />
              <FieldError error={fieldError} />
            </div>
            <Button type="submit" className="btn-primary w-full h-14 text-lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </Button>
            <div className="flex justify-between">
              <button type="button" onClick={() => { setStep('phone'); setPin(''); setError('') }} className="text-sm text-white/50 hover:text-white/80 transition-colors">
                Change phone
              </button>
              <button type="button" onClick={() => { setStep('set-pin'); setPin(''); setPinConfirm(''); setError('') }} className="text-sm text-white/50 hover:text-white/80 transition-colors">
                First time? Set PIN
              </button>
            </div>
          </form>
        )}

        {step === 'set-pin' && (
          <form onSubmit={handleSetPin} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm">
              This is your first time signing in. Please set a 4-6 digit PIN to secure your account.
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 block">Create PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="4-6 digits"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="input-glass text-center text-2xl tracking-[0.5em]"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 block">Confirm PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Confirm PIN"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                className="input-glass text-center text-2xl tracking-[0.5em]"
                required
              />
              <FieldError error={fieldError} />
            </div>
            <Button type="submit" className="btn-primary w-full h-14 text-lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Setting PIN...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Set PIN & Sign In
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </Button>
            <button type="button" onClick={() => { setStep('pin'); setPin(''); setPinConfirm(''); setError('') }} className="w-full text-sm text-white/50 hover:text-white/80 transition-colors">
              Back to sign in
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-white/50 hover:text-white/80 transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Staff Login
          </a>
        </div>
      </div>
    </div>
  )
}
