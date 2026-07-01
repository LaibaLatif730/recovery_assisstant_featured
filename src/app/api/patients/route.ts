import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { patientSchema } from '@/lib/validators'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicId = searchParams.get('clinicId')
    const search = searchParams.get('search')

    const where: any = { isActive: true }
    if (clinicId) where.clinicId = clinicId
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const patients = await prisma.patient.findMany({
      where,
      include: {
        treatments: { select: { id: true, type: true, treatmentDate: true } },
        _count: { select: { treatments: true, checkIns: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = patientSchema.parse(body)

    const patient = await prisma.patient.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email || undefined,
        phone: validatedData.phone,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
        gender: validatedData.gender,
        address: validatedData.address,
        medicalHistory: validatedData.medicalHistory ? JSON.parse(validatedData.medicalHistory) : undefined,
        allergies: validatedData.allergies,
        clinicId: validatedData.clinicId,
        consentGiven: true,
        consentDate: new Date(),
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error('Error creating patient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
