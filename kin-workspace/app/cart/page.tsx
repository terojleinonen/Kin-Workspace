'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useCart } from '@/app/contexts/CartContext'
import { formatPrice } from '@/app/lib/cart-utils'

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart()

  if (cart.items.length === 0) {
    return (
      <div className="pt-24 pb-section">
        <div className="max-w-site mx-auto px-6 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🛒</span>
            </div>
            <h1 className="font-satoshi font-bold text-3xl text-matte-black mb-4">
              Your cart is empty
            </h1>
            <p className="text-slate-gray mb-8">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link href="/shop" className="btn-primary inline-block">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = cart.total
  const shipping = subtotal > 100 ? 0 : 15
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  return (
    <div className="pt-24 pb-section">
      <div className="max-w-site mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-satoshi font-bold text-3xl md:text-4xl text-matte-black">
            Shopping Cart ({cart.itemCount} items)
          </h1>
          <button
            type="button"
            onClick={clearCart}
            className="text-slate-gray hover:text-red-500 transition-colors text-sm"
            aria-label="Clear all items from cart"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="font-satoshi font-semibold text-lg text-matte-black hover:text-slate-gray transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-slate-gray text-sm mb-2">
                      {item.product.category}
                    </p>
                    <p className="font-inter text-matte-black">
                      {formatPrice(item.product.price)}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-slate-gray mt-1">
                        {item.variant.size && `Size: ${item.variant.size}`}
                        {item.variant.color && ` • Color: ${item.variant.color}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 text-slate-gray hover:text-matte-black transition-colors border border-warm-beige rounded-lg"
                      disabled={item.quantity <= 1}
                      aria-label={`Decrease quantity of ${item.product.name}`}
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-slate-gray hover:text-matte-black transition-colors border border-warm-beige rounded-lg"
                      aria-label={`Increase quantity of ${item.product.name}`}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-satoshi font-semibold text-lg text-matte-black">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-gray hover:text-red-500 transition-colors mt-2"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-24">
              <h2 className="font-satoshi font-semibold text-xl text-matte-black mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-gray">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-gray">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'Free' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-gray">Tax</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="border-t border-warm-beige pt-4">
                  <div className="flex justify-between">
                    <span className="font-satoshi font-semibold text-lg">Total</span>
                    <span className="font-satoshi font-bold text-xl text-matte-black">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              {subtotal < 100 && (
                <div className="bg-warm-beige/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-gray">
                    Add {formatPrice(100 - subtotal)} more for free shipping!
                  </p>
                </div>
              )}

              <Link
                href="/checkout"
                className="w-full btn-primary text-lg py-4 mb-4 block text-center"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/shop"
                className="w-full btn-secondary text-center block py-3"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}