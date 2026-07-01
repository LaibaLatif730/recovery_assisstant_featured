import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const patient = await prisma.patient.findFirst({
      where: {
        phone: phone,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    })

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
