'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { SearchInput } from '@/components/ui/search-input'
import { Pagination } from '@/components/ui/pagination'
import { formatPrice, formatDate } from '@/lib/utils'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Image as ImageIcon, Sparkles } from 'lucide-react'
import Image from 'next/image'

const statusColors: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  BAKING: 'bg-yellow-100 text-yellow-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const DIETARY_LABELS: Record<string, string> = {
  EGGLESS: 'Eggless',
  VEGAN: 'Vegan',
  SUGAR_FREE: 'Sugar Free',
  GLUTEN_FREE: 'Gluten Free',
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orders', filterStatus, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (filterStatus) params.append('status', filterStatus)
      if (search) params.append('search', search)

      const res = await fetch(`/api/admin/orders?${params}`)
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

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const orders = data?.orders || data || []
  const pagination = data?.pagination

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-gray-600 mt-1">View and manage customer orders</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by order #, customer name, email, or cake..."
          className="flex-1 max-w-md"
        />
        <Select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value)
            setPage(1)
          }}
          className="w-48"
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
                      Phone: {order.customerPhone}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

                {order.deliveryAddress && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-medium">{order.deliveryAddress}</p>
                  </div>
                )}

                {/* Discount Info */}
                {(order.promoDiscount > 0 || order.pointsDiscount > 0) && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-1">Discounts Applied</p>
                    {order.promoDiscount > 0 && (
                      <p className="text-sm text-green-700">Promo Discount: -{formatPrice(order.promoDiscount)}</p>
                    )}
                    {order.pointsDiscount > 0 && (
                      <p className="text-sm text-green-700">
                        Points Redeemed: {order.pointsRedeemed} pts (-{formatPrice(order.pointsDiscount)})
                      </p>
                    )}
                  </div>
                )}

                {/* Order Items */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Items:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrderExpanded(order.id)}
                      className="text-xs"
                    >
                      {expandedOrders.has(order.id) ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show Details
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">
                            {item.quantity}x {item.product?.name || 'Unknown Product'} ({item.size})
                          </p>
                          <p className="text-pink-600 font-medium">{formatPrice(item.totalPrice)}</p>
                        </div>

                        {/* Basic customization */}
                        <div className="text-sm text-gray-600 mt-1">
                          {item.flavor && <span className="mr-3">Flavor: {item.flavor}</span>}
                          {item.frosting && <span className="mr-3">Frosting: {item.frosting}</span>}
                          {item.isEggless && <Badge variant="outline" className="mr-2">Eggless</Badge>}
                        </div>

                        {item.customMessage && (
                          <p className="text-sm text-gray-600 mt-1">
                            Message: "{item.customMessage}"
                          </p>
                        )}

                        {/* Enhanced customization details - shown when expanded */}
                        {expandedOrders.has(order.id) && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            {item.nameOnCake && (
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-pink-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Name on Cake</p>
                                  <p className="text-sm text-gray-600">{item.nameOnCake}</p>
                                </div>
                              </div>
                            )}

                            {item.designInstructions && (
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-pink-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Design Instructions</p>
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.designInstructions}</p>
                                </div>
                              </div>
                            )}

                            {item.referenceImageUrl && (
                              <div className="flex items-start gap-2">
                                <ImageIcon className="h-4 w-4 text-pink-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium mb-2">Reference Image</p>
                                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border">
                                    <Image
                                      src={item.referenceImageUrl}
                                      alt="Reference design"
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {item.dietaryPreferences && item.dietaryPreferences.length > 0 && (
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-pink-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Dietary Preferences</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.dietaryPreferences.map((pref: string) => (
                                      <Badge key={pref} variant="outline" className="text-xs">
                                        {DIETARY_LABELS[pref] || pref}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {item.allergyNotes && (
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-red-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-600">Allergy Notes</p>
                                  <p className="text-sm text-red-600">{item.allergyNotes}</p>
                                </div>
                              </div>
                            )}

                            {!item.nameOnCake && !item.designInstructions && !item.referenceImageUrl &&
                             (!item.dietaryPreferences || item.dietaryPreferences.length === 0) && !item.allergyNotes && (
                              <p className="text-sm text-gray-400 italic">No advanced customization</p>
                            )}
                          </div>
                        )}
                      </div>
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
                    className="w-64"
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </div>
  )
}
