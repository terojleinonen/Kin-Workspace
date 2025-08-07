'use client'

import Image from 'next/image'
import { Cart } from '@/app/lib/types'
import { OrderSummary as OrderSummaryType } from '@/app/lib/checkout-types'
import { formatPrice } from '@/app/lib/cart-utils'

interface OrderSummaryProps {
  cart: Cart
  orderSummary: OrderSummaryType
}

export default function OrderSummary({ cart, orderSummary }: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm sticky top-24">
      <h3 className="font-satoshi font-semibold text-xl text-matte-black mb-6">
        Order Summary
      </h3>
      
      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-satoshi font-medium text-sm text-matte-black truncate">
                {item.product.name}
              </h4>
              <p className="text-xs text-slate-gray">
                Qty: {item.quantity}
              </p>
            </div>
            <p className="font-satoshi font-semibold text-sm text-matte-black">
              {formatPrice(item.product.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>
      
      {/* Order Totals */}
      <div className="space-y-3 border-t border-warm-beige pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-gray">Subtotal</span>
          <span className="font-medium">{formatPrice(orderSummary.subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-gray">Shipping</span>
          <span className="font-medium">
            {orderSummary.shipping === 0 ? 'Free' : formatPrice(orderSummary.shipping)}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-gray">Tax</span>
          <span className="font-medium">{formatPrice(orderSummary.tax)}</span>
        </div>
        
        {orderSummary.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-gray">Discount</span>
            <span className="font-medium text-green-600">
              -{formatPrice(orderSummary.discount)}
            </span>
          </div>
        )}
        
        <div className="border-t border-warm-beige pt-3">
          <div className="flex justify-between">
            <span className="font-satoshi font-semibold text-lg text-matte-black">Total</span>
            <span className="font-satoshi font-bold text-xl text-matte-black">
              {formatPrice(orderSummary.total)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Free Shipping Notice */}
      {orderSummary.subtotal < 100 && (
        <div className="mt-4 p-3 bg-warm-beige/20 rounded-lg">
          <p className="text-xs text-slate-gray text-center">
            Add {formatPrice(100 - orderSummary.subtotal)} more for free shipping!
          </p>
        </div>
      )}
      
      {/* Security Badges */}
      <div className="mt-6 pt-4 border-t border-warm-beige">
        <div className="flex items-center justify-center space-x-4 text-xs text-slate-gray">
          <div className="flex items-center space-x-1">
            <span>🔒</span>
            <span>SSL Secure</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>✓</span>
            <span>Money Back</span>
          </div>
        </div>
      </div>
    </div>
  )
}