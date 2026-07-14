import { NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import prisma from '@/lib/db'

function verifyCronAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[SECURITY] CRON_SECRET not configured')
    return false
  }
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(req: Request) {
  try {
    if (!verifyCronAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const upcoming = await prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        reminderSent: false,
        appointmentDate: { gte: now, lte: windowEnd },
      },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true } },
      },
    })

    let sent = 0

    for (const appt of upcoming) {
      if (!appt.patient.phone) continue

      const dateStr = appt.appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      const timeStr = appt.appointmentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })

      const success = await sendWhatsAppMessage(appt.patient.phone, {
        messaging_product: 'whatsapp',
        to: appt.patient.phone,
        type: 'text',
        text: {
          body: `Hi ${appt.patient.firstName}! 📅\n\nThis is a reminder for your upcoming appointment:\n\n📅 ${dateStr} at ${timeStr}\n📋 Type: ${appt.type.replace(/_/g, ' ').toLowerCase()}\n\nPlease reply to confirm or reschedule.\n\nThank you!\nAI Clinic Assistant`,
        },
      })

      if (success) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSent: true },
        })
        sent++
      }
    }

    return NextResponse.json({ found: upcoming.length, sent })
  } catch (error) {
    console.error('Appointment reminder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
