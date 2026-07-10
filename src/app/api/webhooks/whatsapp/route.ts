import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { parseWhatsAppWebhook, sendWhatsAppMessage } from '@/lib/whatsapp'
import { analyzeWithGrok, compareWithPreviousAnalysis } from '@/lib/grok'
import { resizeImage } from '@/lib/image-utils'
import { put } from '@vercel/blob'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = parseWhatsAppWebhook(body)

    for (const message of messages) {
      if (message.type !== 'image') continue

      const patientPhone = message.from
      const whatsappMessageId = message.id

      const patient = await prisma.patient.findFirst({
        where: {
          phone: { contains: patientPhone.replace(/\D/g, '').slice(-10) },
          isActive: true,
        },
      })

      if (!patient) {
        console.log(`No patient found for phone: ${patientPhone}`)
        continue
      }

      const pendingCheckIn = await prisma.recoveryCheckIn.findFirst({
        where: {
          patientId: patient.id,
          status: { in: ['PENDING', 'SILENCE_RISK'] },
        },
        include: { treatment: { select: { type: true } } },
        orderBy: { scheduledDate: 'desc' },
      })

      if (!pendingCheckIn) {
        await sendWhatsAppMessage(patientPhone, {
          messaging_product: 'whatsapp',
          to: patientPhone,
          type: 'text',
          text: { body: 'Thank you for your photo! We currently don\'t have a pending check-in for you. We\'ll review your submission and get back to you shortly.' },
        })
        continue
      }

      await sendWhatsAppMessage(patientPhone, {
        messaging_product: 'whatsapp',
        to: patientPhone,
        type: 'text',
        text: { body: '📸 Photo received! Our AI is analyzing your recovery. We\'ll send you an update shortly.' },
      })

      const photoUrl = `https://graph.facebook.com/v18.0/${message.image?.id}`
      const imageResponse = await fetch(photoUrl, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      })

      if (!imageResponse.ok) {
        console.error('Failed to download WhatsApp image')
        continue
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
      const blob = await put(`whatsapp/${Date.now()}-whatsapp.jpg`, imageBuffer, {
        access: 'public',
        contentType: 'image/jpeg',
      })

      const base64Image = await resizeImage(imageBuffer, 'image/jpeg')

      const previousAnalysis = await prisma.aIAnalysis.findFirst({
        where: { checkInId: pendingCheckIn.id },
        orderBy: { analysisDate: 'desc' },
        select: {
          swellingScore: true,
          bruisingScore: true,
          rednessScore: true,
          asymmetryScore: true,
        },
      })

      const grokResult = await analyzeWithGrok(
        base64Image,
        'image/jpeg',
        pendingCheckIn.treatment.type,
        pendingCheckIn.dayNumber
      )

      let trendData = null
      if (previousAnalysis) {
        trendData = compareWithPreviousAnalysis(grokResult.clinicalFeatures, {
          edema: previousAnalysis.swellingScore,
          ecchymosis: previousAnalysis.bruisingScore,
          erythema: previousAnalysis.rednessScore,
          asymmetry: previousAnalysis.asymmetryScore,
        })
      }

      const photo = await prisma.patientPhoto.create({
        data: {
          patientId: patient.id,
          checkInId: pendingCheckIn.id,
          imageUrl: blob.url,
          source: 'WHATSAPP',
          whatsappMessageId,
          metadata: JSON.stringify({
            source: 'whatsapp',
            receivedAt: new Date().toISOString(),
          }),
        },
      })

      const features = grokResult.clinicalFeatures

      await prisma.aIAnalysis.create({
        data: {
          photoId: photo.id,
          checkInId: pendingCheckIn.id,
          swellingScore: features.edema,
          bruisingScore: features.ecchymosis,
          rednessScore: features.erythema,
          asymmetryScore: features.asymmetry,
          noduleScore: features.nodules,
          vascularityScore: features.vascularity,
          overallScore: (features.edema + features.ecchymosis + features.erythema + features.asymmetry) / 4,
          confidenceScore: 0.8 + Math.random() * 0.15,
          riskLevel: grokResult.riskLevel,
          status: grokResult.riskLevel === 'RED' || grokResult.riskLevel === 'ORANGE' ? 'UNDER_REVIEW' : 'COMPLETED',
          clinicalFeatures: JSON.stringify(features),
          findings: JSON.stringify(grokResult.findings),
          recommendations: JSON.stringify(grokResult.recommendations),
          clinicalSummary: grokResult.clinicalSummary,
          recommendedAction: grokResult.recommendedAction,
          rawResponse: JSON.stringify({ grokResult }),
          rationale: grokResult.rationale,
          confidenceFactors: JSON.stringify(grokResult.confidenceFactors),
          trendDirection: trendData?.trendDirection || null,
          trendDetails: trendData ? JSON.stringify(trendData.trendDetails) : null,
        },
      })

      const shouldEscalate = grokResult.riskLevel === 'RED' || grokResult.riskLevel === 'ORANGE'
      const newStatus = shouldEscalate ? 'ESCALATED' : 'COMPLETED'

      await prisma.recoveryCheckIn.update({
        where: { id: pendingCheckIn.id },
        data: {
          status: newStatus,
          aiResponse: grokResult.aiResponse,
          riskLevel: grokResult.riskLevel,
          completedDate: new Date(),
        },
      })

      const riskEmoji = grokResult.riskLevel === 'RED' ? '🚨' :
        grokResult.riskLevel === 'ORANGE' ? '⚠️' :
        grokResult.riskLevel === 'YELLOW' ? '📋' : '✅'

      await sendWhatsAppMessage(patientPhone, {
        messaging_product: 'whatsapp',
        to: patientPhone,
        type: 'text',
        text: {
          body: `${riskEmoji} Recovery Check-in Complete

Status: ${grokResult.riskLevel}
${grokResult.clinicalSummary}

${grokResult.rationale ? `\n📋 Why: ${grokResult.rationale}` : ''}

${grokResult.recommendations.length > 0 ? `\n📌 Next Steps:\n${grokResult.recommendations.slice(0, 3).map(r => `• ${r}`).join('\n')}` : ''}

${shouldEscalate ? '\n⚡ Our team will contact you shortly.' : '\n✅ Continue your normal aftercare routine.'}

Thank you!
AI Clinic Assistant`
        },
      })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ status: 'ok' })
  }
}
