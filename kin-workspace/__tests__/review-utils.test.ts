import {
  calculateReviewSummary,
  sortReviews,
  filterReviews,
  validateReviewForm,
  formatReviewDate,
  generateStarRating,
  calculateRatingPercentage
} from '../app/lib/review-utils'
import { Review } from '../app/lib/types'

const mockReviews: Review[] = [
  {
    id: '1',
    productId: 'desk-001',
    userId: 'user-123',
    userName: 'John Doe',
    rating: 5,
    title: 'Excellent desk!',
    comment: 'This desk has transformed my workspace.',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    verified: true,
    helpful: 12,
    photos: ['photo1.jpg']
  },
  {
    id: '2',
    productId: 'desk-001',
    userId: 'user-456',
    userName: 'Jane Smith',
    rating: 4,
    title: 'Good value',
    comment: 'Solid desk, easy to assemble.',
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-10T14:30:00Z',
    verified: true,
    helpful: 8
  },
  {
    id: '3',
    productId: 'desk-001',
    userId: 'user-789',
    userName: 'Mike Johnson',
    rating: 3,
    title: 'Average quality',
    comment: 'Desk is okay but expected better.',
    createdAt: '2024-01-05T09:15:00Z',
    updatedAt: '2024-01-05T09:15:00Z',
    verified: false,
    helpful: 3
  }
]

describe('Review Utils', () => {
  describe('calculateReviewSummary', () => {
    it('should calculate correct summary for reviews', () => {
      const summary = calculateReviewSummary(mockReviews)
      
      expect(summary.averageRating).toBe(4)
      expect(summary.totalReviews).toBe(3)
      expect(summary.verifiedReviews).toBe(2)
      expect(summary.ratingDistribution).toEqual({
        5: 1,
        4: 1,
        3: 1,
        2: 0,
        1: 0
      })
    })

    it('should handle empty reviews array', () => {
      const summary = calculateReviewSummary([])
      
      expect(summary.averageRating).toBe(0)
      expect(summary.totalReviews).toBe(0)
      expect(summary.verifiedReviews).toBe(0)
      expect(summary.ratingDistribution).toEqual({
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      })
    })

    it('should round average rating to one decimal place', () => {
      const reviews = [
        { ...mockReviews[0], rating: 4 },
        { ...mockReviews[1], rating: 5 },
        { ...mockReviews[2], rating: 3 }
      ]
      const summary = calculateReviewSummary(reviews)
      
      expect(summary.averageRating).toBe(4)
    })
  })

  describe('sortReviews', () => {
    it('should sort by date (newest first)', () => {
      const sorted = sortReviews(mockReviews, 'date')
      
      expect(sorted[0].id).toBe('1') // Jan 15
      expect(sorted[1].id).toBe('2') // Jan 10
      expect(sorted[2].id).toBe('3') // Jan 5
    })

    it('should sort by rating (highest first)', () => {
      const sorted = sortReviews(mockReviews, 'rating')
      
      expect(sorted[0].rating).toBe(5)
      expect(sorted[1].rating).toBe(4)
      expect(sorted[2].rating).toBe(3)
    })

    it('should sort by helpful votes (highest first)', () => {
      const sorted = sortReviews(mockReviews, 'helpful')
      
      expect(sorted[0].helpful).toBe(12)
      expect(sorted[1].helpful).toBe(8)
      expect(sorted[2].helpful).toBe(3)
    })

    it('should not mutate original array', () => {
      const original = [...mockReviews]
      sortReviews(mockReviews, 'rating')
      
      expect(mockReviews).toEqual(original)
    })
  })

  describe('filterReviews', () => {
    it('should filter by rating', () => {
      const filtered = filterReviews(mockReviews, { rating: 5 })
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].rating).toBe(5)
    })

    it('should filter by verified status', () => {
      const verified = filterReviews(mockReviews, { verified: true })
      const unverified = filterReviews(mockReviews, { verified: false })
      
      expect(verified).toHaveLength(2)
      expect(unverified).toHaveLength(1)
    })

    it('should filter by photos', () => {
      const withPhotos = filterReviews(mockReviews, { withPhotos: true })
      
      expect(withPhotos).toHaveLength(1)
      expect(withPhotos[0].photos).toBeDefined()
      expect(withPhotos[0].photos!.length).toBeGreaterThan(0)
    })

    it('should apply multiple filters', () => {
      const filtered = filterReviews(mockReviews, { 
        verified: true, 
        rating: 5 
      })
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].verified).toBe(true)
      expect(filtered[0].rating).toBe(5)
    })
  })

  describe('validateReviewForm', () => {
    it('should validate correct form data', () => {
      const result = validateReviewForm({
        rating: 5,
        title: 'Great product',
        comment: 'This is a detailed review of the product.'
      })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid rating', () => {
      const result = validateReviewForm({
        rating: 0,
        title: 'Title',
        comment: 'Valid comment here'
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Rating must be between 1 and 5 stars')
    })

    it('should reject empty title', () => {
      const result = validateReviewForm({
        rating: 5,
        title: '',
        comment: 'Valid comment here'
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Review title is required')
    })

    it('should reject short comment', () => {
      const result = validateReviewForm({
        rating: 5,
        title: 'Title',
        comment: 'Short'
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Review comment must be at least 10 characters')
    })

    it('should reject long title', () => {
      const longTitle = 'a'.repeat(101)
      const result = validateReviewForm({
        rating: 5,
        title: longTitle,
        comment: 'Valid comment here'
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Review title must be 100 characters or less')
    })

    it('should reject long comment', () => {
      const longComment = 'a'.repeat(1001)
      const result = validateReviewForm({
        rating: 5,
        title: 'Title',
        comment: longComment
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Review comment must be 1000 characters or less')
    })
  })

  describe('formatReviewDate', () => {
    beforeEach(() => {
      // Mock current date to Jan 20, 2024
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-20T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should format today correctly', () => {
      const result = formatReviewDate('2024-01-20T10:00:00Z')
      expect(result).toBe('Today')
    })

    it('should format yesterday correctly', () => {
      const result = formatReviewDate('2024-01-19T10:00:00Z')
      expect(result).toBe('Yesterday')
    })

    it('should format days ago correctly', () => {
      const result = formatReviewDate('2024-01-15T10:00:00Z')
      expect(result).toBe('5 days ago')
    })

    it('should format weeks ago correctly', () => {
      const result = formatReviewDate('2024-01-06T10:00:00Z')
      expect(result).toBe('2 weeks ago')
    })

    it('should format months ago correctly', () => {
      const result = formatReviewDate('2023-12-20T10:00:00Z')
      expect(result).toBe('1 month ago')
    })

    it('should format old dates with full date', () => {
      const result = formatReviewDate('2023-01-20T10:00:00Z')
      expect(result).toBe('January 20, 2023')
    })
  })

  describe('generateStarRating', () => {
    it('should generate correct star display for whole numbers', () => {
      const result = generateStarRating(4)
      
      expect(result.filled).toBe(4)
      expect(result.half).toBe(false)
      expect(result.empty).toBe(1)
    })

    it('should generate correct star display for half ratings', () => {
      const result = generateStarRating(3.5)
      
      expect(result.filled).toBe(3)
      expect(result.half).toBe(true)
      expect(result.empty).toBe(1)
    })

    it('should handle edge cases', () => {
      const result1 = generateStarRating(0)
      expect(result1).toEqual({ filled: 0, half: false, empty: 5 })
      
      const result2 = generateStarRating(5)
      expect(result2).toEqual({ filled: 5, half: false, empty: 0 })
    })
  })

  describe('calculateRatingPercentage', () => {
    it('should calculate correct percentage', () => {
      expect(calculateRatingPercentage(25, 100)).toBe(25)
      expect(calculateRatingPercentage(1, 3)).toBe(33)
      expect(calculateRatingPercentage(2, 3)).toBe(67)
    })

    it('should handle zero total', () => {
      expect(calculateRatingPercentage(5, 0)).toBe(0)
    })

    it('should round to nearest integer', () => {
      expect(calculateRatingPercentage(1, 3)).toBe(33) // 33.33... rounded
    })
  })
})