'use client'

import { ShoppingBagIcon } from '@heroicons/react/24/outline'
import { useCart } from '@/app/contexts/CartContext'

export default function CartIcon() {
  const { cart, openCart } = useCart()

  return (
    <button
      onClick={openCart}
      className="relative p-2 text-slate-gray hover:text-matte-black transition-colors"
      aria-label={`Shopping cart with ${cart.itemCount} items`}
    >
      <ShoppingBagIcon className="h-6 w-6" />
      {cart.itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-matte-black text-soft-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {cart.itemCount > 99 ? '99+' : cart.itemCount}
        </span>
      )}
    </button>
  )
}