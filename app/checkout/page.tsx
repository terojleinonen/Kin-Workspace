'use client'

import { useCart } from '@/app/contexts/CartContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import CheckoutForm from '@/app/components/checkout/CheckoutForm'

export default function CheckoutPage() {
  const { cart } = useCart()
  const router = useRouter()

  useEffect(() => {
    // Redirect to cart if empty
    if (cart.items.length === 0) {
      router.push('/cart')
    }
  }, [cart.items.length, router])

  if (cart.items.length === 0) {
    return (
      <div className="pt-24 pb-section flex justify-center">
        <div className="text-center">
          <h1 className="font-satoshi font-bold text-2xl text-matte-black mb-4">
            Redirecting to cart...
          </h1>
          <p className="text-slate-gray">Your cart is empty.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-section">
      <div className="text-center mb-8">
        <h1 className="font-satoshi font-bold text-3xl md:text-4xl text-matte-black mb-4">
          Checkout
        </h1>
        <p className="text-slate-gray max-w-2xl mx-auto">
          Complete your order with our secure checkout process. Your information is protected and encrypted.
        </p>
      </div>
      
      <CheckoutForm />
    </div>
  )
}