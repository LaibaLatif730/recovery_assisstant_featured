import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { appointmentSchema } from '@/lib/validators'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = appointmentSchema.parse(body)

    const nameParts = validatedData.patientName.trim().split(/\s+/)
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]

    const patient = await prisma.patient.findFirst({
      where: {
        isActive: true,
        firstName: { contains: firstName, mode: 'insensitive' },
        ...(lastName !== firstName ? { lastName: { contains: lastName, mode: 'insensitive' } } : {}),
      },
    })

    if (!patient) {
      return NextResponse.json({ error: `No patient found matching "${validatedData.patientName}". Please register the patient first.` }, { status: 404 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: validatedData.doctorId || undefined,
        clinicId: validatedData.clinicId || undefined,
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
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 })
    }

    const allowedFields: Record<string, any> = {}
    if (updateData.status) allowedFields.status = updateData.status
    if (updateData.appointmentDate) {
      const newDate = new Date(updateData.appointmentDate)
      if (newDate <= new Date()) {
        return NextResponse.json({ error: 'Appointment date must be in the future' }, { status: 400 })
      }
      allowedFields.appointmentDate = newDate
    }
    if (updateData.duration) allowedFields.duration = updateData.duration
    if (updateData.type) allowedFields.type = updateData.type
    if (updateData.notes !== undefined) allowedFields.notes = updateData.notes
    if (updateData.doctorId !== undefined) allowedFields.doctorId = updateData.doctorId

    const appointment = await prisma.appointment.update({
      where: { id },
      data: allowedFields,
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 })
    }

    await prisma.appointment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
