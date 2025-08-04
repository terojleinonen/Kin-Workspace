'use client'

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { Cart, CartItem, Product, CartContextType } from '@/app/lib/types'
import { 
  calculateCartTotal, 
  calculateItemCount, 
  generateCartItemId,
  saveCartToStorage,
  loadCartFromStorage 
} from '@/app/lib/cart-utils'

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number; variant?: CartItem['variant'] } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: Cart }

const cartReducer = (state: Cart, action: CartAction): Cart => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity, variant } = action.payload
      const itemId = generateCartItemId(product.id, variant)
      
      const existingItemIndex = state.items.findIndex(item => 
        generateCartItemId(item.product.id, item.variant) === itemId
      )

      let newItems: CartItem[]
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        // Add new item
        newItems = [...state.items, {
          id: itemId,
          product,
          quantity,
          variant
        }]
      }

      return {
        items: newItems,
        total: calculateCartTotal(newItems),
        itemCount: calculateItemCount(newItems),
      }
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload.itemId)
      return {
        items: newItems,
        total: calculateCartTotal(newItems),
        itemCount: calculateItemCount(newItems),
      }
    }

    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { itemId } })
      }

      const newItems = state.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )

      return {
        items: newItems,
        total: calculateCartTotal(newItems),
        itemCount: calculateItemCount(newItems),
      }
    }

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 }

    case 'LOAD_CART':
      return action.payload

    default:
      return state
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0, itemCount: 0 })
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = loadCartFromStorage()
    dispatch({ type: 'LOAD_CART', payload: savedCart })
    setIsLoaded(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveCartToStorage(cart)
    }
  }, [cart, isLoaded])

  const addToCart = (product: Product, quantity = 1, variant?: CartItem['variant']) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, variant } })
  }

  const removeFromCart = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId } })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isOpen,
    openCart,
    closeCart,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}