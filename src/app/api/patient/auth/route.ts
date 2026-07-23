import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { setPatientSessionCookie } from '@/lib/patient-auth'

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
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const patient = await prisma.patient.findFirst({
      where: { isActive: true, email: normalizedEmail },
      select: { id: true, firstName: true, lastName: true, email: true, passwordHash: true },
    })

    if (patient && patient.passwordHash) {
      const valid = await bcrypt.compare(password, patient.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }
      attempts.delete(normalizedEmail)
      await setPatientSessionCookie(patient.id)
      return NextResponse.json({ name: `${patient.firstName} ${patient.lastName}` })
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, password: true, role: true },
    })

    if (!user || user.role !== 'PATIENT' || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    let patientRecord = await prisma.patient.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (!patientRecord) {
      const nameParts = user.name?.trim().split(/\s+/) || ['Patient']
      patientRecord = await prisma.patient.create({
        data: {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || nameParts[0],
          email: user.email,
          isActive: true,
          consentGiven: true,
          consentDate: new Date(),
        },
      })
    }

    attempts.delete(normalizedEmail)
    await setPatientSessionCookie(patientRecord.id)

    return NextResponse.json({ name: user.name })
  } catch (error) {
    console.error('Patient auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
