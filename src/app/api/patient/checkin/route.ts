import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const checkInId = searchParams.get('checkInId')

    if (!checkInId) {
      return NextResponse.json({ error: 'Check-in ID is required' }, { status: 400 })
    }

    const checkIn = await prisma.recoveryCheckIn.findUnique({
      where: { id: checkInId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        treatment: { select: { id: true, type: true, productName: true, treatmentDate: true } },
        photos: {
          include: { aiAnalyses: true },
          orderBy: { uploadDate: 'desc' },
        },
        aiAnalyses: true,
      },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    return NextResponse.json(checkIn)
  } catch (error) {
    console.error('Error fetching check-in:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
