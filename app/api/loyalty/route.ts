import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserLoyaltyBalance, loyaltyConfig } from '@/services/loyalty.service'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const balance = await getUserLoyaltyBalance(session.user.id)

    return NextResponse.json({
      ...balance,
      config: {
        pointsPer100Rupees: loyaltyConfig.POINTS_PER_100_RUPEES,
        rupeesPer10Points: loyaltyConfig.RUPEES_PER_10_POINTS,
        minRedeemPoints: loyaltyConfig.MIN_REDEEM_POINTS,
      },
    })
  } catch (error) {
    console.error('Error fetching loyalty balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty balance' },
      { status: 500 }
    )
  }
}
