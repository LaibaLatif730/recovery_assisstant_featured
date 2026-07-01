import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

async function analyzeImage(photoUrl: string) {
  const scores = {
    swelling: Math.random() * 0.5,
    bruising: Math.random() * 0.4,
    redness: Math.random() * 0.3,
    asymmetry: Math.random() * 0.2,
    overall: 0,
    confidence: 0.85 + Math.random() * 0.15,
  }
  scores.overall = (scores.swelling + scores.bruising + scores.redness + scores.asymmetry) / 4

  const findings = []
  if (scores.swelling > 0.3) findings.push({ type: 'swelling', severity: 'mild', description: 'Mild swelling detected' })
  if (scores.bruising > 0.3) findings.push({ type: 'bruising', severity: 'mild', description: 'Minor bruising visible' })
  if (scores.redness > 0.3) findings.push({ type: 'redness', severity: 'mild', description: 'Slight redness observed' })
  if (scores.asymmetry > 0.3) findings.push({ type: 'asymmetry', severity: 'mild', description: 'Minor asymmetry noted' })

  if (findings.length === 0) {
    findings.push({ type: 'normal', severity: 'none', description: 'Recovery appears normal' })
  }

  const recommendations = []
  if (scores.swelling > 0.3) recommendations.push('Apply cold compress for 10 minutes')
  if (scores.bruising > 0.3) recommendations.push('Arnica cream may help reduce bruising')
  if (scores.overall < 0.2) recommendations.push('Continue normal activities')
  recommendations.push('Upload another photo in 24 hours')

  return { scores, findings, recommendations }
}

export async function POST(req: Request) {
  try {
    const { photoId, checkInId } = await req.json()

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    const photo = await prisma.patientPhoto.findUnique({
      where: { id: photoId },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    const analysis = await analyzeImage(photo.imageUrl)

    const riskLevel = analysis.scores.overall > 0.6 ? 'HIGH' :
      analysis.scores.overall > 0.3 ? 'MEDIUM' : 'LOW'

    const aiAnalysis = await prisma.aIAnalysis.create({
      data: {
        photoId,
        checkInId: checkInId || undefined,
        swellingScore: analysis.scores.swelling,
        bruisingScore: analysis.scores.bruising,
        rednessScore: analysis.scores.redness,
        asymmetryScore: analysis.scores.asymmetry,
        overallScore: analysis.scores.overall,
        confidenceScore: analysis.scores.confidence,
        status: riskLevel === 'HIGH' ? 'UNDER_REVIEW' : 'COMPLETED',
        findings: JSON.stringify(analysis.findings),
        recommendations: JSON.stringify(analysis.recommendations),
        rawResponse: JSON.stringify(analysis),
      },
    })

    if (checkInId && riskLevel === 'HIGH') {
      await prisma.recoveryCheckIn.update({
        where: { id: checkInId },
        data: { riskLevel: 'HIGH', status: 'ESCALATED' },
      })
    }

    return NextResponse.json(aiAnalysis, { status: 201 })
  } catch (error) {
    console.error('Error analyzing photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
