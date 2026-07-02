import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const clinic = await prisma.clinic.create({
    data: {
      name: 'Aesthetic Beauty Clinic',
      address: '123 Beauty Street, Suite 100',
      phone: '+1-555-0100',
      email: 'info@aestheticclinic.com',
      timezone: 'America/New_York',
    },
  })

  const adminPassword = await bcrypt.hash('admin123', 12)
  const doctorPassword = await bcrypt.hash('doctor123', 12)
  const patientPassword = await bcrypt.hash('patient123', 12)

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@clinic.com',
      password: adminPassword,
      role: 'ADMIN',
      clinicId: clinic.id,
    },
  })

  const doctorUser = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Johnson',
      email: 'doctor@clinic.com',
      password: doctorPassword,
      role: 'DOCTOR',
      clinicId: clinic.id,
    },
  })

  const receptionistUser = await prisma.user.create({
    data: {
      name: 'Emily Receptionist',
      email: 'receptionist@clinic.com',
      password: patientPassword,
      role: 'RECEPTIONIST',
      clinicId: clinic.id,
    },
  })

  const doctor = await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      specialty: 'Aesthetic Medicine',
      licenseNo: 'MD-12345',
      clinicId: clinic.id,
    },
  })

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Botox 100u',
        category: 'NEUROMODULATOR',
        manufacturer: 'Allergan',
        description: 'Botulinum Toxin Type A 100 units',
        clinicId: clinic.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Juvederm Ultra XC',
        category: 'HYALURONIC_ACID_FILLER',
        manufacturer: 'Allergan',
        description: 'Hyaluronic acid filler 1mL',
        clinicId: clinic.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Juvederm Volbella',
        category: 'HYALURONIC_ACID_FILLER',
        manufacturer: 'Allergan',
        description: 'Hyaluronic acid filler for lips 1mL',
        clinicId: clinic.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Radiesse',
        category: 'CALCIUM_HYDROXYLAPATITE_FILLER',
        manufacturer: 'Merz',
        description: 'Calcium hydroxylapatite filler 1.5mL',
        clinicId: clinic.id,
      },
    }),
  ])

  // Create product batches
  const batches = await Promise.all([
    prisma.productBatch.create({
      data: {
        productId: products[0].id,
        batchNumber: 'BTX-2026-04521',
        expiryDate: new Date('2027-06-01'),
        quantity: 50,
      },
    }),
    prisma.productBatch.create({
      data: {
        productId: products[1].id,
        batchNumber: 'JUV-2026-08832',
        expiryDate: new Date('2027-03-15'),
        quantity: 30,
      },
    }),
  ])

  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice.smith@email.com',
        phone: '+1-555-0101',
        gender: 'FEMALE',
        dateOfBirth: new Date('1985-03-15'),
        clinicId: clinic.id,
        consentGiven: true,
        consentDate: new Date(),
        medicalHistory: 'No significant medical history',
        allergies: 'No known allergies',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@email.com',
        phone: '+1-555-0102',
        gender: 'MALE',
        dateOfBirth: new Date('1978-07-22'),
        clinicId: clinic.id,
        consentGiven: true,
        consentDate: new Date(),
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Carol',
        lastName: 'Williams',
        email: 'carol.williams@email.com',
        phone: '+1-555-0103',
        gender: 'FEMALE',
        dateOfBirth: new Date('1990-11-08'),
        clinicId: clinic.id,
        consentGiven: true,
        consentDate: new Date(),
      },
    }),
  ])

  // Create treatment protocols
  const protocols = [
    {
      procedureType: 'BOTOX',
      category: 'Neuromodulator',
      substance: 'Botulinum Toxin Type A',
      typicalVolumes: '20-64 units',
      recoveryTimeline: JSON.stringify({
        day_0_1: 'Onset of effect begins. Mild swelling at injection sites possible.',
        day_2_7: 'Effect becoming visible. Peak effect at Day 14.',
        day_7_14: 'Full effect achieved. Any asymmetry may be assessed.',
      }),
      normalSymptoms: JSON.stringify(['Mild swelling at injection sites', 'Minor bruising', 'Headache']),
      warningSigns: JSON.stringify(['Brow ptosis', 'Eyelid droop', 'Difficulty swallowing']),
      emergencySigns: JSON.stringify(['Difficulty breathing', 'Difficulty swallowing', 'Voice changes']),
      followUpSchedule: JSON.stringify([
        { day: 1, type: 'Photo + Questionnaire', purpose: 'Early assessment' },
        { day: 7, type: 'Photo + Questionnaire', purpose: 'Effect assessment' },
        { day: 14, type: 'Photo + Questionnaire', purpose: 'Full effect evaluation' },
      ]),
      contraindications: JSON.stringify(['Known allergy to botulinum toxin', 'Infection at treatment site', 'Pregnancy']),
      postProcedureInstructions: JSON.stringify([
        'Do not lie down for 4 hours after treatment',
        'Avoid rubbing or massaging the treated area for 24 hours',
        'Avoid strenuous exercise for 24 hours',
      ]),
    },
    {
      procedureType: 'FILLER_HYALURONIC',
      category: 'Dermal Filler',
      substance: 'Hyaluronic Acid',
      typicalVolumes: '0.5mL - 2.0mL',
      recoveryTimeline: JSON.stringify({
        day_0_1: 'Peak swelling and bruising expected. Ice recommended.',
        day_2_3: 'Swelling begins to subside.',
        day_4_7: 'Major swelling resolved. Minor asymmetry possible.',
        day_7_14: 'Near-final result visible.',
        day_14_30: 'Final result achieved.',
      }),
      normalSymptoms: JSON.stringify(['Swelling', 'Bruising', 'Tenderness', 'Firmness at injection site']),
      warningSigns: JSON.stringify(['Increasing swelling after Day 3', 'Blanching or white discoloration', 'Severe pain']),
      emergencySigns: JSON.stringify(['Sudden severe pain', 'Blanching of skin', 'Visual changes', 'Skin necrosis indicators']),
      followUpSchedule: JSON.stringify([
        { day: 1, type: 'Photo + Questionnaire', purpose: 'Early assessment' },
        { day: 3, type: 'Photo + Questionnaire', purpose: 'Swelling monitoring' },
        { day: 7, type: 'Photo + Questionnaire', purpose: 'Healing assessment' },
        { day: 14, type: 'Photo + Questionnaire', purpose: 'Outcome evaluation' },
        { day: 30, type: 'Photo + Questionnaire', purpose: 'Final result documentation' },
      ]),
      contraindications: JSON.stringify(['Active infection at treatment site', 'Known allergy to product components', 'Pregnancy']),
      postProcedureInstructions: JSON.stringify([
        'Apply ice packs for 10 minutes on, 10 minutes off for first 24 hours',
        'Avoid strenuous exercise for 48 hours',
        'Avoid extreme heat for 48 hours',
        'Sleep elevated for first 2 nights',
      ]),
    },
  ]

  for (const protocol of protocols) {
    await prisma.treatmentProtocol.create({ data: protocol })
  }

  const treatments = await Promise.all([
    prisma.treatment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        type: 'BOTOX',
        productName: 'Botox 100u',
        units: 20,
        injectionAreas: JSON.stringify(['Forehead', 'Glabella', 'Crow\'s Feet']),
        treatmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        notes: 'Standard Botox treatment for forehead wrinkles',
        aftercareNotes: 'Avoid lying down for 4 hours. No strenuous exercise for 24 hours.',
      },
    }),
    prisma.treatment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        type: 'FILLER_HYALURONIC',
        productName: 'Juvederm Ultra XC',
        units: 1,
        volume: 1.0,
        injectionAreas: JSON.stringify(['Lips', 'Nasolabial folds']),
        treatmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        notes: 'Lip augmentation and nasolabial fold treatment',
        aftercareNotes: 'Apply ice for 10 minutes every hour. Avoid hot drinks for 24 hours.',
      },
    }),
    prisma.treatment.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        type: 'BOTOX',
        productName: 'Botox 100u',
        units: 16,
        injectionAreas: JSON.stringify(['Forehead', 'Brow lift']),
        treatmentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        notes: 'Botox for forehead and brow lift',
        aftercareNotes: 'Avoid touching the treated area for 4 hours.',
      },
    }),
  ])

  // Create injection mappings
  await Promise.all([
    prisma.injectionMapping.create({
      data: {
        treatmentId: treatments[0].id,
        doctorId: doctor.id,
        area: 'Forehead',
        subArea: 'Mid Forehead',
        units: 10,
        productId: products[0].id,
        batchId: batches[0].id,
        technique: 'Serial Puncture',
        needleCannula: '30G needle',
        depth: 'INTRADERMAL',
        aspiration: 'YES',
      },
    }),
    prisma.injectionMapping.create({
      data: {
        treatmentId: treatments[0].id,
        doctorId: doctor.id,
        area: 'Glabella',
        subArea: 'Corrugator Supercilii',
        units: 10,
        productId: products[0].id,
        batchId: batches[0].id,
        technique: 'Serial Puncture',
        needleCannula: '30G needle',
        depth: 'INTRADERMAL',
        aspiration: 'YES',
      },
    }),
    prisma.injectionMapping.create({
      data: {
        treatmentId: treatments[1].id,
        doctorId: doctor.id,
        area: 'Lips',
        subArea: 'Upper Lip Body',
        volume: 0.5,
        productId: products[2].id,
        batchId: batches[1].id,
        technique: 'Linear Threading',
        needleCannula: '27G cannula',
        depth: 'SUBDERMAL',
        aspiration: 'N/A',
      },
    }),
  ])

  for (const treatment of treatments) {
    const timeline = [1, 2, 5, 10, 14]
    for (const dayNumber of timeline) {
      const scheduledDate = new Date(treatment.treatmentDate.getTime() + dayNumber * 24 * 60 * 60 * 1000)
      const isCompleted = scheduledDate < new Date()

      await prisma.recoveryCheckIn.create({
        data: {
          treatmentId: treatment.id,
          patientId: treatment.patientId,
          dayNumber,
          scheduledDate,
          status: isCompleted ? 'COMPLETED' : 'PENDING',
          riskLevel: 'GREEN',
          completedDate: isCompleted ? scheduledDate : null,
        },
      })
    }
  }

  const appointmentDates = [
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  ]

  await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        appointmentDate: appointmentDates[0],
        duration: 30,
        type: 'FOLLOW_UP',
        status: 'SCHEDULED',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        appointmentDate: appointmentDates[1],
        duration: 60,
        type: 'TREATMENT',
        status: 'SCHEDULED',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        clinicId: clinic.id,
        appointmentDate: appointmentDates[2],
        duration: 30,
        type: 'CONSULTATION',
        status: 'SCHEDULED',
      },
    }),
  ])

  // Create consent records
  await Promise.all([
    prisma.consentRecord.create({
      data: {
        patientId: patients[0].id,
        consentType: 'TREATMENT',
        version: '2.0',
        status: 'ACTIVE',
        givenDate: new Date(),
      },
    }),
    prisma.consentRecord.create({
      data: {
        patientId: patients[0].id,
        consentType: 'PHOTO',
        version: '1.0',
        status: 'ACTIVE',
        givenDate: new Date(),
      },
    }),
  ])

  console.log('Database seeded successfully!')
  console.log('Clinic:', clinic.name)
  console.log('Admin:', adminUser.email, '/ admin123')
  console.log('Doctor:', doctorUser.email, '/ doctor123')
  console.log('Receptionist:', receptionistUser.email, '/ patient123')
  console.log('Patients:', patients.length)
  console.log('Treatments:', treatments.length)
  console.log('Products:', products.length)
  console.log('Protocols:', protocols.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
