import { NextResponse } from 'next/server'
import { detectSilenceRisks, getSilenceRiskStats } from '@/lib/silence-risk'
import prisma from '@/lib/db'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await detectSilenceRisks()

    for (const result of results) {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      })

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

export async function GET() {
  try {
    const stats = await getSilenceRiskStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching silence risk stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
