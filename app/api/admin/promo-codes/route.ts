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

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { usages: true },
          },
        },
      }),
      prisma.promoCode.count({ where }),
    ])

    return NextResponse.json({
      promoCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApi()

    const body = await request.json()
    const validatedData = promoCodeSchema.parse(body)

    // Convert code to uppercase for consistency
    const code = validatedData.code.toUpperCase()

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A promo code with this code already exists' },
        { status: 400 }
      )
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        ...validatedData,
        code,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      },
    })

    return NextResponse.json(promoCode, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating promo code:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid promo code data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create promo code' },
      { status: 500 }
    )
  }
}
