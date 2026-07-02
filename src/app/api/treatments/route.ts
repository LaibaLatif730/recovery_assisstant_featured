import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { treatmentSchema } from '@/lib/validators'
import { getRecoveryTimeline } from '@/lib/utils'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const clinicId = searchParams.get('clinicId')

    const where: any = {}
    if (patientId) where.patientId = patientId
    if (clinicId) where.clinicId = clinicId

    const treatments = await prisma.treatment.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { include: { user: { select: { name: true } } } },
        checkIns: { select: { id: true, status: true, dayNumber: true } },
      },
      orderBy: { treatmentDate: 'desc' },
      take: 50,
    })

    return NextResponse.json(treatments)
  } catch (error) {
    console.error('Error fetching treatments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = treatmentSchema.parse(body)

    let injectionAreasStr = '[]'
    if (validatedData.injectionAreas) {
      try {
        const parsed = JSON.parse(validatedData.injectionAreas)
        injectionAreasStr = JSON.stringify(parsed)
      } catch {
        const arr = validatedData.injectionAreas.split(',').map((s: string) => s.trim()).filter(Boolean)
        injectionAreasStr = JSON.stringify(arr)
      }
    }

    const treatment = await prisma.treatment.create({
      data: {
        patientId: validatedData.patientId,
        doctorId: validatedData.doctorId || undefined,
        clinicId: validatedData.clinicId || undefined,
        type: validatedData.type,
        productName: validatedData.productName || undefined,
        units: validatedData.units || undefined,
        injectionAreas: injectionAreasStr,
        treatmentDate: new Date(validatedData.treatmentDate),
        notes: validatedData.notes || undefined,
        aftercareNotes: validatedData.aftercareNotes || undefined,
      },
    })

    const timeline = getRecoveryTimeline(treatment.type)
    const treatmentDate = new Date(validatedData.treatmentDate)

    const checkIns = await Promise.all(
      timeline.map((dayNumber) =>
        prisma.recoveryCheckIn.create({
          data: {
            treatmentId: treatment.id,
            patientId: validatedData.patientId,
            dayNumber,
            scheduledDate: new Date(treatmentDate.getTime() + dayNumber * 24 * 60 * 60 * 1000),
          },
        })
      )
    )

    return NextResponse.json(
      { ...treatment, checkIns },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating treatment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
