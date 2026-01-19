import { prisma } from '@/lib/prisma'

// Loyalty Points Configuration
const POINTS_PER_100_RUPEES = 10  // ₹100 spent = 10 points earned
const RUPEES_PER_10_POINTS = 5   // 10 points = ₹5 discount
const MIN_REDEEM_POINTS = 10     // Minimum points to redeem

export const loyaltyConfig = {
  POINTS_PER_100_RUPEES,
  RUPEES_PER_10_POINTS,
  MIN_REDEEM_POINTS,
}

/**
 * Calculate points to be earned for an order amount
 */
export function calculatePointsToEarn(orderAmount: number): number {
  return Math.floor((orderAmount / 100) * POINTS_PER_100_RUPEES)
}

/**
 * Calculate discount value for given points
 */
export function calculateDiscountFromPoints(points: number): number {
  if (points < MIN_REDEEM_POINTS) return 0
  return Math.floor(points / 10) * RUPEES_PER_10_POINTS
}

/**
 * Calculate max points that can be redeemed for an order
 * (Cannot exceed order total)
 */
export function calculateMaxRedeemablePoints(
  availablePoints: number,
  orderTotal: number
): number {
  const maxDiscountNeeded = orderTotal
  // Convert max discount to points (reverse calculation)
  const maxPointsForOrder = Math.ceil((maxDiscountNeeded / RUPEES_PER_10_POINTS) * 10)
  return Math.min(availablePoints, maxPointsForOrder)
}

/**
 * Get or create loyalty points record for a user
 */
export async function getOrCreateLoyaltyPoints(userId: string) {
  let loyaltyPoints = await prisma.loyaltyPoints.findUnique({
    where: { userId },
  })

  if (!loyaltyPoints) {
    loyaltyPoints = await prisma.loyaltyPoints.create({
      data: { userId },
    })
  }

  return loyaltyPoints
}

/**
 * Get user's loyalty balance
 */
export async function getUserLoyaltyBalance(userId: string) {
  const loyaltyPoints = await getOrCreateLoyaltyPoints(userId)
  return {
    currentBalance: loyaltyPoints.currentBalance,
    totalEarned: loyaltyPoints.totalEarned,
    totalUsed: loyaltyPoints.totalUsed,
    discountValue: calculateDiscountFromPoints(loyaltyPoints.currentBalance),
    minRedeemPoints: MIN_REDEEM_POINTS,
    canRedeem: loyaltyPoints.currentBalance >= MIN_REDEEM_POINTS,
  }
}

/**
 * Award points to user for a completed order
 */
export async function awardPointsForOrder(
  userId: string,
  orderId: string,
  orderTotal: number
): Promise<{ pointsEarned: number }> {
  const pointsToEarn = calculatePointsToEarn(orderTotal)

  if (pointsToEarn <= 0) {
    return { pointsEarned: 0 }
  }

  const loyaltyPoints = await getOrCreateLoyaltyPoints(userId)

  await prisma.$transaction([
    // Update loyalty points balance
    prisma.loyaltyPoints.update({
      where: { id: loyaltyPoints.id },
      data: {
        totalEarned: { increment: pointsToEarn },
        currentBalance: { increment: pointsToEarn },
      },
    }),
    // Create transaction record
    prisma.pointTransaction.create({
      data: {
        loyaltyPointsId: loyaltyPoints.id,
        type: 'EARNED',
        points: pointsToEarn,
        description: `Points earned from order`,
        orderId,
      },
    }),
    // Update order with points earned
    prisma.order.update({
      where: { id: orderId },
      data: { pointsEarned: pointsToEarn },
    }),
  ])

  return { pointsEarned: pointsToEarn }
}

/**
 * Redeem points for an order
 */
export async function redeemPointsForOrder(
  userId: string,
  orderId: string,
  pointsToRedeem: number
): Promise<{ discount: number; pointsRedeemed: number }> {
  if (pointsToRedeem < MIN_REDEEM_POINTS) {
    throw new Error(`Minimum ${MIN_REDEEM_POINTS} points required for redemption`)
  }

  const loyaltyPoints = await getOrCreateLoyaltyPoints(userId)

  if (loyaltyPoints.currentBalance < pointsToRedeem) {
    throw new Error('Insufficient points balance')
  }

  const discount = calculateDiscountFromPoints(pointsToRedeem)

  await prisma.$transaction([
    // Update loyalty points balance
    prisma.loyaltyPoints.update({
      where: { id: loyaltyPoints.id },
      data: {
        totalUsed: { increment: pointsToRedeem },
        currentBalance: { decrement: pointsToRedeem },
      },
    }),
    // Create transaction record
    prisma.pointTransaction.create({
      data: {
        loyaltyPointsId: loyaltyPoints.id,
        type: 'REDEEMED',
        points: -pointsToRedeem,
        description: `Points redeemed for order discount`,
        orderId,
      },
    }),
    // Update order with points redeemed
    prisma.order.update({
      where: { id: orderId },
      data: {
        pointsRedeemed: pointsToRedeem,
        pointsDiscount: discount,
      },
    }),
  ])

  return { discount, pointsRedeemed: pointsToRedeem }
}

/**
 * Adjust points manually (admin function)
 */
export async function adjustPoints(
  userId: string,
  adjustment: number,
  reason: string
): Promise<void> {
  const loyaltyPoints = await getOrCreateLoyaltyPoints(userId)

  const newBalance = loyaltyPoints.currentBalance + adjustment
  if (newBalance < 0) {
    throw new Error('Adjustment would result in negative balance')
  }

  await prisma.$transaction([
    prisma.loyaltyPoints.update({
      where: { id: loyaltyPoints.id },
      data: {
        currentBalance: newBalance,
        totalEarned: adjustment > 0 ? { increment: adjustment } : undefined,
        totalUsed: adjustment < 0 ? { increment: Math.abs(adjustment) } : undefined,
      },
    }),
    prisma.pointTransaction.create({
      data: {
        loyaltyPointsId: loyaltyPoints.id,
        type: 'ADJUSTED',
        points: adjustment,
        description: reason,
      },
    }),
  ])
}

/**
 * Get user's point transaction history
 */
export async function getPointTransactions(
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  const loyaltyPoints = await prisma.loyaltyPoints.findUnique({
    where: { userId },
  })

  if (!loyaltyPoints) {
    return { transactions: [], pagination: { page, limit, total: 0, totalPages: 0 } }
  }

  const skip = (page - 1) * limit

  const [transactions, total] = await Promise.all([
    prisma.pointTransaction.findMany({
      where: { loyaltyPointsId: loyaltyPoints.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        order: {
          select: { orderNumber: true },
        },
      },
    }),
    prisma.pointTransaction.count({
      where: { loyaltyPointsId: loyaltyPoints.id },
    }),
  ])

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
