'use client'

import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { ProductCard } from '@/components/products/product-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    },
  })

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', category, searchQuery, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (searchQuery) params.append('search', searchQuery)
      params.append('sort', sortBy)
      params.append('order', sortBy === 'basePrice' ? 'asc' : 'desc')

      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL()
  }

  const updateURL = () => {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (searchQuery) params.append('search', searchQuery)
    if (sortBy) params.append('sort', sortBy)
    router.push(`/products?${params}`)
  }

  useEffect(() => {
    updateURL()
  }, [category, sortBy])

  return (
    <>
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </Select>

        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="createdAt">Newest First</option>
          <option value="basePrice">Price: Low to High</option>
          <option value="name">Name: A to Z</option>
        </Select>
      </div>

      {isLoading && <LoadingSpinner className="py-12" />}

      {error && <ErrorMessage message="Failed to load products. Please try again." />}

      {!isLoading && !error && products?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found.</p>
          <Button
            onClick={() => {
              setSearchQuery('')
              setCategory('')
            }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {!isLoading && !error && products?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  )
}

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Our Products</h1>
      <Suspense fallback={<LoadingSpinner className="py-12" />}>
        <ProductsContent />
      </Suspense>
    </div>
  )
}
