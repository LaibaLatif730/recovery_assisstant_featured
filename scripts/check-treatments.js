const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.treatment.findMany({ include: { checkIns: true } })
  .then(t => {
    console.log('Treatments:', t.length)
    t.forEach(x => console.log(x.id, x.type, 'checkIns:', x.checkIns.length))
  })
  .finally(() => p.$disconnect())
