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

  const treatments = await Promise.all([
    prisma.treatment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        type: 'BOTOX',
        productName: 'Botox',
        units: 20,
        injectionAreas: JSON.stringify(['Forehead', 'Glabella', 'Crow\'s feet']),
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
        productName: 'Juvederm',
        units: 1,
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
        productName: 'Botox',
        units: 16,
        injectionAreas: JSON.stringify(['Forehead', 'Brow lift']),
        treatmentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        notes: 'Botox for forehead and brow lift',
        aftercareNotes: 'Avoid touching the treated area for 4 hours.',
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
          riskLevel: dayNumber <= 2 ? 'LOW' : 'MEDIUM',
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

  console.log('Database seeded successfully!')
  console.log('Clinic:', clinic.name)
  console.log('Admin:', adminUser.email, '/ admin123')
  console.log('Doctor:', doctorUser.email, '/ doctor123')
  console.log('Receptionist:', receptionistUser.email, '/ patient123')
  console.log('Patients:', patients.length)
  console.log('Treatments:', treatments.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
