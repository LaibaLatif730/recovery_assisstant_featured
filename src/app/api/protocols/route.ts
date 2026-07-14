import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

export async function GET() {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const protocols = await prisma.treatmentProtocol.findMany({
      where: { isActive: true },
      orderBy: { procedureType: 'asc' },
    })

    return NextResponse.json(protocols)
  } catch (error) {
    console.error('Error fetching protocols:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Forbidden: Admin or Doctor access required' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...updateData } = body

    const protocol = await prisma.treatmentProtocol.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(protocol)
  } catch (error) {
    console.error('Error updating protocol:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const protocol = await prisma.treatmentProtocol.create({
      data: {
        procedureType: body.procedureType,
        category: body.category || 'INJECTABLE',
        substance: body.substance || undefined,
        typicalVolumes: body.typicalVolumes || undefined,
        recoveryTimeline: body.recoveryTimeline || '',
        normalSymptoms: body.normalSymptoms || '[]',
        warningSigns: body.warningSigns || '[]',
        emergencySigns: body.emergencySigns || '[]',
        followUpSchedule: body.followUpSchedule || '[]',
        contraindications: body.contraindications || '[]',
        postProcedureInstructions: body.postProcedureInstructions || '[]',
      },
    })

    return NextResponse.json(protocol, { status: 201 })
  } catch (error) {
    console.error('Error creating protocol:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
