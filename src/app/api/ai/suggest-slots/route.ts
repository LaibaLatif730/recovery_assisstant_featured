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
    const doctorId = searchParams.get('doctorId')
    const date = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration') || '30')

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 })
    }

    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(9, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(18, 0, 0, 0)

    const where: any = {
      appointmentDate: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    }
    if (doctorId) where.doctorId = doctorId

    const existingAppointments = await prisma.appointment.findMany({
      where,
      select: { appointmentDate: true, duration: true, doctorId: true },
      orderBy: { appointmentDate: 'asc' },
    })

    const bookedSlots = existingAppointments.map(a => ({
      start: new Date(a.appointmentDate).getTime(),
      end: new Date(a.appointmentDate).getTime() + (a.duration || 30) * 60 * 1000,
    }))

    const availableSlots: string[] = []
    const slotInterval = 30

    for (let hour = 9; hour < 18; hour++) {
      for (let min = 0; min < 60; min += slotInterval) {
        const slotStart = new Date(targetDate)
        slotStart.setHours(hour, min, 0, 0)
        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000)

        if (slotEnd.getHours() > 18) continue

        const isBooked = bookedSlots.some(booked =>
          slotStart.getTime() < booked.end && slotEnd.getTime() > booked.start
        )

        if (!isBooked) {
          availableSlots.push(slotStart.toTimeString().slice(0, 5))
        }
      }
    }

    return NextResponse.json({ availableSlots, date, doctorId })
  } catch (error) {
    console.error('Error suggesting slots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
