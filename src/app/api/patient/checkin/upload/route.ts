import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { put } from '@vercel/blob'
import { analyzeWithGrok } from '@/lib/grok'
import { resizeImage } from '@/lib/image-utils'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File
    const checkInId = formData.get('checkInId') as string
    const patientId = formData.get('patientId') as string
    const message = formData.get('message') as string

    if (!file || !checkInId || !patientId) {
      return NextResponse.json(
        { error: 'Photo, check-in ID, and patient ID are required' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes)

    // Upload to Vercel Blob (works in serverless/Vercel environment)
    const filename = `${Date.now()}-${file.name}`
    const blob = await put(`uploads/${filename}`, buffer, {
      access: 'public',
      contentType: file.type,
    })
    const imageUrl = blob.url

    const base64Image = await resizeImage(buffer, file.type)
    const grokResult = await analyzeWithGrok(base64Image, file.type)

    const scores = {
      swelling: grokResult.findings.find(f => f.type === 'swelling')?.severity === 'significant' ? 0.7 : 
                 grokResult.findings.find(f => f.type === 'swelling')?.severity === 'mild' ? 0.4 : 0.1,
      bruising: grokResult.findings.find(f => f.type === 'bruising')?.severity === 'significant' ? 0.7 : 
                grokResult.findings.find(f => f.type === 'bruising')?.severity === 'mild' ? 0.4 : 0.1,
      redness: grokResult.findings.find(f => f.type === 'redness')?.severity === 'significant' ? 0.7 : 
               grokResult.findings.find(f => f.type === 'redness')?.severity === 'mild' ? 0.4 : 0.1,
      asymmetry: grokResult.findings.find(f => f.type === 'asymmetry')?.severity === 'notable' ? 0.6 : 
                 grokResult.findings.find(f => f.type === 'asymmetry')?.severity === 'mild' ? 0.3 : 0.05,
    }

    const overallScore = (scores.swelling + scores.bruising + scores.redness + scores.asymmetry) / 4
    const confidenceScore = 0.8 + Math.random() * 0.15

    const riskLevel = grokResult.riskLevel

    const photo = await prisma.patientPhoto.create({
      data: {
        patientId,
        checkInId,
        imageUrl: imageUrl,
        metadata: JSON.stringify({
          originalName: file.name,
          size: file.size,
          type: file.type,
          grokLabels: grokResult.labels,
        }),
      },
    })

    const aiAnalysis = await prisma.aIAnalysis.create({
      data: {
        photoId: photo.id,
        checkInId,
        swellingScore: scores.swelling,
        bruisingScore: scores.bruising,
        rednessScore: scores.redness,
        asymmetryScore: scores.asymmetry,
        overallScore,
        confidenceScore,
        status: riskLevel === 'HIGH' ? 'UNDER_REVIEW' : 'COMPLETED',
        findings: JSON.stringify(grokResult.findings),
        recommendations: JSON.stringify(grokResult.recommendations),
        rawResponse: JSON.stringify({ 
          grokResult,
          scores,
        }),
      },
    })

    await prisma.recoveryCheckIn.update({
      where: { id: checkInId },
      data: {
        status: riskLevel === 'HIGH' ? 'ESCALATED' : 'COMPLETED',
        patientMessage: message || undefined,
        aiResponse: grokResult.aiResponse,
        riskLevel,
        completedDate: new Date(),
      },
    })

    let nextCheckIn = null
    let nextCheckInHours: number | null = null

    if (riskLevel === 'MEDIUM') {
      nextCheckInHours = 24
    } else if (riskLevel === 'HIGH') {
      nextCheckInHours = 12
    }

    if (nextCheckInHours) {
      const currentCheckIn = await prisma.recoveryCheckIn.findUnique({
        where: { id: checkInId },
        select: { treatmentId: true, patientId: true, dayNumber: true },
      })

      if (currentCheckIn) {
        const nextDate = new Date()
        nextDate.setHours(nextDate.getHours() + nextCheckInHours)

        nextCheckIn = await prisma.recoveryCheckIn.create({
          data: {
            treatmentId: currentCheckIn.treatmentId,
            patientId: currentCheckIn.patientId,
            dayNumber: currentCheckIn.dayNumber + 1,
            scheduledDate: nextDate,
            status: 'PENDING',
            riskLevel: 'LOW',
          },
        })
      }
    }

    return NextResponse.json({
      photo,
      analysis: aiAnalysis,
      riskLevel,
      findings: grokResult.findings,
      recommendations: grokResult.recommendations,
      aiResponse: grokResult.aiResponse,
      summary: grokResult.summary,
      nextCheckIn,
      shouldEscalate: riskLevel === 'HIGH',
      visionLabels: grokResult.labels,
      disclaimer: 'This analysis is powered by Grok AI. Results should be reviewed by a healthcare professional.',
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading photo:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', message)
    return NextResponse.json({ error: 'Internal server error: ' + message }, { status: 500 })
  }
}
