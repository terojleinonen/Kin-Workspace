'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/app/lib/cart-utils'

interface OrderData {
  orderNumber: string
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
    image: string
  }>
  shipping: {
    firstName: string
    lastName: string
    email: string
    address: string
    city: string
    state: string
    zipCode: string
  }
  orderSummary: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  estimatedDelivery: string
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [orderData, setOrderData] = useState<OrderData | null>(null)

  useEffect(() => {
    // Load order data from localStorage (in real app, this would come from API)
    const savedOrder = localStorage.getItem('lastOrder')
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder)
        setOrderData(parsed)
      } catch (error) {
        console.error('Error parsing order data:', error)
      }
    }
  }, [])

  if (!orderNumber || !orderData) {
    return (
      <div className="pt-24 pb-section">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h1 className="font-satoshi font-bold text-3xl text-matte-black mb-4">
            Order Not Found
          </h1>
          <p className="text-slate-gray mb-8">
            We couldn't find your order. Please check your email for confirmation details.
          </p>
          <Link href="/shop" className="btn-primary inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const estimatedDelivery = new Date(orderData.estimatedDelivery).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="pt-24 pb-section">
      <div className="max-w-4xl mx-auto px-6">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">✓</span>
            </div>
          </div>
          <h1 className="font-satoshi font-bold text-3xl md:text-4xl text-matte-black mb-4">
            Order Confirmed!
          </h1>
          <p className="text-slate-gray text-lg mb-2">
            Thank you for your order, {orderData.shipping.firstName}!
          </p>
          <p className="text-slate-gray">
            Order #{orderNumber} • Confirmation sent to {orderData.shipping.email}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-satoshi font-semibold text-xl text-matte-black mb-4">
                Order Items
              </h2>
              <div className="space-y-4">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-warm-beige rounded-lg">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-satoshi font-medium text-matte-black">
                        {item.name}
                      </h3>
                      <p className="text-slate-gray text-sm">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-satoshi font-semibold text-matte-black">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-satoshi font-semibold text-xl text-matte-black mb-4">
                Shipping Information
              </h2>
              <div className="text-slate-gray space-y-1">
                <p className="font-medium text-matte-black">
                  {orderData.shipping.firstName} {orderData.shipping.lastName}
                </p>
                <p>{orderData.shipping.address}</p>
                <p>
                  {orderData.shipping.city}, {orderData.shipping.state} {orderData.shipping.zipCode}
                </p>
                <p className="pt-2 text-sm">
                  <strong>Estimated Delivery:</strong> {estimatedDelivery}
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-satoshi font-semibold text-xl text-matte-black mb-4">
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-gray">Subtotal</span>
                  <span className="font-medium">{formatPrice(orderData.orderSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-gray">Shipping</span>
                  <span className="font-medium">
                    {orderData.orderSummary.shipping === 0 ? 'Free' : formatPrice(orderData.orderSummary.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-gray">Tax</span>
                  <span className="font-medium">{formatPrice(orderData.orderSummary.tax)}</span>
                </div>
                <div className="border-t border-warm-beige pt-3">
                  <div className="flex justify-between">
                    <span className="font-satoshi font-semibold text-lg text-matte-black">Total</span>
                    <span className="font-satoshi font-bold text-xl text-matte-black">
                      {formatPrice(orderData.orderSummary.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="space-y-3">
                <h3 className="font-satoshi font-semibold text-matte-black">
                  What's Next?
                </h3>
                <div className="text-sm text-slate-gray space-y-2">
                  <p>• You'll receive a shipping confirmation email</p>
                  <p>• Track your order with the provided tracking number</p>
                  <p>• Your items will arrive by {estimatedDelivery}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-12 space-y-4">
          <div className="space-x-4">
            <Link href="/shop" className="btn-primary inline-block">
              Continue Shopping
            </Link>
            <button
              onClick={() => window.print()}
              className="btn-secondary inline-block"
            >
              Print Receipt
            </button>
          </div>
          <p className="text-slate-gray text-sm">
            Need help? <Link href="/support" className="text-matte-black hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  )
}