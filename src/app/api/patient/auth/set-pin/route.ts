import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { setPatientSessionCookie } from '@/lib/patient-auth'

export async function POST(req: Request) {
  try {
    const { email, password, passwordConfirm } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    if (passwordConfirm && password !== passwordConfirm) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const patient = await prisma.patient.findFirst({
      where: { isActive: true, email: normalizedEmail },
      select: { id: true, passwordHash: true },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (patient.passwordHash) {
      return NextResponse.json({ error: 'Password already set' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.patient.update({
      where: { id: patient.id },
      data: { passwordHash, passwordSetAt: new Date() },
    })

    await setPatientSessionCookie(patient.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
  }
}
