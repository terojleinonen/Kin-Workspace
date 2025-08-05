'use client'

import { useState, useEffect } from 'react'
import { Review, ReviewSummary, ReviewFormData, ReviewFetchOptions } from '../../lib/types'
import ReviewSummaryComponent from './ReviewSummary'
import ReviewList from './ReviewList'
import ReviewForm from './ReviewForm'

interface ReviewsSectionProps {
  productId: string
  className?: string
}

export default function ReviewsSection({ productId, className = '' }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [currentFilters, setCurrentFilters] = useState<ReviewFetchOptions>({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Fetch reviews
  const fetchReviews = async (options: ReviewFetchOptions = {}, append = false) => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams({
        productId,
        page: (options.page || 1).toString(),
        limit: (options.limit || 10).toString(),
        ...(options.sortBy && { sortBy: options.sortBy }),
        ...(options.filterBy?.rating && { rating: options.filterBy.rating.toString() }),
        ...(options.filterBy?.verified !== undefined && { verified: options.filterBy.verified.toString() }),
        ...(options.filterBy?.withPhotos && { withPhotos: 'true' })
      })

      const response = await fetch(`/api/reviews?${params}`)
      const data = await response.json()

      if (data.success) {
        if (append) {
          setReviews(prev => [...prev, ...data.data])
        } else {
          setReviews(data.data)
        }
        setPagination(data.pagination)
        
        // Calculate summary from all reviews (not just current page)
        const summaryResponse = await fetch(`/api/reviews/${productId}?includeSummary=true`)
        const summaryData = await summaryResponse.json()
        if (summaryData.success && summaryData.summary) {
          setReviewSummary(summaryData.summary)
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchReviews()
  }, [productId])

  // Handle filter changes
  const handleFiltersChange = (options: ReviewFetchOptions) => {
    setCurrentFilters(options)
    fetchReviews({ ...options, page: 1 })
  }

  // Handle load more
  const handleLoadMore = () => {
    const nextPage = pagination.page + 1
    fetchReviews({ ...currentFilters, page: nextPage }, true)
  }

  // Handle review submission
  const handleSubmitReview = async (reviewData: ReviewFormData): Promise<{ success: boolean; error?: string }> => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh reviews to show the new one
        await fetchReviews(currentFilters)
        setShowReviewForm(false)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to submit review' }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle helpful vote
  const handleHelpfulVote = async (reviewId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/reviews/helpful', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId }),
      })

      const data = await response.json()

      if (data.success) {
        // Update the review in the local state
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, helpful: data.data.helpful }
            : review
        ))
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to vote' }
    }
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Review Summary */}
      {reviewSummary && (
        <ReviewSummaryComponent summary={reviewSummary} />
      )}

      {/* Write Review Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 border border-transparent rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          {showReviewForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          onSubmit={handleSubmitReview}
          onCancel={() => setShowReviewForm(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Review List */}
      <ReviewList
        reviews={reviews}
        isLoading={isLoading}
        onLoadMore={pagination.page < pagination.totalPages ? handleLoadMore : undefined}
        hasMore={pagination.page < pagination.totalPages}
        onHelpfulVote={handleHelpfulVote}
        onFiltersChange={handleFiltersChange}
      />
    </div>
  )
}