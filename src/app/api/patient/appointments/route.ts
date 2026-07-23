import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requirePatientAuth } from '@/lib/patient-auth'
import { auditLog } from '@/lib/audit-log'

export async function GET() {
  try {
    const auth = await requirePatientAuth()

    const patient = await prisma.patient.findUnique({
      where: { id: auth.patientId },
      select: { id: true, userId: true },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: auth.patientId },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { appointmentDate: 'asc' },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching patient appointments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requirePatientAuth()
    const body = await req.json()
    const { appointmentDate, duration, type, notes } = body

    if (!appointmentDate) {
      return NextResponse.json({ error: 'Appointment date is required' }, { status: 400 })
    }

    const date = new Date(appointmentDate)
    if (date <= new Date()) {
      return NextResponse.json({ error: 'Appointment date must be in the future' }, { status: 400 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: auth.patientId,
        appointmentDate: date,
        duration: duration || 30,
        type: type || 'CONSULTATION',
        notes: notes || undefined,
        status: 'PENDING_APPROVAL',
        requestedByPatient: true,
      },
    })

    await auditLog({
      action: 'REQUEST_APPOINTMENT',
      entity: 'Appointment',
      entityId: appointment.id,
      newValues: { patientId: auth.patientId, appointmentDate: date, type },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error requesting appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
