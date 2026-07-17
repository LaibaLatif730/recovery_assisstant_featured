const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const TIMELINES = {
  BOTOX: [1, 2, 5, 10, 14],
  FILLER_HYALURONIC: [1, 3, 7, 14, 30],
  FILLER_CALCIUM_HYDROXYLAPATITE: [1, 3, 7, 14, 30],
  FILLER_POLY_L_LACTIC: [1, 3, 7, 14, 30],
  FILLER_POLYALKYLIMIDE: [1, 3, 7, 14, 30],
  FILLER_POLYMETHYLMETHACRYLATE: [1, 3, 7, 14, 30],
  MESOTHERAPY: [1, 2, 5, 10],
  PRP: [1, 3, 7, 14],
  SKIN_BOOSTER: [1, 3, 7, 14],
  MICRONEEDLING: [1, 2, 5, 7, 14],
  PDO_THREADS: [1, 3, 7, 14, 30],
  FAT_DISSOLVING: [1, 3, 7, 14, 30],
  OTHER: [1, 2, 5, 10, 14],
}

async function backfill() {
  const treatments = await prisma.treatment.findMany({
    include: { checkIns: true },
  })

  let created = 0
  for (const treatment of treatments) {
    if (treatment.checkIns.length > 0) continue

    const timeline = TIMELINES[treatment.type] || TIMELINES.OTHER
    const treatmentDate = new Date(treatment.treatmentDate)

    await Promise.all(
      timeline.map((dayNumber) =>
        prisma.recoveryCheckIn.create({
          data: {
            treatmentId: treatment.id,
            patientId: treatment.patientId,
            dayNumber,
            scheduledDate: new Date(treatmentDate.getTime() + dayNumber * 24 * 60 * 60 * 1000),
          },
        })
      )
    )
    created++
    console.log(`Created ${timeline.length} check-ins for treatment ${treatment.id} (${treatment.type})`)
  }

  console.log(`\nDone. Created check-ins for ${created} treatments.`)
  await prisma.$disconnect()
}

backfill().catch((e) => {
  console.error(e)
  process.exit(1)
})
