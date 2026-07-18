import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'
import { generateExplainabilityOutput, getAllTreatmentTypes } from '@/lib/treatment-decision-trees'
import { auditLog } from '@/lib/audit-log'

export async function GET(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const checkInId = searchParams.get('checkInId')
    const analysisId = searchParams.get('analysisId')
    const treatmentType = searchParams.get('treatmentType')
    const dayNumber = parseInt(searchParams.get('dayNumber') || '1', 10)
    const language = searchParams.get('language') || 'en'

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    let analysis = null

    if (analysisId) {
      analysis = await prisma.aIAnalysis.findUnique({
        where: { id: analysisId },
        include: { checkIn: { select: { dayNumber: true, treatmentId: true } } },
      })
    } else if (checkInId) {
      analysis = await prisma.aIAnalysis.findFirst({
        where: { checkInId },
        include: { checkIn: { select: { dayNumber: true, treatmentId: true } } },
      })
    }

    if (analysis) {
      const features = {
        edema: analysis.swellingScore,
        ecchymosis: analysis.bruisingScore,
        erythema: analysis.rednessScore,
        asymmetry: analysis.asymmetryScore,
        nodules: analysis.noduleScore,
        vascularity: analysis.vascularityScore,
      }

      const treatment = analysis.checkIn?.treatmentId
        ? await prisma.treatment.findUnique({ where: { id: analysis.checkIn.treatmentId }, select: { type: true } })
        : null

      const resolvedTreatmentType = treatment?.type || treatmentType || 'BOTOX'
      const resolvedDayNumber = analysis.checkIn?.dayNumber || dayNumber

      const explainability = generateExplainabilityOutput(
        resolvedTreatmentType,
        resolvedDayNumber,
        features,
        analysis.riskLevel,
        analysis.rationale || undefined
      )

      await auditLog({
        userId: session.user.id,
        entity: 'Patient',
        entityId: patientId,
        action: 'PATIENT_VIEWED',
        newValues: { explainabilityRequested: true, analysisId: analysis.id },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      })

      return NextResponse.json({
        explainability,
        patientId,
        analysisId: analysis.id,
        dayNumber: resolvedDayNumber,
        treatmentType: resolvedTreatmentType,
        generatedAt: new Date().toISOString(),
      })
    }

    if (treatmentType) {
      const explainability = generateExplainabilityOutput(
        treatmentType,
        dayNumber,
        { edema: 0, ecchymosis: 0, erythema: 0, asymmetry: 0, nodules: 0, vascularity: 0 },
        'GREEN',
        'No analysis data available. This is a template explanation for the treatment type.'
      )

      return NextResponse.json({
        explainability,
        patientId,
        dayNumber,
        treatmentType,
        generatedAt: new Date().toISOString(),
        isTemplate: true,
      })
    }

    const treatmentTypes = getAllTreatmentTypes()

    return NextResponse.json({
      message: 'Provide analysisId, checkInId, or treatmentType to get explainability output',
      availableTreatmentTypes: treatmentTypes,
      patientId,
    })
  } catch (error) {
    console.error('Explainability error:', error)
    return NextResponse.json({ error: 'Failed to generate explainability' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Only doctors can generate explainability reports' }, { status: 403 })
    }

    const body = await req.json()
    const { patientId, treatmentType, dayNumber, features, riskLevel, rationale } = body

    if (!patientId || !treatmentType || !features || !riskLevel) {
      return NextResponse.json({
        error: 'patientId, treatmentType, features, and riskLevel are required',
      }, { status: 400 })
    }

    const explainability = generateExplainabilityOutput(
      treatmentType,
      dayNumber || 1,
      {
        edema: features.edema || 0,
        ecchymosis: features.ecchymosis || 0,
        erythema: features.erythema || 0,
        asymmetry: features.asymmetry || 0,
        nodules: features.nodules || 0,
        vascularity: features.vascularity || 0,
      },
      riskLevel,
      rationale
    )

    await auditLog({
      userId: session.user.id,
      entity: 'Patient',
      entityId: patientId,
      action: 'PATIENT_VIEWED',
      newValues: { explainabilityGenerated: true, treatmentType, dayNumber, riskLevel },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({
      explainability,
      patientId,
      treatmentType,
      dayNumber: dayNumber || 1,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Explainability generation error:', error)
    return NextResponse.json({ error: 'Failed to generate explainability' }, { status: 500 })
  }
}
