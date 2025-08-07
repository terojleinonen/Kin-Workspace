'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { Review, ReviewFetchOptions } from '../../lib/types'
import ReviewCard from './ReviewCard'
import StarRating from './StarRating'

interface ReviewListProps {
  reviews: Review[]
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  onHelpfulVote?: (reviewId: string) => Promise<{ success: boolean; error?: string }>
  onFiltersChange?: (options: ReviewFetchOptions) => void
}

export default function ReviewList({
  reviews,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  onHelpfulVote,
  onFiltersChange
}: ReviewListProps) {
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'helpful'>('date')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null)
  const [filterWithPhotos, setFilterWithPhotos] = useState<boolean>(false)
  const [showFilters, setShowFilters] = useState(false)

  // Update filters when they change
  useEffect(() => {
    if (onFiltersChange) {
      const options: ReviewFetchOptions = {
        sortBy,
        filterBy: {
          ...(filterRating && { rating: filterRating }),
          ...(filterVerified !== null && { verified: filterVerified }),
          ...(filterWithPhotos && { withPhotos: filterWithPhotos })
        }
      }
      onFiltersChange(options)
    }
  }, [sortBy, filterRating, filterVerified, filterWithPhotos, onFiltersChange])

  const clearFilters = () => {
    setFilterRating(null)
    setFilterVerified(null)
    setFilterWithPhotos(false)
  }

  const hasActiveFilters = filterRating !== null || filterVerified !== null || filterWithPhotos

  return (
    <div className="space-y-6">
      {/* Header with Sort and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Reviews ({reviews.length})
        </h3>

        <div className="flex items-center space-x-4">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'rating' | 'helpful')}
              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              aria-label="Sort reviews by"
            >
              <option value="date">Most Recent</option>
              <option value="rating">Highest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center space-x-2 px-3 py-2 text-sm border rounded-md transition-colors
              ${hasActiveFilters
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="bg-slate-600 text-white text-xs rounded-full px-2 py-0.5">
                {[filterRating, filterVerified, filterWithPhotos].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Filters</h4>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-slate-600 hover:text-slate-800"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      value={rating}
                      checked={filterRating === rating}
                      onChange={(e) => setFilterRating(parseInt(e.target.value))}
                      className="mr-2"
                      aria-label={`Filter by ${rating} star${rating !== 1 ? 's' : ''}`}
                    />
                    <StarRating rating={rating} size="sm" />
                  </label>
                ))}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    value=""
                    checked={filterRating === null}
                    onChange={() => setFilterRating(null)}
                    className="mr-2"
                    aria-label="Show all ratings"
                  />
                  <span className="text-sm text-gray-600">All ratings</span>
                </label>
              </div>
            </div>

            {/* Verified Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Status
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="verified"
                    value="true"
                    checked={filterVerified === true}
                    onChange={() => setFilterVerified(true)}
                    className="mr-2"
                    aria-label="Show only verified purchases"
                  />
                  <span className="text-sm text-gray-600">Verified purchases</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="verified"
                    value="false"
                    checked={filterVerified === false}
                    onChange={() => setFilterVerified(false)}
                    className="mr-2"
                    aria-label="Show only unverified reviews"
                  />
                  <span className="text-sm text-gray-600">Unverified</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="verified"
                    value=""
                    checked={filterVerified === null}
                    onChange={() => setFilterVerified(null)}
                    className="mr-2"
                    aria-label="Show all reviews regardless of verification"
                  />
                  <span className="text-sm text-gray-600">All reviews</span>
                </label>
              </div>
            </div>

            {/* Photos Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filterWithPhotos}
                  onChange={(e) => setFilterWithPhotos(e.target.checked)}
                  className="mr-2"
                  aria-label="Show only reviews with photos"
                />
                <span className="text-sm text-gray-600">Reviews with photos</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="space-y-4">
        {isLoading && reviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No reviews found.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-slate-600 hover:text-slate-800 text-sm mt-2"
              >
                Clear filters to see all reviews
              </button>
            )}
          </div>
        ) : (
          <>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onHelpfulVote={onHelpfulVote}
              />
            ))}

            {/* Load More Button */}
            {hasMore && onLoadMore && (
              <div className="text-center pt-4">
                <button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Load More Reviews'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}