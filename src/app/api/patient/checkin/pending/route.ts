import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requirePatientAuth } from '@/lib/patient-auth'

export async function GET() {
  try {
    const { patientId } = await requirePatientAuth()

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
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error finding pending check-in:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
