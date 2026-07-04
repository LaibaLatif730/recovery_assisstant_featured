import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

export async function GET() {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctors = await prisma.doctor.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } },
        _count: { select: { treatments: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(doctors)
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, password, phone, specialty, licenseNo, clinicId } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || undefined,
        role: 'DOCTOR',
        clinicId: clinicId || undefined,
      },
    })

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        specialty: specialty || undefined,
        licenseNo: licenseNo || undefined,
        clinicId: clinicId || undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    return NextResponse.json(doctor, { status: 201 })
  } catch (error) {
    console.error('Error creating doctor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { id, isActive, specialty, licenseNo } = body

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        specialty: specialty || undefined,
        licenseNo: licenseNo || undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    return NextResponse.json(doctor)
  } catch (error) {
    console.error('Error updating doctor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
