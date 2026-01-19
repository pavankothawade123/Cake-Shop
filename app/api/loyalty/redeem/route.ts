import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getUserLoyaltyBalance,
  calculateDiscountFromPoints,
  calculateMaxRedeemablePoints,
  loyaltyConfig,
} from '@/services/loyalty.service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { pointsToRedeem, orderTotal } = body

    if (!orderTotal || orderTotal <= 0) {
      return NextResponse.json(
        { error: 'Invalid order total' },
        { status: 400 }
      )
    }

    const balance = await getUserLoyaltyBalance(session.user.id)

    if (!balance.canRedeem) {
      return NextResponse.json(
        { error: `Minimum ${loyaltyConfig.MIN_REDEEM_POINTS} points required for redemption` },
        { status: 400 }
      )
    }

    const maxRedeemable = calculateMaxRedeemablePoints(balance.currentBalance, orderTotal)
    const actualPointsToRedeem = Math.min(pointsToRedeem || maxRedeemable, maxRedeemable)

    if (actualPointsToRedeem < loyaltyConfig.MIN_REDEEM_POINTS) {
      return NextResponse.json(
        { error: `Minimum ${loyaltyConfig.MIN_REDEEM_POINTS} points required for redemption` },
        { status: 400 }
      )
    }

    const discount = calculateDiscountFromPoints(actualPointsToRedeem)

    return NextResponse.json({
      pointsToRedeem: actualPointsToRedeem,
      discount,
      remainingBalance: balance.currentBalance - actualPointsToRedeem,
      maxRedeemable,
    })
  } catch (error) {
    console.error('Error calculating redemption:', error)
    return NextResponse.json(
      { error: 'Failed to calculate redemption' },
      { status: 500 }
    )
  }
}
