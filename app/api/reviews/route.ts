import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import { reviewSchema } from '@/lib/validations/order'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: 'DELIVERED',
        items: {
          some: {
            productId: validatedData.productId,
          },
        },
      },
    })

    if (!deliveredOrder) {
      return NextResponse.json(
        { error: 'You can only review products from delivered orders' },
        { status: 400 }
      )
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: validatedData.productId,
          userId: user.id,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    const review = await prisma.review.create({
      data: {
        productId: validatedData.productId,
        userId: user.id,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
