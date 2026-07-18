import prisma from './db'
import { sendWhatsAppMessage } from './whatsapp'

const GRACE_PERIOD_HOURS: Record<string, number> = {
  BOTOX: 12,
  FILLER_HYALURONIC: 6,
  FILLER_CALCIUM_HYDROXYLAPATITE: 6,
  FILLER_POLY_L_LACTIC: 6,
  FILLER_POLYALKYLIMIDE: 6,
  FILLER_POLYMETHYLMETHACRYLATE: 6,
  MESOTHERAPY: 12,
  PRP: 12,
  SKIN_BOOSTER: 12,
  MICRONEEDLING: 12,
  PDO_THREADS: 6,
  FAT_DISSOLVING: 12,
  OTHER: 12,
}

const COMPLICATION_RISK_WEIGHT: Record<string, number> = {
  BOTOX: 1.0,
  FILLER_HYALURONIC: 1.5,
  FILLER_CALCIUM_HYDROXYLAPATITE: 1.4,
  FILLER_POLY_L_LACTIC: 1.3,
  FILLER_POLYALKYLIMIDE: 1.3,
  FILLER_POLYMETHYLMETHACRYLATE: 1.3,
  MESOTHERAPY: 1.0,
  PRP: 1.0,
  SKIN_BOOSTER: 1.0,
  MICRONEEDLING: 1.0,
  PDO_THREADS: 1.4,
  FAT_DISSOLVING: 1.2,
  OTHER: 1.0,
}

export interface SilenceRiskResult {
  checkInId: string
  patientId: string
  patientName: string
  treatmentType: string
  missedDayNumber: number
  scheduledDate: Date
  hoursPastDue: number
  riskScore: number
  escalationLevel: string
}

export async function detectSilenceRisks(): Promise<SilenceRiskResult[]> {
  const now = new Date()
  const results: SilenceRiskResult[] = []

  const pendingCheckIns = await prisma.recoveryCheckIn.findMany({
    where: {
      status: 'PENDING',
      scheduledDate: { lt: now },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      treatment: { select: { type: true } },
      photos: true,
    },
  })

  for (const checkIn of pendingCheckIns) {
    const treatmentType = checkIn.treatment?.type || 'OTHER'
    const graceHours = GRACE_PERIOD_HOURS[treatmentType] || 12
    const hoursPastDue = (now.getTime() - checkIn.scheduledDate.getTime()) / (1000 * 60 * 60)

    if (hoursPastDue < graceHours) continue

    const hasComplications = await prisma.complicationRecord.findFirst({
      where: { patientId: checkIn.patientId },
    })

    const previousNoShows = await prisma.appointment.count({
      where: { patientId: checkIn.patientId, status: 'NO_SHOW' },
    })

    const previousSilenceRisks = await prisma.silenceRiskLog.count({
      where: { patientId: checkIn.patientId, resolvedAt: null },
    })

    const complicationWeight = hasComplications ? 1.5 : 1.0
    const treatmentWeight = COMPLICATION_RISK_WEIGHT[treatmentType] || 1.0
    const dayWeight = checkIn.dayNumber <= 3 ? 1.3 : 1.0
    const hoursOverdueFactor = Math.min(hoursPastDue / graceHours, 3.0)
    const noShowWeight = 1 + (previousNoShows * 0.2)
    const repeatRiskWeight = 1 + (previousSilenceRisks * 0.15)

    const riskScore = hoursOverdueFactor * treatmentWeight * complicationWeight * dayWeight * noShowWeight * repeatRiskWeight

    let escalationLevel = 'LOW'
    if (riskScore >= 4.0) escalationLevel = 'CRITICAL'
    else if (riskScore >= 2.5) escalationLevel = 'HIGH'
    else if (riskScore >= 1.5) escalationLevel = 'MEDIUM'

    await prisma.silenceRiskLog.create({
      data: {
        checkInId: checkIn.id,
        patientId: checkIn.patientId,
        treatmentType,
        missedDayNumber: checkIn.dayNumber,
        scheduledDate: checkIn.scheduledDate,
        riskScore,
        escalationLevel,
      },
    })

    await prisma.recoveryCheckIn.update({
      where: { id: checkIn.id },
      data: { status: 'SILENCE_RISK' },
    })

    if ((escalationLevel === 'HIGH' || escalationLevel === 'CRITICAL') && checkIn.patient.phone) {
      await sendWhatsAppMessage(checkIn.patient.phone, {
        messaging_product: 'whatsapp',
        to: checkIn.patient.phone,
        type: 'text',
        text: {
          body: `Hi ${checkIn.patient.firstName}, we noticed you haven't completed your Day ${checkIn.dayNumber} recovery check-in for your ${treatmentType.replace(/_/g, ' ').toLowerCase()} treatment.\n\nYour recovery is important to us. Please upload a photo or reply to let us know how you're doing.\n\nIf you have any concerns, please contact the clinic directly.`,
        },
      })
    }

    if (escalationLevel === 'CRITICAL') {
      const doctors = await prisma.user.findMany({ where: { role: 'DOCTOR' }, select: { id: true } })
      for (const doc of doctors) {
        await prisma.notification.create({
          data: {
            userId: doc.id,
            title: 'CRITICAL Silence Risk',
            message: `Patient ${checkIn.patient.firstName} ${checkIn.patient.lastName} — Day ${checkIn.dayNumber} check-in overdue by ${Math.round(hoursPastDue)}h. Risk score: ${Math.round(riskScore * 100) / 100}. Treatment: ${treatmentType}. Immediate attention required.`,
            type: 'CRITICAL_ALERT',
            channel: 'SYSTEM',
          },
        })
      }
    }

    results.push({
      checkInId: checkIn.id,
      patientId: checkIn.patientId,
      patientName: `${checkIn.patient.firstName} ${checkIn.patient.lastName}`,
      treatmentType,
      missedDayNumber: checkIn.dayNumber,
      scheduledDate: checkIn.scheduledDate,
      hoursPastDue: Math.round(hoursPastDue * 10) / 10,
      riskScore: Math.round(riskScore * 100) / 100,
      escalationLevel,
    })
  }

  return results
}

export async function getSilenceRiskStats() {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [totalActive, last24h, lastWeek, byLevel] = await Promise.all([
    prisma.silenceRiskLog.findMany({
      where: { resolvedAt: null },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        checkIn: { select: { dayNumber: true, status: true } },
      },
      orderBy: { riskScore: 'desc' },
    }),
    prisma.silenceRiskLog.count({
      where: { detectedAt: { gte: oneDayAgo } },
    }),
    prisma.silenceRiskLog.count({
      where: { detectedAt: { gte: oneWeekAgo } },
    }),
    prisma.silenceRiskLog.groupBy({
      by: ['escalationLevel'],
      where: { resolvedAt: null },
      _count: true,
    }),
  ])

  return {
    active: totalActive,
    last24h,
    lastWeek,
    byLevel: byLevel.reduce((acc, item) => {
      acc[item.escalationLevel] = item._count
      return acc
    }, {} as Record<string, number>),
  }
}
