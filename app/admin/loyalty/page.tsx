'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchInput } from '@/components/ui/search-input'
import { Pagination } from '@/components/ui/pagination'
import { Award, TrendingUp, TrendingDown, Users, X, Plus, Minus } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface LoyaltyRecord {
  id: string
  userId: string
  currentBalance: number
  totalEarned: number
  totalUsed: number
  user: {
    id: string
    name: string
    email: string
  }
  _count: {
    transactions: number
  }
}

export default function AdminLoyaltyPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<LoyaltyRecord | null>(null)
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-loyalty', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (search) params.append('search', search)

      const res = await fetch(`/api/admin/loyalty?${params}`)
      if (!res.ok) throw new Error('Failed to fetch loyalty records')
      return res.json()
    },
  })

  const adjustMutation = useMutation({
    mutationFn: async ({
      userId,
      adjustment,
      reason,
    }: {
      userId: string
      adjustment: number
      reason: string
    }) => {
      const res = await fetch(`/api/admin/loyalty/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment, reason }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to adjust points')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loyalty'] })
      closeAdjustModal()
    },
  })

  const openAdjustModal = (record: LoyaltyRecord) => {
    setSelectedUser(record)
    setAdjustmentAmount('')
    setAdjustmentReason('')
    setAdjustmentType('add')
  }

  const closeAdjustModal = () => {
    setSelectedUser(null)
    setAdjustmentAmount('')
    setAdjustmentReason('')
  }

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    const amount = parseInt(adjustmentAmount)
    if (isNaN(amount) || amount <= 0) return

    const adjustment = adjustmentType === 'add' ? amount : -amount

    adjustMutation.mutate({
      userId: selectedUser.userId,
      adjustment,
      reason: adjustmentReason,
    })
  }

  if (isLoading) return <LoadingSpinner className="py-20" />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Loyalty Points Management</h1>
        <p className="text-gray-600 mt-1">View and manage customer loyalty points</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{data?.pagination?.total || 0}</p>
              </div>
              <Users className="h-8 w-8 text-pink-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Points Earned</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(data?.totals?.totalEarned || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Points Used</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatNumber(data?.totals?.totalUsed || 0)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding Balance</p>
                <p className="text-2xl font-bold text-pink-600">
                  {formatNumber(data?.totals?.totalBalance || 0)}
                </p>
              </div>
              <Award className="h-8 w-8 text-pink-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by customer name or email..."
          className="max-w-md"
        />
      </div>

      {/* Loyalty Records Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                    Current Balance
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                    Total Earned
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                    Total Used
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                    Transactions
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.loyaltyRecords?.map((record: LoyaltyRecord) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{record.user.name}</p>
                        <p className="text-sm text-gray-500">{record.user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-pink-600">
                        {formatNumber(record.currentBalance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      +{formatNumber(record.totalEarned)}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600">
                      -{formatNumber(record.totalUsed)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {record._count.transactions}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAdjustModal(record)}
                      >
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data?.loyaltyRecords?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No loyalty records found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      {/* Adjust Points Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Adjust Points</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeAdjustModal}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedUser.user.name}</p>
                <p className="text-sm text-gray-500">{selectedUser.user.email}</p>
                <p className="text-sm mt-1">
                  Current Balance:{' '}
                  <span className="font-bold text-pink-600">
                    {formatNumber(selectedUser.currentBalance)} points
                  </span>
                </p>
              </div>

              <form onSubmit={handleAdjust} className="space-y-4">
                <div>
                  <Label>Adjustment Type</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      type="button"
                      variant={adjustmentType === 'add' ? 'default' : 'outline'}
                      onClick={() => setAdjustmentType('add')}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Points
                    </Button>
                    <Button
                      type="button"
                      variant={adjustmentType === 'subtract' ? 'default' : 'outline'}
                      onClick={() => setAdjustmentType('subtract')}
                      className="flex-1"
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Remove Points
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    max={adjustmentType === 'subtract' ? selectedUser.currentBalance : undefined}
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="Enter points"
                    required
                  />
                  {adjustmentType === 'subtract' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: {formatNumber(selectedUser.currentBalance)} points
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <Input
                    id="reason"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="e.g., Promotional bonus, Correction, etc."
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeAdjustModal}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={adjustMutation.isPending}
                  >
                    {adjustMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>

                {adjustMutation.error && (
                  <p className="text-red-500 text-sm">
                    {adjustMutation.error.message}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
