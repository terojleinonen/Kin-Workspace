'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface WishlistItem {
  id: string
  userId: string
  productId: string
  createdAt: string
}

interface WishlistContextType {
  wishlist: WishlistItem[]
  isLoading: boolean
  addToWishlist: (productId: string) => Promise<{ success: boolean; error?: string }>
  removeFromWishlist: (productId: string) => Promise<{ success: boolean; error?: string }>
  isInWishlist: (productId: string) => boolean
  wishlistCount: number
  refreshWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  const refreshWishlist = async () => {
    if (!isAuthenticated) {
      setWishlist([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/wishlist', {
        headers: getAuthHeaders()
      })

      const data = await response.json()
      if (data.success) {
        setWishlist(data.wishlist)
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addToWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Please sign in to add items to wishlist' }
    }

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId })
      })

      const data = await response.json()
      
      if (data.success) {
        setWishlist(prev => [data.wishlistItem, ...prev])
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Add to wishlist error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const removeFromWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Please sign in' }
    }

    try {
      const response = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId })
      })

      const data = await response.json()
      
      if (data.success) {
        setWishlist(prev => prev.filter(item => item.productId !== productId))
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Remove from wishlist error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.productId === productId)
  }

  // Load wishlist when user changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist()
    } else {
      setWishlist([])
    }
  }, [isAuthenticated, user])

  const value: WishlistContextType = {
    wishlist,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    wishlistCount: wishlist.length,
    refreshWishlist
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}