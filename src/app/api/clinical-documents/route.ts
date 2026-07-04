import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { generateClinicalDocument } from '@/lib/grok'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const treatmentId = searchParams.get('treatmentId')
    const documentType = searchParams.get('type')

    const where: any = {}
    if (treatmentId) where.treatmentId = treatmentId
    if (documentType) where.documentType = documentType

    const documents = await prisma.clinicalDocument.findMany({
      where,
      include: {
        treatment: {
          select: {
            id: true,
            type: true,
            treatmentDate: true,
            patient: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching clinical documents:', error)
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
    const { treatmentId, documentType } = body

    if (!treatmentId || !documentType) {
      return NextResponse.json({ error: 'Treatment ID and document type are required' }, { status: 400 })
    }

    const treatment = await prisma.treatment.findUnique({
      where: { id: treatmentId },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        injectionMappings: {
          include: {
            product: { select: { name: true } },
          },
        },
        complications: true,
      },
    })

    if (!treatment) {
      return NextResponse.json({ error: 'Treatment not found' }, { status: 404 })
    }

    const checkIns = await prisma.recoveryCheckIn.findMany({
      where: { treatmentId },
      include: {
        aiAnalyses: { orderBy: { analysisDate: 'desc' }, take: 1 },
      },
      orderBy: { dayNumber: 'asc' },
    })

    const latestAnalysis = checkIns
      .flatMap(ci => ci.aiAnalyses)
      .sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime())[0]

    const findings = latestAnalysis
      ? JSON.parse(latestAnalysis.findings || '[]')
      : []

    const riskLevel = latestAnalysis?.riskLevel || 'GREEN'

    const clinicalSummary = latestAnalysis?.clinicalSummary || 'No clinical summary available.'

    const documentContent = generateClinicalDocument(documentType, {
      patientName: `${treatment.patient.firstName} ${treatment.patient.lastName}`,
      treatmentType: treatment.type,
      dayNumber: checkIns.length > 0 ? checkIns[checkIns.length - 1].dayNumber : 0,
      treatmentDate: new Date(treatment.treatmentDate).toLocaleDateString(),
      findings,
      riskLevel,
      recommendations: latestAnalysis ? JSON.parse(latestAnalysis.recommendations || '[]') : [],
      clinicalSummary,
    })

    const document = await prisma.clinicalDocument.create({
      data: {
        treatmentId,
        documentType,
        content: documentContent,
        generatedBy: 'AI',
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error generating clinical document:', error)
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
    const { id, doctorApproved, doctorId } = body

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    const document = await prisma.clinicalDocument.update({
      where: { id },
      data: {
        doctorApproved,
        doctorId,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error updating clinical document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
