import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const protocols = await prisma.treatmentProtocol.findMany({
      where: { isActive: true },
      orderBy: { procedureType: 'asc' },
    })

    return NextResponse.json(protocols)
  } catch (error) {
    console.error('Error fetching protocols:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updateData } = body

    const protocol = await prisma.treatmentProtocol.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(protocol)
  } catch (error) {
    console.error('Error updating protocol:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
