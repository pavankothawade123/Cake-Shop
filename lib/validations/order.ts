import { z } from 'zod'

export const customizationSchema = z.object({
  size: z.enum(['0.5kg', '1kg', '2kg'], {
    error: 'Please select a size',
  }),
  flavor: z.string().optional(),
  frosting: z.string().optional(),
  isEggless: z.boolean().default(false),
  customMessage: z.string().max(50, 'Custom message must be at most 50 characters').optional(),
})

export const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  deliveryMethod: z.enum(['DELIVERY', 'PICKUP']),
  deliveryAddress: z.string().optional(),
  deliveryDate: z.string().refine((date) => {
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate >= today
  }, {
    message: 'Delivery date cannot be in the past',
  }),
  deliveryTimeSlot: z.string().min(1, 'Please select a time slot'),
}).refine((data) => {
  if (data.deliveryMethod === 'DELIVERY') {
    return !!data.deliveryAddress && data.deliveryAddress.length >= 10
  }
  return true
}, {
  message: 'Delivery address is required for delivery orders',
  path: ['deliveryAddress'],
})

export const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500, 'Comment must be at most 500 characters').optional(),
})

export type CustomizationInput = z.infer<typeof customizationSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
