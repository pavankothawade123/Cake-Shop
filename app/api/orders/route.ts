import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-utils'
import { checkoutSchema } from '@/lib/validations/order'
import { paymentService } from '@/services/payment.service'
import { emailService } from '@/services/email.service'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { checkoutData, cartItems } = body

    const validatedCheckout = checkoutSchema.parse(checkoutData)
    const user = await getCurrentUser()

    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.totalPrice,
      0
    )
    const tax = subtotal * 0.08
    const deliveryFee = validatedCheckout.deliveryMethod === 'DELIVERY' ? 5.0 : 0
    const total = subtotal + tax + deliveryFee

    const paymentResult = await paymentService.processPayment({
      amount: total,
      currency: 'USD',
      customerEmail: validatedCheckout.customerEmail,
      orderId: `temp-${Date.now()}`,
    })

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: 'Payment failed', message: paymentResult.error },
        { status: 400 }
      )
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user?.id,
        customerName: validatedCheckout.customerName,
        customerEmail: validatedCheckout.customerEmail,
        customerPhone: validatedCheckout.customerPhone,
        deliveryMethod: validatedCheckout.deliveryMethod,
        deliveryAddress: validatedCheckout.deliveryAddress,
        deliveryDate: new Date(validatedCheckout.deliveryDate),
        deliveryTimeSlot: validatedCheckout.deliveryTimeSlot,
        subtotal,
        tax,
        deliveryFee,
        total,
        paymentStatus: 'PAID',
        items: {
          create: cartItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.customization.size,
            flavor: item.customization.flavor,
            frosting: item.customization.frosting,
            isEggless: item.customization.isEggless,
            customMessage: item.customization.customMessage,
            price: item.price,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    await emailService.sendOrderConfirmation(
      validatedCheckout.customerEmail,
      {
        orderNumber,
        customerName: validatedCheckout.customerName,
        total,
        items: cartItems.map((item: any) => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.totalPrice,
        })),
        deliveryDate: format(new Date(validatedCheckout.deliveryDate), 'PPP'),
        deliveryAddress: validatedCheckout.deliveryAddress,
      }
    )

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
