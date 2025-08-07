'use client'

import { ReviewSummary as ReviewSummaryType } from '../../lib/types'
import { calculateRatingPercentage } from '../../lib/review-utils'
import StarRating from './StarRating'

interface ReviewSummaryProps {
  summary: ReviewSummaryType
  className?: string
}

export default function ReviewSummary({ summary, className = '' }: ReviewSummaryProps) {
  const { averageRating, totalReviews, ratingDistribution, verifiedReviews } = summary

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Customer Reviews
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Rating */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={averageRating} size="lg" className="justify-center" />
            <p className="text-sm text-gray-600 mt-2">
              Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </p>
            {verifiedReviews > 0 && (
              <p className="text-xs text-green-600 mt-1">
                {verifiedReviews} verified purchase{verifiedReviews !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating as keyof typeof ratingDistribution]
            const percentage = calculateRatingPercentage(count, totalReviews)

            return (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-12">
                  <span className="text-sm text-gray-600">{rating}</span>
                  <StarRating rating={1} maxRating={1} size="sm" />
                </div>

                <div className="flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                  <div
                    className={`bg-yellow-400 h-2 rounded-full transition-all duration-300 w-[${percentage}%]`}
                  />
                </div>

                <div className="w-12 text-right">
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Stats */}
      {totalReviews > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {Math.round((ratingDistribution[5] / totalReviews) * 100)}%
              </div>
              <div className="text-xs text-gray-600">5 Star</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {Math.round((ratingDistribution[4] / totalReviews) * 100)}%
              </div>
              <div className="text-xs text-gray-600">4 Star</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(((verifiedReviews) / totalReviews) * 100)}%
              </div>
              <div className="text-xs text-gray-600">Verified</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {averageRating >= 4 ? 'Excellent' : averageRating >= 3 ? 'Good' : 'Fair'}
              </div>
              <div className="text-xs text-gray-600">Overall</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}