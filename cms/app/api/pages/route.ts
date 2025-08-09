/**
 * Pages API Routes
 * Handles CRUD operations for content pages
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schemas
const createPageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(255, 'Slug too long'),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  template: z.string().default('default'),
  seoTitle: z.string().max(255, 'SEO title too long').optional(),
  seoDescription: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
})

/**
 * GET /api/pages
 * Retrieve pages with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch pages with relations
    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.page.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      pages,
      total,
      page,
      limit,
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pages
 * Create a new page
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPageSchema.parse(body)

    // Check if slug already exists
    const existingPage = await prisma.page.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existingPage) {
      return NextResponse.json(
        { error: 'Page with this slug already exists' },
        { status: 400 }
      )
    }

    const page = await prisma.page.create({
      data: {
        ...validatedData,
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : null,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ page }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating page:', error)
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    )
  }
}