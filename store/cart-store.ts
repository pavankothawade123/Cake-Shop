import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  productName: string
  productImage: string
  basePrice: number
  quantity: number
  customization: {
    size: string
    flavor?: string
    frosting?: string
    isEggless: boolean
    customMessage?: string
  }
  price: number
  totalPrice: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, customization: CartItem['customization']) => void
  updateQuantity: (productId: string, customization: CartItem['customization'], quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

const DELIVERY_FEE = 5.00
const TAX_RATE = 0.08

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              JSON.stringify(i.customization) === JSON.stringify(item.customization)
          )

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items]
            updatedItems[existingItemIndex].quantity += item.quantity
            updatedItems[existingItemIndex].totalPrice =
              updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity
            return { items: updatedItems }
          }

          return { items: [...state.items, item] }
        })
      },

      removeItem: (productId, customization) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.productId === productId &&
                JSON.stringify(item.customization) === JSON.stringify(customization))
          ),
        }))
      },

      updateQuantity: (productId, customization, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId &&
            JSON.stringify(item.customization) === JSON.stringify(customization)
              ? {
                  ...item,
                  quantity,
                  totalPrice: item.price * quantity,
                }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const subtotal = get().items.reduce((sum, item) => sum + item.totalPrice, 0)
        const tax = subtotal * TAX_RATE
        const total = subtotal + tax + (get().items.length > 0 ? DELIVERY_FEE : 0)
        return total
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)

export function calculateItemPrice(basePrice: number, size: string): number {
  const sizeMultipliers: Record<string, number> = {
    '0.5kg': 1,
    '1kg': 1.8,
    '2kg': 3.2,
  }
  return basePrice * (sizeMultipliers[size] || 1)
}

export function getCartSummary() {
  const items = useCartStore.getState().items
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const tax = subtotal * TAX_RATE
  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0
  const total = subtotal + tax + deliveryFee

  return {
    subtotal,
    tax,
    deliveryFee,
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}
