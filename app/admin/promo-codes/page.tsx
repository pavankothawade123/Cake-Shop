'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchInput } from '@/components/ui/search-input'
import { Pagination } from '@/components/ui/pagination'
import { Plus, Pencil, Trash2, X, Ticket } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'

interface PromoCode {
  id: string
  code: string
  description: string | null
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  minOrderAmount: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  _count: {
    usages: number
  }
}

export default function AdminPromoCodesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    isActive: true,
    expiresAt: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promo-codes', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (search) params.append('search', search)

      const res = await fetch(`/api/admin/promo-codes?${params}`)
      if (!res.ok) throw new Error('Failed to fetch promo codes')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create promo code')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update promo code')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete promo code')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] })
    },
  })

  const openCreateModal = () => {
    setEditingPromo(null)
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minOrderAmount: '',
      maxDiscount: '',
      usageLimit: '',
      isActive: true,
      expiresAt: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (promo: PromoCode) => {
    setEditingPromo(promo)
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      minOrderAmount: promo.minOrderAmount?.toString() || '',
      maxDiscount: promo.maxDiscount?.toString() || '',
      usageLimit: promo.usageLimit?.toString() || '',
      isActive: promo.isActive,
      expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().split('T')[0] : '',
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingPromo(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      code: formData.code,
      description: formData.description || null,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      isActive: formData.isActive,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    }

    if (editingPromo) {
      updateMutation.mutate({ id: editingPromo.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: string, usedCount: number) => {
    if (usedCount > 0) {
      alert('Cannot delete a promo code that has been used. Deactivate it instead.')
      return
    }
    if (confirm('Are you sure you want to delete this promo code?')) {
      deleteMutation.mutate(id)
    }
  }

  const getStatusBadge = (promo: PromoCode) => {
    if (!promo.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return <Badge variant="secondary">Limit Reached</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>
  }

  if (isLoading) return <LoadingSpinner className="py-20" />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Promo Codes</h1>
          <p className="text-gray-600 mt-1">Manage discount codes for your customers</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Promo Code
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by code or description..."
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4">
        {data?.promoCodes?.map((promo: PromoCode) => (
          <Card key={promo.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-pink-100 p-3 rounded-lg">
                    <Ticket className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg font-mono">{promo.code}</h3>
                      {getStatusBadge(promo)}
                    </div>
                    <p className="text-sm text-gray-600">{promo.description || 'No description'}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>
                        {promo.discountType === 'PERCENTAGE'
                          ? `${promo.discountValue}% off`
                          : `${formatPrice(promo.discountValue)} off`}
                      </span>
                      {promo.minOrderAmount && (
                        <span>Min: {formatPrice(promo.minOrderAmount)}</span>
                      )}
                      {promo.maxDiscount && (
                        <span>Max: {formatPrice(promo.maxDiscount)}</span>
                      )}
                      <span>Used: {promo.usedCount}{promo.usageLimit ? `/${promo.usageLimit}` : ''}</span>
                      {promo.expiresAt && (
                        <span>Expires: {formatDate(promo.expiresAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(promo)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(promo.id, promo.usedCount)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {data?.promoCodes?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No promo codes found. Create your first promo code!
          </div>
        )}
      </div>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="WELCOME10"
                    className="font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Case-sensitive, will be converted to uppercase</p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Welcome discount for new customers"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discountType">Discount Type *</Label>
                    <Select
                      id="discountType"
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' })}
                      required
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discountValue">
                      Discount Value * {formData.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      step="0.01"
                      min="0"
                      max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minOrderAmount">Min Order Amount (₹)</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxDiscount">Max Discount (₹)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="usageLimit">Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiresAt">Expiry Date</Label>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>

                {(createMutation.error || updateMutation.error) && (
                  <p className="text-red-500 text-sm">
                    {(createMutation.error || updateMutation.error)?.message}
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
