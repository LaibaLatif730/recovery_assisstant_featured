import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    const checkIn = await prisma.recoveryCheckIn.findFirst({
      where: {
        patientId,
        status: 'PENDING',
      },
      orderBy: { scheduledDate: 'asc' },
      select: { id: true },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'No pending check-in found' }, { status: 404 })
    }

    return NextResponse.json({ checkInId: checkIn.id })
  } catch (error) {
    console.error('Error finding pending check-in:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
