import { Cart, CartItem, Product } from './types'

export const calculateCartTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
}

export const calculateItemCount = (items: CartItem[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0)
}

export const generateCartItemId = (product: Product, variant?: CartItem['variant']): string => {
  const variantString = variant ? JSON.stringify(variant) : ''
  const timestamp = Date.now()
  return `${product.id}-${variantString}${timestamp}`
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export const saveCartToStorage = (cart: Cart): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kin-workspace-cart', JSON.stringify(cart))
  }
}

export const loadCartFromStorage = (): Cart => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('kin-workspace-cart')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return {
          items: parsed.items || [],
          total: calculateCartTotal(parsed.items || []),
          itemCount: calculateItemCount(parsed.items || []),
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error)
      }
    }
  }
  return { items: [], total: 0, itemCount: 0 }
}

export const validateCartItem = (item: CartItem): { valid: boolean; error?: string } => {
  if (!item.product) {
    return { valid: false, error: 'Product is required' }
  }
  
  if (!item.quantity || item.quantity <= 0) {
    return { valid: false, error: 'Quantity must be greater than 0' }
  }
  
  if (!item.product.price || item.product.price <= 0) {
    return { valid: false, error: 'Product price must be greater than 0' }
  }
  
  return { valid: true }
}