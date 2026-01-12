'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { formatPrice, formatDate } from '@/lib/utils'
import { useState } from 'react'

const statusColors: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  BAKING: 'bg-yellow-100 text-yellow-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('')

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['admin-orders', filterStatus],
    queryFn: async () => {
      const params = filterStatus ? `?status=${filterStatus}` : ''
      const res = await fetch(`/api/admin/orders${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      return res.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update order')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-64"
        >
          <option value="">All Statuses</option>
          <option value="PLACED">Placed</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="BAKING">Baking</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      {isLoading && <LoadingSpinner className="py-12" />}
      {error && <ErrorMessage message="Failed to load orders" />}

      {!isLoading && !error && orders?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No orders found.</p>
        </div>
      )}

      {!isLoading && !error && orders?.length > 0 && (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.orderNumber}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.customerName} - {order.customerEmail}
                    </p>
                    <p className="text-sm text-gray-600">
                      Placed: {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <Badge className={statusColors[order.status]}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Delivery Date</p>
                    <p className="font-medium">{formatDate(order.deliveryDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time Slot</p>
                    <p className="font-medium">{order.deliveryTimeSlot}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Method</p>
                    <p className="font-medium">{order.deliveryMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-medium text-pink-600">{formatPrice(order.total)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Items:</p>
                  <div className="space-y-1">
                    {order.items.map((item: any) => (
                      <p key={item.id} className="text-sm">
                        {item.quantity}x {item.product.name} ({item.size})
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 block mb-2">
                    Update Status:
                  </label>
                  <Select
                    value={order.status}
                    onChange={(e) =>
                      updateStatusMutation.mutate({
                        orderId: order.id,
                        status: e.target.value,
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <option value="PLACED">Placed</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="BAKING">Baking</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
