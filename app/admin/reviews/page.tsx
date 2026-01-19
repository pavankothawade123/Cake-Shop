'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchInput } from '@/components/ui/search-input'
import { Pagination } from '@/components/ui/pagination'
import { Check, X, Trash2, Star, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  comment: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  product: {
    id: string
    name: string
    slug: string
    images: string[]
  }
}

type StatusFilter = '' | 'PENDING' | 'APPROVED' | 'REJECTED'

export default function AdminReviewsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/admin/reviews?${params}`)
      if (!res.ok) throw new Error('Failed to fetch reviews')
      return res.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update review')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete review')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
  })

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'APPROVED' })
  }

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'REJECTED' })
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this review?')) {
      deleteMutation.mutate(id)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (isLoading) return <LoadingSpinner className="py-20" />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Review Management</h1>
        <p className="text-gray-600 mt-1">Approve, reject, or delete customer reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === '' ? 'ring-2 ring-pink-500' : ''}`}
          onClick={() => { setStatusFilter(''); setPage(1) }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{data?.counts?.total || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === 'PENDING' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => { setStatusFilter('PENDING'); setPage(1) }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{data?.counts?.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === 'APPROVED' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => { setStatusFilter('APPROVED'); setPage(1) }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{data?.counts?.approved || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === 'REJECTED' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => { setStatusFilter('REJECTED'); setPage(1) }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{data?.counts?.rejected || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
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
          placeholder="Search by customer name, email, product, or comment..."
          className="max-w-md"
        />
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {data?.reviews?.map((review: Review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <Link href={`/products/${review.product.slug}`}>
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      {review.product.images[0] ? (
                        <Image
                          src={review.product.images[0]}
                          alt={review.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {renderStars(review.rating)}
                        {getStatusBadge(review.status)}
                      </div>
                      <Link
                        href={`/products/${review.product.slug}`}
                        className="font-medium text-pink-600 hover:underline"
                      >
                        {review.product.name}
                      </Link>
                      <p className="text-sm text-gray-600">
                        by {review.user.name} ({review.user.email})
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>

                  {review.comment && (
                    <p className="mt-2 text-gray-700 bg-gray-50 p-3 rounded-lg">
                      "{review.comment}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {review.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(review.id)}
                          disabled={updateStatusMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(review.id)}
                          disabled={updateStatusMutation.isPending}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {review.status === 'REJECTED' && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(review.id)}
                        disabled={updateStatusMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    {review.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(review.id)}
                        disabled={updateStatusMutation.isPending}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(review.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {data?.reviews?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {statusFilter
              ? `No ${statusFilter.toLowerCase()} reviews found.`
              : 'No reviews found.'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </div>
  )
}
