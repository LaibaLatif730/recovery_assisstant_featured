const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const now = new Date()
  const alice = 'cmr224930000c7j6tm4hj86e4'
  const bob = 'cmr224941000e7j6t97h75v2i'
  const carol = 'cmr2247tu000a7j6t25fdpjly'
  const botoxAlice = 'cmr2249h2000i7j6twvcr7j6o'
  const fillerBob = 'cmr2249h2000k7j6ta5p5oyz1'

  console.log('--- Seeding #1: Overdue PENDING check-ins for silence-risk ---')
  const overdueDate = new Date(now.getTime() - 20 * 60 * 60 * 1000)
  const checkIn1 = await prisma.recoveryCheckIn.create({
    data: {
      treatmentId: botoxAlice,
      patientId: alice,
      dayNumber: 3,
      scheduledDate: overdueDate,
      status: 'PENDING',
    },
  })
  console.log(`  Created check-in ${checkIn1.id} (Day 3, ${Math.round((now - overdueDate) / 3600000)}h overdue)`)

  console.log('\n--- Seeding #2: Upcoming SCHEDULED appointment ---')
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const appt = await prisma.appointment.create({
    data: {
      patientId: alice,
      appointmentDate: tomorrow,
      type: 'FOLLOW_UP',
      status: 'SCHEDULED',
      reminderSent: false,
    },
  })
  console.log(`  Created appointment ${appt.id} for ${tomorrow.toISOString()}`)

  console.log('\n--- Seeding #3: Expiring product batch ---')
  const product = await prisma.product.findFirst()
  if (product) {
    const expiringBatch = await prisma.productBatch.create({
      data: {
        productId: product.id,
        batchNumber: `TEST-EXP-${Date.now()}`,
        expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        quantity: 10,
      },
    })
    console.log(`  Created batch ${expiringBatch.id} expiring in 15 days`)

    const expiredBatch = await prisma.productBatch.create({
      data: {
        productId: product.id,
        batchNumber: `TEST-EXP-${Date.now()}-OLD`,
        expiryDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        quantity: 5,
      },
    })
    console.log(`  Created batch ${expiredBatch.id} expired 5 days ago`)
  }

  console.log('\n--- Seeding #4: ORANGE AI analysis for rebooking trigger ---')
  const photo = await prisma.patientPhoto.findFirst({ where: { patientId: alice } })
  if (photo) {
    const checkIn4 = await prisma.recoveryCheckIn.findFirst({
      where: { patientId: alice, status: 'COMPLETED' },
    })
    const analysis = await prisma.aIAnalysis.create({
      data: {
        photoId: photo.id,
        checkInId: checkIn4?.id,
        riskLevel: 'ORANGE',
        swellingScore: 6.5,
        bruisingScore: 7.0,
        rednessScore: 5.5,
        overallScore: 6.3,
        confidenceScore: 0.88,
        clinicalSummary: 'Significant swelling and bruising detected — follow-up recommended',
        status: 'COMPLETED',
      },
    })
    console.log(`  Created ORANGE analysis ${analysis.id}`)
  } else {
    console.log('  No photos found — skipping (upload a photo first)')
  }

  console.log('\n--- Seeding #5: Old consent record for renewal reminder ---')
  const oldDate = new Date(now.getTime() - 350 * 24 * 60 * 60 * 1000)
  const consent = await prisma.consentRecord.create({
    data: {
      patientId: alice,
      consentType: 'TREATMENT_CONSENT',
      version: '1.0',
      status: 'ACTIVE',
      givenDate: oldDate,
    },
  })
  console.log(`  Created consent ${consent.id} given ${Math.round((now - oldDate) / (24 * 60 * 60 * 1000))} days ago`)

  console.log('\n--- Seeding #6: Day 14 COMPLETED check-in for survey dispatch ---')
  const checkIn14 = await prisma.recoveryCheckIn.findFirst({
    where: { patientId: bob, dayNumber: 14, treatmentId: fillerBob },
  })
  if (checkIn14) {
    await prisma.recoveryCheckIn.update({
      where: { id: checkIn14.id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    })
    console.log(`  Updated check-in ${checkIn14.id} to COMPLETED (Day 14)`)
  } else {
    console.log('  No Day 14 check-in found — skipping')
  }

  console.log('\n--- Seeding #7: Already has 1 SEVERE unreported complication ✅ ---')

  console.log('\n=== All test data seeded ===')
  await prisma.$disconnect()
}

main()
