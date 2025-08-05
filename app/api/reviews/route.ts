import { NextRequest, NextResponse } from 'next/server'
import { Review, ReviewFormData } from '@/lib/types'

// Mock database - in production, this would be replaced with actual database calls
const mockReviews: Review[] = [
  {
    id: '1',
    productId: 'desk-001',
    userId: 'user-123',
    userName: 'John Doe',
    rating: 5,
    title: 'Excellent desk!',
    comment: 'This desk has transformed my workspace. The quality is outstanding and assembly was straightforward.',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    verified: true,
    helpful: 12,
    photos: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400']
  },
  {
    id: '2',
    productId: 'desk-001',
    userId: 'user-456',
    userName: 'Jane Smith',
    rating: 4,
    title: 'Good value for money',
    comment: 'Solid desk, easy to assemble. Had minor scratches on delivery but customer service was helpful.',
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
    comment: 'Desk is okay but expected better build quality for the price point.',
    createdAt: '2024-01-05T09:15:00Z',
    updatedAt: '2024-01-05T09:15:00Z',
    verified: false,
    helpful: 3
  },
  {
    id: '4',
    productId: 'chair-001',
    userId: 'user-101',
    userName: 'Sarah Wilson',
    rating: 5,
    title: 'Perfect ergonomic chair',
    comment: 'This chair has completely eliminated my back pain. Worth every penny!',
    createdAt: '2024-01-12T16:45:00Z',
    updatedAt: '2024-01-12T16:45:00Z',
    verified: true,
    helpful: 15,
    photos: ['https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400']
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') as 'date' | 'rating' | 'helpful' || 'date'
    const rating = searchParams.get('rating')
    const verified = searchParams.get('verified')
    const withPhotos = searchParams.get('withPhotos')

    let filteredReviews = mockReviews

    // Filter by product ID if provided
    if (productId) {
      filteredReviews = filteredReviews.filter(review => review.productId === productId)
    }

    // Apply filters
    if (rating) {
      filteredReviews = filteredReviews.filter(review => review.rating === parseInt(rating))
    }

    if (verified !== null) {
      filteredReviews = filteredReviews.filter(review => 
        review.verified === (verified === 'true')
      )
    }

    if (withPhotos === 'true') {
      filteredReviews = filteredReviews.filter(review => 
        review.photos && review.photos.length > 0
      )
    }

    // Sort reviews
    filteredReviews.sort((a, b) => {
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

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedReviews = filteredReviews.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: paginatedReviews,
      pagination: {
        page,
        limit,
        total: filteredReviews.length,
        totalPages: Math.ceil(filteredReviews.length / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ReviewFormData = await request.json()

    // Validate required fields
    if (!body.productId || !body.rating || !body.title || !body.comment) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate comment length
    if (body.comment.length < 10 || body.comment.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Comment must be between 10 and 1000 characters' },
        { status: 400 }
      )
    }

    // In a real app, you would get the user ID from the authentication token
    const userId = 'user-' + Math.random().toString(36).substr(2, 9)
    const userName = 'Anonymous User' // Would come from user profile

    const newReview: Review = {
      id: Date.now().toString(),
      productId: body.productId,
      userId,
      userName,
      rating: body.rating,
      title: body.title,
      comment: body.comment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verified: false, // Would be set based on purchase history
      helpful: 0,
      photos: body.photos || []
    }

    mockReviews.push(newReview)

    return NextResponse.json({
      success: true,
      data: newReview,
      message: 'Review submitted successfully'
    })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    )
  }
}