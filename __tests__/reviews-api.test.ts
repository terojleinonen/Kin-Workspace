import { NextRequest } from 'next/server'
import { GET as getReviews, POST as createReview } from '../app/api/reviews/route'
import { GET as getProductReviews } from '../app/api/reviews/[productId]/route'
import { POST as voteHelpful } from '../app/api/reviews/helpful/route'

// Mock NextRequest
function createMockRequest(url: string, options: RequestInit = {}) {
  return new NextRequest(url, options)
}

describe('Reviews API', () => {
  describe('GET /api/reviews', () => {
    it('should fetch all reviews', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews')
      const response = await getReviews(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.pagination).toBeDefined()
    })

    it('should filter reviews by productId', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews?productId=desk-001')
      const response = await getReviews(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.every((review: any) => review.productId === 'desk-001')).toBe(true)
    })

    it('should filter reviews by rating', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews?rating=5')
      const response = await getReviews(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.every((review: any) => review.rating === 5)).toBe(true)
    })

    it('should filter verified reviews', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews?verified=true')
      const response = await getReviews(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.every((review: any) => review.verified === true)).toBe(true)
    })

    it('should filter reviews with photos', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews?withPhotos=true')
      const response = await getReviews(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.every((review: any) => 
        review.photos && review.photos.length > 0
      )).toBe(true)
    })

    it('should sort reviews by date', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews?sortBy=date')
      const response = await getReviews(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Check if sorted by date (newest first)
      for (let i = 0; i < data.data.length - 1; i++) {
        const current = new Date(data.data[i].createdAt)
        const next = new Date(data.data[i + 1].createdAt)
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime())
      }
    })

    it('should handle pagination', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews?page=1&limit=2')
      const response = await getReviews(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.length).toBeLessThanOrEqual(2)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(2)
    })
  })

  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      const reviewData = {
        productId: 'desk-001',
        rating: 5,
        title: 'Great product',
        comment: 'This is an excellent desk that I would recommend to anyone.',
        photos: []
      }

      const request = createMockRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      })

      const response = await createReview(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.productId).toBe(reviewData.productId)
      expect(data.data.rating).toBe(reviewData.rating)
      expect(data.data.title).toBe(reviewData.title)
      expect(data.data.comment).toBe(reviewData.comment)
    })

    it('should reject review with missing required fields', async () => {
      const reviewData = {
        productId: 'desk-001',
        rating: 5
        // Missing title and comment
      }

      const request = createMockRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      })

      const response = await createReview(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing required fields')
    })

    it('should reject review with invalid rating', async () => {
      const reviewData = {
        productId: 'desk-001',
        rating: 6, // Invalid rating
        title: 'Title',
        comment: 'This is a valid comment with enough characters.'
      }

      const request = createMockRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      })

      const response = await createReview(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Rating must be between 1 and 5')
    })

    it('should reject review with short comment', async () => {
      const reviewData = {
        productId: 'desk-001',
        rating: 5,
        title: 'Title',
        comment: 'Short' // Too short
      }

      const request = createMockRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      })

      const response = await createReview(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Comment must be between 10 and 1000 characters')
    })
  })

  describe('GET /api/reviews/[productId]', () => {
    it('should fetch reviews for specific product', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews/desk-001')
      const response = await getProductReviews(request, { params: { productId: 'desk-001' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.every((review: any) => review.productId === 'desk-001')).toBe(true)
    })

    it('should include summary when requested', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews/desk-001?includeSummary=true')
      const response = await getProductReviews(request, { params: { productId: 'desk-001' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.summary).toBeDefined()
      expect(data.summary.averageRating).toBeDefined()
      expect(data.summary.totalReviews).toBeDefined()
      expect(data.summary.ratingDistribution).toBeDefined()
    })

    it('should return empty array for product with no reviews', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews/nonexistent-product')
      const response = await getProductReviews(request, { params: { productId: 'nonexistent-product' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })
  })

  describe('POST /api/reviews/helpful', () => {
    it('should increment helpful count', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: '1' })
      })

      const response = await voteHelpful(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(typeof data.data.helpful).toBe('number')
    })

    it('should return 404 for non-existent review', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: '999' })
      })

      const response = await voteHelpful(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Review not found')
    })

    it('should return 400 for missing reviewId', async () => {
      const request = createMockRequest('http://localhost:3000/api/reviews/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const response = await voteHelpful(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Review ID is required')
    })
  })
})