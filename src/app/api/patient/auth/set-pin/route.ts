import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { hashPin, setPatientSessionCookie } from '@/lib/patient-auth'

function normalize(s: string) {
  return s.replace(/[^0-9]/g, '')
}

export async function POST(req: Request) {
  try {
    const { phone, pin, pinConfirm } = await req.json()

    if (!phone || !pin) {
      return NextResponse.json({ error: 'Phone and PIN are required' }, { status: 400 })
    }

    if (pin.length < 4 || pin.length > 6) {
      return NextResponse.json({ error: 'PIN must be 4-6 digits' }, { status: 400 })
    }

    if (!/^\d+$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must contain only numbers' }, { status: 400 })
    }

    if (pinConfirm && pin !== pinConfirm) {
      return NextResponse.json({ error: 'PINs do not match' }, { status: 400 })
    }

    const normalizedPhone = normalize(phone)

    const patient = await prisma.patient.findFirst({
      where: { isActive: true, phone: { contains: normalizedPhone.slice(-10) } },
      select: { id: true, pinHash: true },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (patient.pinHash) {
      return NextResponse.json({ error: 'PIN already set' }, { status: 400 })
    }

    const pinHash = await hashPin(pin)

    await prisma.patient.update({
      where: { id: patient.id },
      data: { pinHash, pinSetAt: new Date() },
    })

    await setPatientSessionCookie(patient.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set PIN error:', error)
    return NextResponse.json({ error: 'Failed to set PIN' }, { status: 500 })
  }
}
