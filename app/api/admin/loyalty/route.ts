import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

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

    const where: any = {}

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const [loyaltyRecords, total] = await Promise.all([
      prisma.loyaltyPoints.findMany({
        where,
        orderBy: { currentBalance: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { transactions: true },
          },
        },
      }),
      prisma.loyaltyPoints.count({ where }),
    ])

    // Get totals
    const totals = await prisma.loyaltyPoints.aggregate({
      _sum: {
        totalEarned: true,
        totalUsed: true,
        currentBalance: true,
      },
    })

    return NextResponse.json({
      loyaltyRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      totals: {
        totalEarned: totals._sum.totalEarned || 0,
        totalUsed: totals._sum.totalUsed || 0,
        totalBalance: totals._sum.currentBalance || 0,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching loyalty records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty records' },
      { status: 500 }
    )
  }
}
