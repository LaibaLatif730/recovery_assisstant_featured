import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const checkInId = searchParams.get('checkInId')

    const where: any = {}
    if (patientId) where.patientId = patientId
    if (checkInId) where.checkInId = checkInId

    const photos = await prisma.patientPhoto.findMany({
      where,
      include: {
        aiAnalyses: true,
      },
      orderBy: { uploadDate: 'desc' },
    })

    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const patientId = formData.get('patientId') as string
    const checkInId = formData.get('checkInId') as string

    if (!file || !patientId) {
      return NextResponse.json(
        { error: 'File and patientId are required' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const photo = await prisma.patientPhoto.create({
      data: {
        patientId,
        checkInId: checkInId || undefined,
        imageUrl: `/uploads/${Date.now()}-${file.name}`,
        metadata: JSON.stringify({
          originalName: file.name,
          size: file.size,
          type: file.type,
        }),
      },
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
