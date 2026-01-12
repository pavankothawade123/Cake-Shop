'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/reviews/star-rating'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import { ShoppingCart } from 'lucide-react'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    images: string[]
    basePrice: number
    isAvailable: boolean
    category: {
      name: string
    }
    averageRating?: number
    reviewCount?: number
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || '/placeholder-cake.jpg',
      basePrice: product.basePrice,
      quantity: 1,
      customization: {
        size: '1kg',
        flavor: '',
        frosting: '',
        isEggless: false,
        customMessage: '',
      },
      price: product.basePrice * 1.8, // 1kg size multiplier
      totalPrice: product.basePrice * 1.8,
    })
  }

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="hover:shadow-lg transition-shadow overflow-hidden">
        <div className="relative h-64 w-full">
          <Image
            src={product.images[0] || '/placeholder-cake.jpg'}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary">{product.category.name}</Badge>
            {product.averageRating !== undefined && (
              <div className="flex items-center space-x-1">
                <StarRating rating={product.averageRating} size={16} />
                <span className="text-sm text-gray-600">
                  ({product.reviewCount})
                </span>
              </div>
            )}
          </div>
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">
            {product.name}
          </h3>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <p className="text-xl font-bold text-pink-600">
            {formatPrice(product.basePrice)}
            <span className="text-sm text-gray-500 ml-1">starting</span>
          </p>
          {product.isAvailable && (
            <Button
              size="sm"
              onClick={handleQuickAdd}
              className="ml-2"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
