import { Review, ReviewSummary, ReviewFetchOptions } from './types'

/**
 * Calculate review summary statistics
 */
export function calculateReviewSummary(reviews: Review[]): ReviewSummary {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      verifiedReviews: 0
    }
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = Math.round((totalRating / reviews.length) * 10) / 10

  const ratingDistribution = reviews.reduce((dist, review) => {
    dist[review.rating as keyof typeof dist]++
    return dist
  }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })

  const verifiedReviews = reviews.filter(review => review.verified).length

  return {
    averageRating,
    totalReviews: reviews.length,
    ratingDistribution,
    verifiedReviews
  }
}

/**
 * Sort reviews based on criteria
 */
export function sortReviews(reviews: Review[], sortBy: 'date' | 'rating' | 'helpful' = 'date'): Review[] {
  return [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'rating':
        return b.rating - a.rating
      case 'helpful':
        return b.helpful - a.helpful
      default:
        return 0
    }
  })
}

/**
 * Filter reviews based on criteria
 */
export function filterReviews(reviews: Review[], filters: ReviewFetchOptions['filterBy'] = {}): Review[] {
  return reviews.filter(review => {
    if (filters.rating && review.rating !== filters.rating) {
      return false
    }
    
    if (filters.verified !== undefined && review.verified !== filters.verified) {
      return false
    }
    
    if (filters.withPhotos && (!review.photos || review.photos.length === 0)) {
      return false
    }
    
    return true
  })
}

/**
 * Validate review form data
 */
export function validateReviewForm(data: {
  rating: number
  title: string
  comment: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.push('Rating must be between 1 and 5 stars')
  }

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Review title is required')
  } else if (data.title.length > 100) {
    errors.push('Review title must be 100 characters or less')
  }

  if (!data.comment || data.comment.trim().length < 10) {
    errors.push('Review comment must be at least 10 characters')
  } else if (data.comment.length > 1000) {
    errors.push('Review comment must be 1000 characters or less')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format review date for display
 */
export function formatReviewDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `${months} month${months > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
}

/**
 * Generate star rating display
 */
export function generateStarRating(rating: number): { filled: number; half: boolean; empty: number } {
  const filled = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - filled - (half ? 1 : 0)

  return { filled, half, empty }
}

/**
 * Calculate percentage for rating distribution
 */
export function calculateRatingPercentage(count: number, total: number): number {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}