'use client'

import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  className = ''
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  const renderStar = (index: number) => {
    const starRating = index + 1
    const isFilled = starRating <= rating
    const isHalfFilled = starRating - 0.5 === rating

    return (
      <button
        key={index}
        type="button"
        onClick={() => handleStarClick(starRating)}
        disabled={!interactive}
        className={`
          ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          ${interactive ? 'focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 rounded' : ''}
          relative
        `}
        aria-label={`${starRating} star${starRating !== 1 ? 's' : ''}`}
      >
        {isFilled || isHalfFilled ? (
          <StarIcon 
            className={`${sizeClasses[size]} text-yellow-400 ${
              isHalfFilled ? 'opacity-50' : ''
            }`} 
          />
        ) : (
          <StarOutlineIcon 
            className={`${sizeClasses[size]} text-gray-300 ${
              interactive ? 'hover:text-yellow-400' : ''
            }`} 
          />
        )}
      </button>
    )
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      {!interactive && (
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}