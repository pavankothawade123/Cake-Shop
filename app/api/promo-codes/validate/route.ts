import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validatePromoCodeSchema } from '@/lib/validations/promo-code'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orderTotal } = validatePromoCodeSchema.parse(body)

    // Find the promo code (case-sensitive exact match)
    const promoCode = await prisma.promoCode.findUnique({
      where: { code },
    })

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Invalid promo code' },
        { status: 400 }
      )
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { error: 'This promo code is no longer active' },
        { status: 400 }
      )
    }

    // Check expiry
    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This promo code has expired' },
        { status: 400 }
      )
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
      return NextResponse.json(
        { error: 'This promo code has reached its usage limit' },
        { status: 400 }
      )
    }

    // Check minimum order amount
    if (promoCode.minOrderAmount && orderTotal < promoCode.minOrderAmount) {
      return NextResponse.json(
        { error: `Minimum order amount of ₹${promoCode.minOrderAmount} required` },
        { status: 400 }
      )
    }

    // Calculate discount
    let discount: number
    if (promoCode.discountType === 'PERCENTAGE') {
      discount = (orderTotal * promoCode.discountValue) / 100
      // Apply max discount cap if set
      if (promoCode.maxDiscount && discount > promoCode.maxDiscount) {
        discount = promoCode.maxDiscount
      }
    } else {
      discount = promoCode.discountValue
    }

    // Ensure discount doesn't exceed order total
    discount = Math.min(discount, orderTotal)

    return NextResponse.json({
      valid: true,
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      discount: Math.round(discount * 100) / 100,
      description: promoCode.description,
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    )
  }
}
