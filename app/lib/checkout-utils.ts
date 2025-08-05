import { Cart, CartItem } from './types'
import { OrderSummary, ShippingInfo, BillingInfo, PaymentInfo } from './checkout-types'

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

// Additional functions needed for tests
export const validateShippingInfo = (info: ShippingInfo): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  if (!info.firstName?.trim()) errors.firstName = 'First name is required'
  if (!info.lastName?.trim()) errors.lastName = 'Last name is required'
  if (!info.email?.trim()) errors.email = 'Email is required'
  else if (!validateEmail(info.email)) errors.email = 'Please enter a valid email address'
  if (!info.phone?.trim()) errors.phone = 'Phone number is required'
  else if (!validatePhone(info.phone)) errors.phone = 'Please enter a valid phone number'
  if (!info.address?.trim()) errors.address = 'Address is required'
  if (!info.city?.trim()) errors.city = 'City is required'
  if (!info.state?.trim()) errors.state = 'State is required'
  if (!info.zipCode?.trim()) errors.zipCode = 'ZIP code is required'
  else if (!validateZipCode(info.zipCode, info.country)) errors.zipCode = 'Please enter a valid ZIP code'
  if (!info.country?.trim()) errors.country = 'Country is required'

  return { valid: Object.keys(errors).length === 0, errors }
}

export const validateBillingInfo = (info: BillingInfo): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  if (!info.firstName?.trim()) errors.firstName = 'First name is required'
  if (!info.lastName?.trim()) errors.lastName = 'Last name is required'
  if (!info.address?.trim()) errors.address = 'Address is required'
  if (!info.city?.trim()) errors.city = 'City is required'
  if (!info.state?.trim()) errors.state = 'State is required'
  if (!info.zipCode?.trim()) errors.zipCode = 'ZIP code is required'
  else if (!validateZipCode(info.zipCode, info.country)) errors.zipCode = 'Please enter a valid ZIP code'
  if (!info.country?.trim()) errors.country = 'Country is required'

  return { valid: Object.keys(errors).length === 0, errors }
}

export const validatePaymentInfo = (info: PaymentInfo): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  if (!info.cardNumber?.trim()) errors.cardNumber = 'Card number is required'
  else if (!validateCardNumber(info.cardNumber)) errors.cardNumber = 'Please enter a valid card number'
  
  if (!info.expiryDate?.trim()) errors.expiryDate = 'Expiry date is required'
  else if (!validateExpiryDate(info.expiryDate)) {
    const [month, year] = info.expiryDate.split('/')
    const monthNum = parseInt(month)
    const yearNum = parseInt(`20${year}`)
    const now = new Date()
    const expiry = new Date(yearNum, monthNum - 1)
    
    if (expiry < now) {
      errors.expiryDate = 'Card has expired'
    } else {
      errors.expiryDate = 'Please enter a valid expiry date (MM/YY)'
    }
  }
  
  if (!info.cvv?.trim()) errors.cvv = 'CVV is required'
  else if (!/^\d{3,4}$/.test(info.cvv)) errors.cvv = 'Please enter a valid CVV'
  
  if (!info.cardholderName?.trim()) errors.cardholderName = 'Cardholder name is required'

  return { valid: Object.keys(errors).length === 0, errors }
}

export const calculateShipping = (subtotal: number, method: string): number => {
  if (subtotal >= 500) return 0 // Free shipping over $500
  
  switch (method) {
    case 'standard': return 9.99
    case 'express': return 19.99
    case 'overnight': return 29.99
    default: return 9.99
  }
}

export const calculateTax = (subtotal: number, state: string): number => {
  const taxRates: Record<string, number> = {
    'NY': 0.08,
    'CA': 0.0725,
    'TX': 0.0625,
    'FL': 0.06,
    'OR': 0, // No sales tax
    'NH': 0, // No sales tax
    'DE': 0, // No sales tax
  }
  
  const rate = taxRates[state] || 0.05 // Default 5% for other states
  return subtotal * rate
}

export const calculateOrderTotal = (orderData: {
  subtotal: number
  shipping: number
  tax: number
  discount: number
}): number => {
  return orderData.subtotal + orderData.shipping + orderData.tax - orderData.discount
}

export const formatOrderNumber = (orderId: number): string => {
  const timestamp = Date.now().toString().slice(-8)
  return `KW-${timestamp}-${orderId}`
}

export const validateCheckoutData = (data: {
  shipping: ShippingInfo
  billing: BillingInfo
  payment: PaymentInfo
  items: CartItem[]
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  // Validate shipping info
  const shippingValidation = validateShippingInfo(data.shipping)
  if (!shippingValidation.valid) {
    Object.keys(shippingValidation.errors).forEach(key => {
      errors[`shipping.${key}`] = shippingValidation.errors[key]
    })
  }

  // Validate billing info
  const billingValidation = validateBillingInfo(data.billing)
  if (!billingValidation.valid) {
    Object.keys(billingValidation.errors).forEach(key => {
      errors[`billing.${key}`] = billingValidation.errors[key]
    })
  }

  // Validate payment info
  const paymentValidation = validatePaymentInfo(data.payment)
  if (!paymentValidation.valid) {
    Object.keys(paymentValidation.errors).forEach(key => {
      errors[`payment.${key}`] = paymentValidation.errors[key]
    })
  }

  // Validate cart items
  if (!data.items || data.items.length === 0) {
    errors.items = 'Cart cannot be empty'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}