const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.patient.findMany({ include: { treatments: { include: { checkIns: true } } } })
  .then(patients => {
    patients.forEach(pt => {
      console.log(`${pt.firstName} ${pt.lastName}: ${pt.treatments.length} treatments, ${pt.treatments.reduce((s,t) => s + t.checkIns.length, 0)} total check-ins`)
    })
  })
  .finally(() => p.$disconnect())
