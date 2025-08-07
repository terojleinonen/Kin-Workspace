'use client'

import { Fragment } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon, MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/app/contexts/CartContext'
import { formatPrice } from '@/app/lib/cart-utils'

export default function CartSidebar() {
  const { cart, isOpen, closeCart, updateQuantity, removeFromCart } = useCart()

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeCart}>
        <TransitionChild
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-matte-black bg-opacity-50 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-soft-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-warm-beige">
                      <DialogTitle className="font-satoshi font-semibold text-lg text-matte-black">
                        Shopping Cart ({cart.itemCount})
                      </DialogTitle>
                      <button
                        type="button"
                        className="p-2 text-slate-gray hover:text-matte-black transition-colors"
                        onClick={closeCart}
                        aria-label="Close shopping cart"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      {cart.items.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingBagIcon className="h-8 w-8 text-slate-gray" />
                          </div>
                          <p className="text-slate-gray mb-4">Your cart is empty</p>
                          <Link
                            href="/shop"
                            onClick={closeCart}
                            className="btn-primary inline-block"
                          >
                            Continue Shopping
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {cart.items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm">
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                                <Image
                                  src={item.product.image}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h3 className="font-satoshi font-medium text-matte-black truncate">
                                  {item.product.name}
                                </h3>
                                <p className="text-sm text-slate-gray">
                                  {formatPrice(item.product.price)}
                                </p>
                                {item.variant && (
                                  <p className="text-xs text-slate-gray">
                                    {item.variant.size && `Size: ${item.variant.size}`}
                                    {item.variant.color && ` • Color: ${item.variant.color}`}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-1 text-slate-gray hover:text-matte-black transition-colors"
                                  disabled={item.quantity <= 1}
                                  aria-label={`Decrease quantity of ${item.product.name}`}
                                >
                                  <MinusIcon className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-1 text-slate-gray hover:text-matte-black transition-colors"
                                  aria-label={`Increase quantity of ${item.product.name}`}
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  className="p-1 text-slate-gray hover:text-red-500 transition-colors ml-2"
                                  aria-label={`Remove ${item.product.name} from cart`}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {cart.items.length > 0 && (
                      <div className="border-t border-warm-beige px-6 py-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="font-satoshi font-semibold text-lg">Total:</span>
                          <span className="font-satoshi font-bold text-xl text-matte-black">
                            {formatPrice(cart.total)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <Link
                            href="/cart"
                            onClick={closeCart}
                            className="w-full btn-secondary block text-center"
                          >
                            View Cart
                          </Link>
                          <Link
                            href="/checkout"
                            onClick={closeCart}
                            className="w-full btn-primary block text-center"
                          >
                            Checkout
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// Import ShoppingBagIcon for empty state
import { ShoppingBagIcon } from '@heroicons/react/24/outline'