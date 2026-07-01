import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicId = searchParams.get('clinicId')
    const period = searchParams.get('period') || '30'

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    const where: any = { createdAt: { gte: startDate } }
    if (clinicId) {
      where.patient = { clinicId }
    }

    const [
      totalPatients,
      totalTreatments,
      totalAppointments,
      completedCheckIns,
      pendingCheckIns,
      escalatedCheckIns,
      riskDistribution,
      treatmentTypeDistribution,
      recentAlerts,
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
      prisma.recoveryCheckIn.count({
        where: { ...where, status: 'COMPLETED' },
      }),
      prisma.recoveryCheckIn.count({
        where: { ...where, status: 'PENDING' },
      }),
      prisma.recoveryCheckIn.count({
        where: { ...where, status: 'ESCALATED' },
      }),
      prisma.recoveryCheckIn.groupBy({
        by: ['riskLevel'],
        where: where,
        _count: true,
      }),
      prisma.treatment.groupBy({
        by: ['type'],
        where: clinicId ? { clinicId } : {},
        _count: true,
      }),
      prisma.recoveryCheckIn.findMany({
        where: { riskLevel: { in: ['HIGH', 'CRITICAL'] }, status: { not: 'COMPLETED' } },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          treatment: { select: { type: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    return NextResponse.json({
      totalPatients,
      totalTreatments,
      totalAppointments,
      completedCheckIns,
      pendingCheckIns,
      escalatedCheckIns,
      riskDistribution: riskDistribution.map((r) => ({
        level: r.riskLevel,
        count: r._count,
      })),
      treatmentTypeDistribution: treatmentTypeDistribution.map((t) => ({
        type: t.type,
        count: t._count,
      })),
      recentAlerts,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
