import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        treatments: {
          include: {
            doctor: { include: { user: true } },
            checkIns: {
              include: { photos: true, aiAnalyses: true },
              orderBy: { scheduledDate: 'asc' },
            },
          },
          orderBy: { treatmentDate: 'desc' },
        },
        appointments: { orderBy: { appointmentDate: 'desc' } },
        checkIns: {
          include: { photos: true, aiAnalyses: true },
          orderBy: { scheduledDate: 'desc' },
          take: 10,
        },
        photos: { orderBy: { uploadDate: 'desc' }, take: 20 },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const patient = await prisma.patient.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(patient)
  } catch (error) {
    console.error('Error updating patient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.patient.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting patient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
