import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { promoCodeSchema } from '@/lib/validations/promo-code'

async function requireAdminApi() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }
  return session.user
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id } = await params

    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
      include: {
        usages: {
          include: {
            user: {
              select: { name: true, email: true },
            },
            order: {
              select: { orderNumber: true, total: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { usages: true },
        },
      },
    })

    if (!promoCode) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
    }

    return NextResponse.json(promoCode)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching promo code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo code' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id } = await params

    const body = await request.json()
    const validatedData = promoCodeSchema.partial().parse(body)

    // Check if promo code exists
    const existing = await prisma.promoCode.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
    }

    // If code is being changed, check for duplicates
    if (validatedData.code && validatedData.code.toUpperCase() !== existing.code) {
      const duplicate = await prisma.promoCode.findUnique({
        where: { code: validatedData.code.toUpperCase() },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'A promo code with this code already exists' },
          { status: 400 }
        )
      }
    }

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: {
        ...validatedData,
        code: validatedData.code?.toUpperCase(),
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      },
    })

    return NextResponse.json(promoCode)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating promo code:', error)
    return NextResponse.json(
      { error: 'Failed to update promo code' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id } = await params

    // Check if promo code exists
    const existing = await prisma.promoCode.findUnique({
      where: { id },
      include: { _count: { select: { usages: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
    }

    // Don't delete if it has been used
    if (existing._count.usages > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a promo code that has been used. Deactivate it instead.' },
        { status: 400 }
      )
    }

    await prisma.promoCode.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting promo code:', error)
    return NextResponse.json(
      { error: 'Failed to delete promo code' },
      { status: 500 }
    )
  }
}
