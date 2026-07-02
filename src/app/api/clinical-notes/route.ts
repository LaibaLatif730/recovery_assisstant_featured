import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { clinicalNoteSchema } from '@/lib/validators'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const treatmentId = searchParams.get('treatmentId')
    const noteType = searchParams.get('noteType')

    const where: any = {}
    if (patientId) where.patientId = patientId
    if (treatmentId) where.treatmentId = treatmentId
    if (noteType) where.noteType = noteType

    const notes = await prisma.clinicalNote.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        treatment: { select: { id: true, type: true, treatmentDate: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching clinical notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = clinicalNoteSchema.parse(body)

    const note = await prisma.clinicalNote.create({
      data: {
        patientId: validatedData.patientId,
        doctorId: validatedData.doctorId,
        treatmentId: validatedData.treatmentId,
        checkInId: validatedData.checkInId,
        noteType: validatedData.noteType,
        content: validatedData.content,
        isAiGenerated: validatedData.isAiGenerated,
        isPrivate: validatedData.isPrivate,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating clinical note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
