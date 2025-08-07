export interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  apartment?: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface BillingAddress extends ShippingAddress {
  sameAsShipping: boolean
}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'apple_pay'
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  cardholderName?: string
}

export interface OrderSummary {
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
}

export interface CheckoutData {
  shipping: ShippingAddress
  billing: BillingAddress
  payment: PaymentMethod
  orderSummary: OrderSummary
}

export interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
    image: string
  }>
  shipping: ShippingAddress
  billing: BillingAddress
  orderSummary: OrderSummary
  createdAt: Date
  estimatedDelivery: Date
}