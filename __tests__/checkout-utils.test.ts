import {
  validateShippingInfo,
  validateBillingInfo,
  validatePaymentInfo,
  calculateShipping,
  calculateTax,
  calculateOrderTotal,
  formatOrderNumber,
  validateCheckoutData
} from '../app/lib/checkout-utils'
import { ShippingInfo, BillingInfo, PaymentInfo } from '../app/lib/checkout-types'

describe('Checkout Utilities', () => {
  const validShippingInfo: ShippingInfo = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-1234',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US'
  }

  const validBillingInfo: BillingInfo = {
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US'
  }

  const validPaymentInfo: PaymentInfo = {
    cardNumber: '4111111111111111',
    expiryDate: '12/25',
    cvv: '123',
    cardholderName: 'John Doe'
  }

  describe('validateShippingInfo', () => {
    test('should validate correct shipping info', () => {
      const result = validateShippingInfo(validShippingInfo)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    test('should reject missing required fields', () => {
      const invalidInfo = { ...validShippingInfo, firstName: '', email: '' }
      const result = validateShippingInfo(invalidInfo)
      
      expect(result.valid).toBe(false)
      expect(result.errors.firstName).toBeDefined()
      expect(result.errors.email).toBeDefined()
    })

    test('should validate email format', () => {
      const invalidInfo = { ...validShippingInfo, email: 'invalid-email' }
      const result = validateShippingInfo(invalidInfo)
      
      expect(result.valid).toBe(false)
      expect(result.errors.email).toContain('valid email')
    })

    test('should validate phone format', () => {
      const invalidInfo = { ...validShippingInfo, phone: '123' }
      const result = validateShippingInfo(invalidInfo)
      
      expect(result.valid).toBe(false)
      expect(result.errors.phone).toBeDefined()
    })

    test('should validate zip code format', () => {
      const invalidInfo = { ...validShippingInfo, zipCode: '123' }
      const result = validateShippingInfo(invalidInfo)
      
      expect(result.valid).toBe(false)
      expect(result.errors.zipCode).toBeDefined()
    })
  })

  describe('validateBillingInfo', () => {
    test('should validate correct billing info', () => {
      const result = validateBillingInfo(validBillingInfo)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    test('should reject missing required fields', () => {
      const invalidInfo = { ...validBillingInfo, firstName: '', address: '' }
      const result = validateBillingInfo(invalidInfo)
      
      expect(result.valid).toBe(false)
      expect(result.errors.firstName).toBeDefined()
      expect(result.errors.address).toBeDefined()
    })
  })

  describe('validatePaymentInfo', () => {
    test('should validate correct payment info', () => {
      const result = validatePaymentInfo(validPaymentInfo)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    test('should validate card number', () => {
      const invalidInfo = { ...validPaymentInfo, cardNumber: '1234' }
      const result = validatePaymentInfo(invalidInfo)
      
      expect(result.valid).toBe(false)
      expect(result.errors.cardNumber).toBeDefined()
    })

    test('should validate expiry date format', () => {
      const invalidInfo = { ...validPaymentInfo, expiryDate: '13/25' }
      const result = validatePaymentInfo(invalidInfo)
      
      expect(result.valid).toBe(false)
      expect(result.errors.expiryDate).toBeDefined()
    })

    test('should validate CVV', () => {
      const invalidInfo = { ...validPaymentInfo, cvv: '12' }
      const result = validatePaymentInfo(invalidInfo)
      
      expect(result.valid).toBe(false)
      expect(result.errors.cvv).toBeDefined()
    })

    test('should reject expired cards', () => {
      const invalidInfo = { ...validPaymentInfo, expiryDate: '01/20' }
      const result = validatePaymentInfo(invalidInfo)
      
      expect(result.valid).toBe(false)
      expect(result.errors.expiryDate).toContain('expired')
    })
  })

  describe('calculateShipping', () => {
    test('should calculate standard shipping', () => {
      const shipping = calculateShipping(100, 'standard')
      expect(shipping).toBe(9.99)
    })

    test('should calculate express shipping', () => {
      const shipping = calculateShipping(100, 'express')
      expect(shipping).toBe(19.99)
    })

    test('should provide free shipping for orders over threshold', () => {
      const shipping = calculateShipping(500, 'standard')
      expect(shipping).toBe(0)
    })

    test('should handle overnight shipping', () => {
      const shipping = calculateShipping(100, 'overnight')
      expect(shipping).toBe(29.99)
    })
  })

  describe('calculateTax', () => {
    test('should calculate tax for taxable states', () => {
      const tax = calculateTax(100, 'NY')
      expect(tax).toBeGreaterThan(0)
    })

    test('should return 0 for non-taxable states', () => {
      const tax = calculateTax(100, 'OR')
      expect(tax).toBe(0)
    })

    test('should handle different tax rates', () => {
      const nyTax = calculateTax(100, 'NY')
      const caTax = calculateTax(100, 'CA')
      expect(nyTax).not.toBe(caTax)
    })
  })

  describe('calculateOrderTotal', () => {
    test('should calculate complete order total', () => {
      const orderData = {
        subtotal: 100,
        shipping: 9.99,
        tax: 8.25,
        discount: 0
      }
      
      const total = calculateOrderTotal(orderData)
      expect(total).toBe(118.24)
    })

    test('should apply discount', () => {
      const orderData = {
        subtotal: 100,
        shipping: 9.99,
        tax: 8.25,
        discount: 10
      }
      
      const total = calculateOrderTotal(orderData)
      expect(total).toBe(108.24)
    })
  })

  describe('formatOrderNumber', () => {
    test('should format order number correctly', () => {
      const orderNumber = formatOrderNumber(12345)
      expect(orderNumber).toMatch(/^KW-\d{8}-12345$/)
    })

    test('should generate unique order numbers', () => {
      const order1 = formatOrderNumber(1)
      const order2 = formatOrderNumber(2)
      expect(order1).not.toBe(order2)
    })
  })

  describe('validateCheckoutData', () => {
    test('should validate complete checkout data', () => {
      const checkoutData = {
        shipping: validShippingInfo,
        billing: validBillingInfo,
        payment: validPaymentInfo,
        items: [
          {
            id: 'item-1',
            product: {
              id: 'product-1',
              name: 'Test Product',
              price: 100,
              image: '/test.jpg',
              category: 'Test',
              slug: 'test-product'
            },
            quantity: 1
          }
        ]
      }

      const result = validateCheckoutData(checkoutData)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    test('should reject invalid checkout data', () => {
      const checkoutData = {
        shipping: { ...validShippingInfo, email: 'invalid' },
        billing: { ...validBillingInfo, firstName: '' },
        payment: { ...validPaymentInfo, cardNumber: '123' },
        items: []
      }

      const result = validateCheckoutData(checkoutData)
      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(0)
    })

    test('should reject empty cart', () => {
      const checkoutData = {
        shipping: validShippingInfo,
        billing: validBillingInfo,
        payment: validPaymentInfo,
        items: []
      }

      const result = validateCheckoutData(checkoutData)
      expect(result.valid).toBe(false)
      expect(result.errors.items).toContain('empty')
    })
  })
})