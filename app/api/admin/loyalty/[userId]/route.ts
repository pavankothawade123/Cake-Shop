import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { adjustPoints, getPointTransactions } from '@/services/loyalty.service'

async function requireAdminApi() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }
  return session.user
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdminApi()
    const { userId } = await params

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get loyalty points record
    const loyaltyPoints = await prisma.loyaltyPoints.findUnique({
      where: { userId },
    })

    // Get transaction history
    const transactions = await getPointTransactions(userId, page, limit)

    return NextResponse.json({
      user,
      loyaltyPoints: loyaltyPoints || {
        currentBalance: 0,
        totalEarned: 0,
        totalUsed: 0,
      },
      ...transactions,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching user loyalty:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user loyalty' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdminApi()
    const { userId } = await params

    const body = await request.json()
    const { adjustment, reason } = body

    if (typeof adjustment !== 'number' || adjustment === 0) {
      return NextResponse.json(
        { error: 'Invalid adjustment amount' },
        { status: 400 }
      )
    }

    if (!reason || typeof reason !== 'string' || reason.length < 3) {
      return NextResponse.json(
        { error: 'Reason is required (minimum 3 characters)' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await adjustPoints(userId, adjustment, reason)

    // Get updated balance
    const loyaltyPoints = await prisma.loyaltyPoints.findUnique({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      adjustment,
      newBalance: loyaltyPoints?.currentBalance || 0,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('negative balance')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Error adjusting points:', error)
    return NextResponse.json(
      { error: 'Failed to adjust points' },
      { status: 500 }
    )
  }
}
