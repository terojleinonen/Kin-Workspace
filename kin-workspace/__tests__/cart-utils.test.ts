import { 
  calculateCartTotal, 
  calculateItemCount, 
  formatPrice, 
  generateCartItemId,
  validateCartItem 
} from '../app/lib/cart-utils'
import { Product, CartItem } from '../app/lib/types'

describe('Cart Utilities', () => {
  const mockProduct: Product = {
    id: 'test-product-1',
    name: 'Test Desk',
    price: 299.99,
    image: '/test-image.jpg',
    category: 'Desks',
    slug: 'test-desk'
  }

  const mockCartItem: CartItem = {
    id: 'cart-item-1',
    product: mockProduct,
    quantity: 2
  }

  describe('calculateCartTotal', () => {
    test('should calculate total for single item', () => {
      const items = [mockCartItem]
      const total = calculateCartTotal(items)
      expect(total).toBe(599.98) // 299.99 * 2
    })

    test('should calculate total for multiple items', () => {
      const items = [
        mockCartItem,
        {
          id: 'cart-item-2',
          product: { ...mockProduct, id: 'test-product-2', price: 150.00 },
          quantity: 1
        }
      ]
      const total = calculateCartTotal(items)
      expect(total).toBe(749.98) // (299.99 * 2) + (150.00 * 1)
    })

    test('should return 0 for empty cart', () => {
      const total = calculateCartTotal([])
      expect(total).toBe(0)
    })

    test('should handle zero quantity items', () => {
      const items = [{ ...mockCartItem, quantity: 0 }]
      const total = calculateCartTotal(items)
      expect(total).toBe(0)
    })
  })

  describe('calculateItemCount', () => {
    test('should calculate total item count', () => {
      const items = [
        mockCartItem, // quantity: 2
        {
          id: 'cart-item-2',
          product: { ...mockProduct, id: 'test-product-2' },
          quantity: 3
        }
      ]
      const count = calculateItemCount(items)
      expect(count).toBe(5) // 2 + 3
    })

    test('should return 0 for empty cart', () => {
      const count = calculateItemCount([])
      expect(count).toBe(0)
    })
  })

  describe('formatPrice', () => {
    test('should format price with dollar sign', () => {
      expect(formatPrice(299.99)).toBe('$299.99')
      expect(formatPrice(1000)).toBe('$1,000.00')
      expect(formatPrice(0)).toBe('$0.00')
    })

    test('should handle decimal places correctly', () => {
      expect(formatPrice(299.9)).toBe('$299.90')
      expect(formatPrice(299)).toBe('$299.00')
    })

    test('should handle large numbers', () => {
      expect(formatPrice(1234567.89)).toBe('$1,234,567.89')
    })
  })

  describe('generateCartItemId', () => {
    test('should generate unique IDs', () => {
      const id1 = generateCartItemId(mockProduct)
      const id2 = generateCartItemId(mockProduct)
      expect(id1).not.toBe(id2)
    })

    test('should include product ID in generated ID', () => {
      const id = generateCartItemId(mockProduct)
      expect(id).toContain(mockProduct.id)
    })

    test('should handle variants', () => {
      const variant = { color: 'black', size: 'large' }
      const id = generateCartItemId(mockProduct, variant)
      expect(id).toContain(mockProduct.id)
      expect(id).toContain('black')
      expect(id).toContain('large')
    })
  })

  describe('validateCartItem', () => {
    test('should validate correct cart item', () => {
      const result = validateCartItem(mockCartItem)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('should reject item with invalid quantity', () => {
      const invalidItem = { ...mockCartItem, quantity: 0 }
      const result = validateCartItem(invalidItem)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('quantity')
    })

    test('should reject item with negative quantity', () => {
      const invalidItem = { ...mockCartItem, quantity: -1 }
      const result = validateCartItem(invalidItem)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('quantity')
    })

    test('should reject item without product', () => {
      const invalidItem = { ...mockCartItem, product: null as any }
      const result = validateCartItem(invalidItem)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('product')
    })

    test('should reject item with invalid price', () => {
      const invalidItem = {
        ...mockCartItem,
        product: { ...mockProduct, price: -10 }
      }
      const result = validateCartItem(invalidItem)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('price')
    })
  })
})