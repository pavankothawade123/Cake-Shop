import { z } from 'zod'

export const promoCodeSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20, 'Code must be at most 20 characters'),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive('Discount value must be positive'),
  minOrderAmount: z.number().positive().optional().nullable(),
  maxDiscount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
})

export const validatePromoCodeSchema = z.object({
  code: z.string().min(1, 'Please enter a promo code'),
  orderTotal: z.number().positive('Order total must be positive'),
})

export type PromoCodeInput = z.infer<typeof promoCodeSchema>
export type ValidatePromoCodeInput = z.infer<typeof validatePromoCodeSchema>
