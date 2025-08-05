import { NextRequest, NextResponse } from 'next/server'
import { calculateReviewSummary } from '../../../lib/review-utils'

// This would be imported from a shared database module in a real app
const mockReviews = [
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
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId
    const { searchParams } = new URL(request.url)
    const includeSummary = searchParams.get('includeSummary') === 'true'

    // Filter reviews for this product
    const productReviews = mockReviews.filter(review => review.productId === productId)

    const response: {
      success: boolean
      data: typeof productReviews
      summary?: ReturnType<typeof calculateReviewSummary>
    } = {
      success: true,
      data: productReviews
    }

    // Include summary if requested
    if (includeSummary) {
      response.summary = calculateReviewSummary(productReviews)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching product reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product reviews' },
      { status: 500 }
    )
  }
}