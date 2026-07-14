const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const patients = await prisma.patient.findMany({ select: { id: true, firstName: true, lastName: true, phone: true, isActive: true } })
  console.log('Patients:', JSON.stringify(patients, null, 2))

  const treatments = await prisma.treatment.findMany({ select: { id: true, type: true, patientId: true } })
  console.log('Treatments:', JSON.stringify(treatments, null, 2))

  const checkIns = await prisma.recoveryCheckIn.findMany({ select: { id: true, dayNumber: true, status: true, scheduledDate: true, patientId: true, treatmentId: true } })
  console.log('CheckIns:', JSON.stringify(checkIns, null, 2))

  const products = await prisma.product.findMany({ select: { id: true, name: true } })
  console.log('Products:', JSON.stringify(products, null, 2))

  const batches = await prisma.productBatch.findMany({ select: { id: true, batchNumber: true, expiryDate: true } })
  console.log('Batches:', JSON.stringify(batches, null, 2))

  const appointments = await prisma.appointment.findMany({ select: { id: true, status: true, reminderSent: true } })
  console.log('Appointments:', JSON.stringify(appointments, null, 2))

  const consents = await prisma.consentRecord.findMany({ select: { id: true, consentType: true, status: true, givenDate: true, patientId: true } })
  console.log('Consents:', JSON.stringify(consents, null, 2))

  const complications = await prisma.complicationRecord.findMany({ select: { id: true, severity: true, reportedToRegulatory: true, patientId: true } })
  console.log('Complications:', JSON.stringify(complications, null, 2))

  const analyses = await prisma.aIAnalysis.findMany({ select: { id: true, riskLevel: true } })
  console.log('Analyses:', JSON.stringify(analyses, null, 2))

  await prisma.$disconnect()
}

main()
