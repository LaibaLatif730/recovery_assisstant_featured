import { NextResponse } from 'next/server'
import { detectSilenceRisks } from '@/lib/silence-risk'
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'

export async function POST() {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await detectSilenceRisks()

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    })

    for (const result of results) {
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: `Silence Risk: ${result.patientName}`,
            message: `Day ${result.missedDayNumber} check-in for ${result.treatmentType.replace(/_/g, ' ')} is ${result.hoursPastDue}h overdue. Risk level: ${result.escalationLevel}`,
            type: 'SILENCE_RISK',
            channel: 'IN_APP',
            metadata: JSON.stringify({
              checkInId: result.checkInId,
              riskScore: result.riskScore,
              escalationLevel: result.escalationLevel,
            }),
          },
        })
      }
    }

    return NextResponse.json({
      detected: results.length,
      results,
    })
  } catch (error) {
    console.error('Silence risk detection error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
