import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyPin, setPatientSessionCookie } from '@/lib/patient-auth'

function normalize(s: string) {
  return s.replace(/[^0-9]/g, '')
}

const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = attempts.get(key)

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false
  }

  record.count++
  return true
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone, pin } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const normalizedPhone = normalize(phone)

    if (!checkRateLimit(normalizedPhone)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 })
    }

    const patient = await prisma.patient.findFirst({
      where: { isActive: true, phone: { contains: normalizedPhone.slice(-10) } },
      select: { id: true, firstName: true, lastName: true, phone: true, pinHash: true, pinSetAt: true },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!patient.pinHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPin(pin, patient.pinHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    attempts.delete(normalizedPhone)

    await setPatientSessionCookie(patient.id)

    return NextResponse.json({
      name: `${patient.firstName} ${patient.lastName}`,
    })
  } catch (error) {
    console.error('Patient auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
