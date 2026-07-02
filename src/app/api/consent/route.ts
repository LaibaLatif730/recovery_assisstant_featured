import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const consentType = searchParams.get('type')

    const where: any = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status
    if (consentType) where.consentType = consentType

    const records = await prisma.consentRecord.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching consent records:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { patientId, consentType, version } = body

    const record = await prisma.consentRecord.create({
      data: {
        patientId,
        consentType,
        version: version || '1.0',
        status: 'ACTIVE',
        givenDate: new Date(),
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating consent record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status } = body

    const record = await prisma.consentRecord.update({
      where: { id },
      data: {
        status,
        withdrawnDate: status === 'WITHDRAWN' ? new Date() : undefined,
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating consent record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
