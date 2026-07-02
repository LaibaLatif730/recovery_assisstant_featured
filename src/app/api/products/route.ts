import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { productSchema, productBatchSchema } from '@/lib/validators'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const clinicId = searchParams.get('clinicId')

    const where: any = { isActive: true }
    if (category) where.category = category
    if (clinicId) where.clinicId = clinicId

    const products = await prisma.product.findMany({
      where,
      include: {
        batches: {
          where: { isActive: true },
          orderBy: { expiryDate: 'asc' },
        },
        _count: { select: { treatments: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = productSchema.parse(body)

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        category: validatedData.category,
        manufacturer: validatedData.manufacturer,
        description: validatedData.description,
        clinicId: validatedData.clinicId,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
