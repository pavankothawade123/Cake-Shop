'use client'

import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { formatPrice, formatDate } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { use } from 'react'

const statusColors: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  BAKING: 'bg-yellow-100 text-yellow-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

function OrderDetailContent({ id }: { id: string }) {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`)
      if (!res.ok) throw new Error('Failed to fetch order')
      return res.json()
    },
    enabled: !!session,
  })

  if (isLoading) return <LoadingSpinner className="py-20" />

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-20">
        <ErrorMessage message="Order not found or you don't have permission to view it." />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Order Placed Successfully!
          </h2>
          <p className="text-green-700">
            Thank you for your order. We&apos;ve sent a confirmation email to{' '}
            {order.customerEmail}
          </p>
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Order #{order.orderNumber}
          </h1>
          <p className="text-gray-600">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge className={`${statusColors[order.status]} text-lg px-4 py-2`}>
          {order.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={item.product.images[0] || '/placeholder-cake.jpg'}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1 mt-1">
                      <p>Size: {item.size}</p>
                      {item.flavor && <p>Flavor: {item.flavor}</p>}
                      {item.frosting && <p>Frosting: {item.frosting}</p>}
                      {item.isEggless && <p>Eggless</p>}
                      {item.customMessage && (
                        <p>Message: &quot;{item.customMessage}&quot;</p>
                      )}
                      <p>Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['PLACED', 'CONFIRMED', 'BAKING', 'OUT_FOR_DELIVERY', 'DELIVERED'].map(
                  (status, idx) => {
                    const statuses = ['PLACED', 'CONFIRMED', 'BAKING', 'OUT_FOR_DELIVERY', 'DELIVERED']
                    const currentIdx = statuses.indexOf(order.status)
                    const isComplete = idx <= currentIdx
                    const isCurrent = idx === currentIdx

                    return (
                      <div key={status} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isComplete
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {isComplete ? '✓' : idx + 1}
                        </div>
                        <div className="ml-4">
                          <p
                            className={`font-medium ${
                              isCurrent ? 'text-green-600' : ''
                            }`}
                          >
                            {status.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee:</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-pink-600">{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivery Method</p>
                <p className="font-medium">{order.deliveryMethod}</p>
              </div>
              {order.deliveryAddress && (
                <div>
                  <p className="text-sm text-gray-600">Delivery Address</p>
                  <p className="font-medium">{order.deliveryAddress}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Delivery Date</p>
                <p className="font-medium">{formatDate(order.deliveryDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Slot</p>
                <p className="font-medium">{order.deliveryTimeSlot}</p>
              </div>
            </CardContent>
          </Card>

          <Link href="/orders">
            <Button variant="outline" className="w-full">
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <Suspense fallback={<LoadingSpinner className="py-20" />}>
      <OrderDetailContent id={id} />
    </Suspense>
  )
}
