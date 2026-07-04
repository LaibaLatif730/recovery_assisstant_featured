import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const normalize = (s: string) => s.replace(/[^0-9]/g, '')
    const normalizedInput = normalize(phone)

    const patients = await prisma.patient.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true, phone: true },
    })

    const patient = patients.find(p => p.phone && normalize(p.phone) === normalizedInput)

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({
      patientId: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
    })
  } catch (error) {
    console.error('Patient auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
