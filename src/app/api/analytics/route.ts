import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicId = searchParams.get('clinicId')
    const period = searchParams.get('period') || '30'

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    const [
      totalPatients,
      totalTreatments,
      totalAppointments,
      checkInStats,
      riskDistribution,
      treatmentTypeDistribution,
      recentAlerts,
      complicationStats,
    ] = await Promise.all([
      prisma.patient.count({
        where: clinicId ? { clinicId, isActive: true } : { isActive: true },
      }),
      prisma.treatment.count({
        where: clinicId ? { clinicId } : {},
      }),
      prisma.appointment.count({
        where: clinicId ? { clinicId } : {},
      }),
      prisma.recoveryCheckIn.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      prisma.recoveryCheckIn.groupBy({
        by: ['riskLevel'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      prisma.treatment.groupBy({
        by: ['type'],
        where: clinicId ? { clinicId } : {},
        _count: true,
      }),
      prisma.recoveryCheckIn.findMany({
        where: { riskLevel: { in: ['RED', 'ORANGE'] }, status: { not: 'COMPLETED' } },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          treatment: { select: { type: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.complicationRecord.groupBy({
        by: ['complicationType'],
        _count: true,
      }),
    ])

    const statusMap = Object.fromEntries(checkInStats.map(s => [s.status, s._count]))

    return NextResponse.json({
      totalPatients,
      totalTreatments,
      totalAppointments,
      completedCheckIns: statusMap['COMPLETED'] || 0,
      pendingCheckIns: statusMap['PENDING'] || 0,
      escalatedCheckIns: statusMap['ESCALATED'] || 0,
      riskDistribution: riskDistribution.map((r) => ({ level: r.riskLevel, count: r._count })),
      treatmentTypeDistribution: treatmentTypeDistribution.map((t) => ({ type: t.type, count: t._count })),
      recentAlerts,
      complications: { total: 0, active: 0, vascular: 0 },
      complicationStats: complicationStats.map((c) => ({ type: c.complicationType, count: c._count })),
      weeklyTrend: [],
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
