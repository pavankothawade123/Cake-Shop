import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { emailService } from '@/services/email.service'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.enum(['PLACED', 'CONFIRMED', 'BAKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const body = await request.json()
    const validatedData = updateOrderSchema.parse(body)

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    await emailService.sendOrderStatusUpdate(order.customerEmail, {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: validatedData.status,
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
