'use client'

import { useState } from 'react'
import { HandThumbUpIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import { HandThumbUpIcon as HandThumbUpSolidIcon } from '@heroicons/react/24/solid'
import { Review } from '../../lib/types'
import { formatReviewDate } from '../../lib/review-utils'
import StarRating from './StarRating'

interface ReviewCardProps {
  review: Review
  onHelpfulVote?: (reviewId: string) => Promise<{ success: boolean; error?: string }>
}

export default function ReviewCard({ 
  review, 
  onHelpfulVote
}: ReviewCardProps) {
  const [hasVoted, setHasVoted] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(review.helpful)
  const [isVotingState, setIsVotingState] = useState(false)

  const handleHelpfulVote = async () => {
    if (!onHelpfulVote || hasVoted || isVotingState) return

    setIsVotingState(true)
    try {
      const result = await onHelpfulVote(review.id)
      if (result.success) {
        setHasVoted(true)
        setHelpfulCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error voting helpful:', error)
    } finally {
      setIsVotingState(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-slate-600">
                {review.userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900">
                {review.userName}
              </h4>
              {review.verified && (
                <CheckBadgeIcon className="h-4 w-4 text-green-500" title="Verified Purchase" />
              )}
            </div>
            <p className="text-xs text-gray-500">
              {formatReviewDate(review.createdAt)}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Review Content */}
      <div className="space-y-2">
        <h5 className="font-medium text-gray-900">
          {review.title}
        </h5>
        <p className="text-gray-700 text-sm leading-relaxed">
          {review.comment}
        </p>
      </div>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex space-x-2 overflow-x-auto">
          {review.photos.map((photo, index) => (
            <div key={index} className="flex-shrink-0">
              <img
                src={photo}
                alt={`Review photo ${index + 1}`}
                className="h-20 w-20 object-cover rounded-md border border-gray-200"
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <button
          onClick={handleHelpfulVote}
          disabled={hasVoted || isVotingState || !onHelpfulVote}
          className={`
            flex items-center space-x-2 text-sm transition-colors
            ${hasVoted 
              ? 'text-slate-600 cursor-default' 
              : 'text-gray-500 hover:text-slate-600 cursor-pointer'
            }
            ${!onHelpfulVote ? 'cursor-not-allowed opacity-50' : ''}
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        >
          {hasVoted ? (
            <HandThumbUpSolidIcon className="h-4 w-4" />
          ) : (
            <HandThumbUpIcon className="h-4 w-4" />
          )}
          <span>
            {isVotingState ? 'Voting...' : 'Helpful'}
          </span>
          <span className="text-gray-400">
            ({helpfulCount})
          </span>
        </button>

        {review.verified && (
          <span className="text-xs text-green-600 font-medium">
            Verified Purchase
          </span>
        )}
      </div>
    </div>
  )
}