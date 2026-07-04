import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    // Verify patientId is a valid cuid format to prevent injection
    if (!/^c[a-z0-9]{24,}$/.test(patientId)) {
      return NextResponse.json({ error: 'Invalid patient ID format' }, { status: 400 })
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
      include: {
        treatments: {
          include: {
            checkIns: {
              include: {
                photos: {
                  include: { aiAnalyses: true },
                  orderBy: { uploadDate: 'desc' },
                },
                aiAnalyses: true,
              },
              orderBy: { scheduledDate: 'asc' },
            },
          },
          orderBy: { treatmentDate: 'desc' },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Only return non-sensitive fields for the patient portal
    const safeData = {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      treatments: patient.treatments,
    }

    return NextResponse.json(safeData)
  } catch (error) {
    console.error('Error fetching patient data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
