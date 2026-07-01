import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { appointmentSchema } from '@/lib/validators'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const doctorId = searchParams.get('doctorId')
    const clinicId = searchParams.get('clinicId')
    const date = searchParams.get('date')

    const where: any = {}
    if (patientId) where.patientId = patientId
    if (doctorId) where.doctorId = doctorId
    if (clinicId) where.clinicId = clinicId
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      where.appointmentDate = { gte: startOfDay, lte: endOfDay }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { appointmentDate: 'asc' },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = appointmentSchema.parse(body)

    const appointment = await prisma.appointment.create({
      data: {
        patientId: validatedData.patientId,
        doctorId: validatedData.doctorId,
        clinicId: validatedData.clinicId,
        appointmentDate: new Date(validatedData.appointmentDate),
        duration: validatedData.duration,
        type: validatedData.type,
        notes: validatedData.notes,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 })
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
