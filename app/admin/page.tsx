'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Package, ShoppingCart, Users, Star, Ticket, MessageSquare, Award } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  const { data: productsData } = useQuery({
    queryKey: ['admin-products-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/orders')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  // Handle both old array format and new paginated format
  const products = Array.isArray(productsData) ? productsData : productsData?.products || []
  const orders = Array.isArray(ordersData) ? ordersData : ordersData?.orders || []
  const users = Array.isArray(usersData) ? usersData : usersData?.users || []

  const stats = {
    totalProducts: productsData?.pagination?.total || products.length || 0,
    totalOrders: ordersData?.pagination?.total || orders.length || 0,
    totalUsers: usersData?.stats?.total || users.length || 0,
    pendingOrders: orders.filter((o: any) => o.status === 'PLACED').length || 0,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Products
            </CardTitle>
            <Package className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Users
            </CardTitle>
            <Users className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Orders
            </CardTitle>
            <Star className="h-5 w-5 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingOrders}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Package className="h-5 w-5 text-pink-600" />
            <CardTitle>Product Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-600 text-sm mb-4">
              Manage your product catalog, add new products, update existing ones.
            </p>
            <Link href="/admin/products">
              <Button className="w-full">Manage Products</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-pink-600" />
            <CardTitle>Order Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-600 text-sm mb-4">
              View and manage customer orders, update order statuses.
            </p>
            <Link href="/admin/orders">
              <Button className="w-full">Manage Orders</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Users className="h-5 w-5 text-pink-600" />
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-600 text-sm mb-4">
              View user accounts and manage user permissions.
            </p>
            <Link href="/admin/users">
              <Button className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Ticket className="h-5 w-5 text-pink-600" />
            <CardTitle>Promo Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-600 text-sm mb-4">
              Create and manage discount codes for customers.
            </p>
            <Link href="/admin/promo-codes">
              <Button className="w-full">Manage Promo Codes</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <MessageSquare className="h-5 w-5 text-pink-600" />
            <CardTitle>Review Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-600 text-sm mb-4">
              Approve, reject, or delete customer reviews.
            </p>
            <Link href="/admin/reviews">
              <Button className="w-full">Manage Reviews</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Award className="h-5 w-5 text-pink-600" />
            <CardTitle>Loyalty Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-600 text-sm mb-4">
              View and manage customer loyalty points.
            </p>
            <Link href="/admin/loyalty">
              <Button className="w-full">Manage Loyalty</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
