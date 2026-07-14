import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const note = await prisma.clinicalNote.update({
      where: { id },
      data: {
        noteType: body.noteType || undefined,
        content: body.content || undefined,
        isPrivate: body.isPrivate,
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error updating clinical note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    await prisma.clinicalNote.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting clinical note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
