const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const photo = await prisma.patientPhoto.create({
    data: {
      patientId: 'cmr224930000c7j6tm4hj86e4',
      imageUrl: '/test-photo.jpg',
      source: 'PORTAL',
    },
  })

  const analysis = await prisma.aIAnalysis.create({
    data: {
      photoId: photo.id,
      riskLevel: 'ORANGE',
      swellingScore: 6.5,
      bruisingScore: 7.0,
      rednessScore: 5.5,
      overallScore: 6.3,
      confidenceScore: 0.88,
      clinicalSummary: 'Significant swelling and bruising detected',
      status: 'COMPLETED',
    },
  })

  console.log('Created photo:', photo.id)
  console.log('Created analysis:', analysis.id)
  await prisma.$disconnect()
}

main()
