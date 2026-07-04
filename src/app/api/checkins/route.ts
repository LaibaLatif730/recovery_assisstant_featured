import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const treatmentId = searchParams.get('treatmentId')
    const status = searchParams.get('status')
    const clinicId = searchParams.get('clinicId')

    const where: any = {}
    if (patientId) where.patientId = patientId
    if (treatmentId) where.treatmentId = treatmentId
    if (status) where.status = status

    if (clinicId) {
      where.patient = { clinicId }
    }

    const checkIns = await prisma.recoveryCheckIn.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        treatment: { select: { id: true, type: true, treatmentDate: true } },
        photos: true,
        aiAnalyses: true,
      },
      orderBy: { scheduledDate: 'asc' },
      take: 100,
    })

    return NextResponse.json(checkIns)
  } catch (error) {
    console.error('Error fetching check-ins:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Check-in ID is required' }, { status: 400 })
    }

    const checkIn = await prisma.recoveryCheckIn.update({
      where: { id },
      data: {
        status: updateData.status,
        patientMessage: updateData.patientMessage,
        aiResponse: updateData.aiResponse,
        riskLevel: updateData.riskLevel,
        symptoms: updateData.symptoms,
        completedDate: updateData.status === 'COMPLETED' ? new Date() : undefined,
      },
    })

    return NextResponse.json(checkIn)
  } catch (error) {
    console.error('Error updating check-in:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
