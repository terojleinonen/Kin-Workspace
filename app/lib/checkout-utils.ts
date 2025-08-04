import { Cart } from './types'
import { OrderSummary } from './checkout-types'

export const calculateOrderSummary = (cart: Cart, shippingCost = 0, discountAmount = 0): OrderSummary => {
  const subtotal = cart.total
  const shipping = subtotal > 100 ? 0 : shippingCost || 15
  const tax = subtotal * 0.08 // 8% tax rate
  const discount = discountAmount
  const total = subtotal + shipping + tax - discount

  return {
    subtotal,
    shipping,
    tax,
    discount,
    total
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

export const validateZipCode = (zipCode: string, country: string): boolean => {
  if (country === 'US') {
    return /^\d{5}(-\d{4})?$/.test(zipCode)
  }
  // Add more country-specific validations as needed
  return zipCode.length >= 3
}

export const validateCardNumber = (cardNumber: string): boolean => {
  // Basic Luhn algorithm check
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  
  let sum = 0
  let isEven = false
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i])
    
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

export const validateExpiryDate = (expiryDate: string): boolean => {
  const [month, year] = expiryDate.split('/')
  if (!month || !year) return false
  
  const monthNum = parseInt(month)
  const yearNum = parseInt(`20${year}`)
  
  if (monthNum < 1 || monthNum > 12) return false
  
  const now = new Date()
  const expiry = new Date(yearNum, monthNum - 1)
  
  return expiry > now
}

export const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  const groups = digits.match(/.{1,4}/g) || []
  return groups.join(' ').substr(0, 19) // Max 16 digits + 3 spaces
}

export const formatExpiryDate = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 2) {
    return `${digits.substr(0, 2)}/${digits.substr(2, 2)}`
  }
  return digits
}

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `KW-${timestamp}-${random}`.toUpperCase()
}

export const getEstimatedDelivery = (shippingMethod: string = 'standard'): Date => {
  const now = new Date()
  const deliveryDays = shippingMethod === 'express' ? 2 : 7
  now.setDate(now.getDate() + deliveryDays)
  return now
}