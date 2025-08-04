'use client'

import { useState } from 'react'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useWishlist } from '@/app/contexts/WishlistContext'
import { useAuth } from '@/app/contexts/AuthContext'

interface WishlistButtonProps {
  productId: string
  className?: string
  showText?: boolean
}

export default function WishlistButton({ productId, className = '', showText = false }: WishlistButtonProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const inWishlist = isInWishlist(productId)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      setMessage('Please sign in to add items to wishlist')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setIsLoading(true)
    
    try {
      let result
      if (inWishlist) {
        result = await removeFromWishlist(productId)
        if (result.success) {
          setMessage('Removed from wishlist')
        }
      } else {
        result = await addToWishlist(productId)
        if (result.success) {
          setMessage('Added to wishlist')
        }
      }

      if (!result.success && result.error) {
        setMessage(result.error)
      }

      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Something went wrong')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`flex items-center space-x-2 transition-colors disabled:opacity-50 ${className}`}
        title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {inWishlist ? (
          <HeartSolidIcon className="h-5 w-5 text-red-500" />
        ) : (
          <HeartIcon className="h-5 w-5 text-slate-gray hover:text-red-500" />
        )}
        {showText && (
          <span className="text-sm">
            {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
          </span>
        )}
      </button>

      {message && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-matte-black text-soft-white text-xs rounded-lg whitespace-nowrap z-10">
          {message}
        </div>
      )}
    </div>
  )
}