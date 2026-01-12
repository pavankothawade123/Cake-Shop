'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { StarRating } from '@/components/reviews/star-rating'
import { formatPrice, formatDate } from '@/lib/utils'
import { useCartStore, calculateItemPrice } from '@/store/cart-store'
import { ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)

  const [customization, setCustomization] = useState({
    size: '1kg',
    flavor: '',
    frosting: '',
    isEggless: false,
    customMessage: '',
  })
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/products?search=${params.slug}`)
      if (!res.ok) throw new Error('Failed to fetch product')
      const products = await res.json()
      return products.find((p: any) => p.slug === params.slug)
    },
  })

  if (isLoading) return <LoadingSpinner className="py-20" />
  if (error || !product) return (
    <div className="container mx-auto px-4 py-20">
      <ErrorMessage message="Product not found" />
    </div>
  )

  const itemPrice = calculateItemPrice(product.basePrice, customization.size)
  const totalPrice = itemPrice * quantity

  const handleAddToCart = () => {
    if (!deliveryDate || !deliveryTimeSlot) {
      alert('Please select delivery date and time slot')
      return
    }

    const selectedDate = new Date(deliveryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      alert('Delivery date cannot be in the past')
      return
    }

    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0],
      basePrice: product.basePrice,
      quantity,
      customization,
      price: itemPrice,
      totalPrice,
    })

    router.push('/cart')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
            <Image
              src={product.images[selectedImage] || '/placeholder-cake.jpg'}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === idx ? 'border-pink-600' : 'border-gray-200'
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-4">
            <Badge>{product.category.name}</Badge>
            {!product.isAvailable && (
              <Badge variant="destructive" className="ml-2">Out of Stock</Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          {product.averageRating > 0 && (
            <div className="flex items-center space-x-2 mb-4">
              <StarRating rating={product.averageRating} />
              <span className="text-sm text-gray-600">
                ({product.reviews.length} reviews)
              </span>
            </div>
          )}

          <p className="text-gray-600 mb-6">{product.description}</p>

          <Card className="mb-6">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="size">Size *</Label>
                <Select
                  id="size"
                  value={customization.size}
                  onChange={(e) => setCustomization({ ...customization, size: e.target.value })}
                  className="mt-2"
                >
                  <option value="0.5kg">0.5kg</option>
                  <option value="1kg">1kg</option>
                  <option value="2kg">2kg</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="flavor">Flavor</Label>
                <Input
                  id="flavor"
                  placeholder="e.g., Chocolate, Vanilla, Strawberry"
                  value={customization.flavor}
                  onChange={(e) => setCustomization({ ...customization, flavor: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="frosting">Frosting</Label>
                <Input
                  id="frosting"
                  placeholder="e.g., Buttercream, Fondant"
                  value={customization.frosting}
                  onChange={(e) => setCustomization({ ...customization, frosting: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="eggless"
                  checked={customization.isEggless}
                  onChange={(e) => setCustomization({ ...customization, isEggless: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="eggless">Make it Eggless</Label>
              </div>

              <div>
                <Label htmlFor="message">Custom Message (max 50 characters)</Label>
                <Input
                  id="message"
                  placeholder="Happy Birthday!"
                  maxLength={50}
                  value={customization.customMessage}
                  onChange={(e) => setCustomization({ ...customization, customMessage: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customization.customMessage.length}/50 characters
                </p>
              </div>

              <div>
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="timeSlot">Time Slot *</Label>
                <Select
                  id="timeSlot"
                  value={deliveryTimeSlot}
                  onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                  className="mt-2"
                >
                  <option value="">Select a time slot</option>
                  <option value="9AM-12PM">9AM - 12PM</option>
                  <option value="12PM-3PM">12PM - 3PM</option>
                  <option value="3PM-6PM">3PM - 6PM</option>
                  <option value="6PM-9PM">6PM - 9PM</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Price per item:</span>
              <span className="font-semibold">{formatPrice(itemPrice)}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-pink-600">{formatPrice(totalPrice)}</span>
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            className="w-full"
            size="lg"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {product.isAvailable ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </div>

      {product.reviews.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review: any) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{review.user.name}</p>
                      <StarRating rating={review.rating} size={16} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  {review.comment && (
                    <p className="text-gray-600 mt-2">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
