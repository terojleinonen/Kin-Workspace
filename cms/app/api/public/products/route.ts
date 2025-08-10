/**
 * Public Products API
 * Provides product data for e-commerce frontend consumption
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiAuthService } from '@/lib/api-auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const productsQuerySchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
  category: z.string().optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional().default('PUBLISHED'),
  featured: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// GET /api/public/products - Get products for e-commerce
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let apiKeyId = '';

  try {
    // Authenticate API request
    const authResult = await ApiAuthService.verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    apiKeyId = authResult.apiKeyId!;

    // Check permissions
    if (!ApiAuthService.hasPermission(authResult.permissions!, 'products:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimitOk = await ApiAuthService.checkRateLimit(apiKeyId, '/api/public/products');
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || 'PUBLISHED',
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'updatedAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };

    // Validate query parameters
    const validatedQuery = productsQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {
      status: validatedQuery.status
    };

    if (validatedQuery.featured !== undefined) {
      where.featured = validatedQuery.featured;
    }

    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
        { shortDescription: { contains: validatedQuery.search, mode: 'insensitive' } }
      ];
    }

    if (validatedQuery.category) {
      where.categories = {
        some: {
          category: {
            slug: validatedQuery.category
          }
        }
      };
    }

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Get products with relations
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          media: {
            include: {
              media: {
                select: {
                  id: true,
                  filename: true,
                  originalName: true,
                  mimeType: true,
                  width: true,
                  height: true,
                  altText: true,
                  folder: true
                }
              }
            },
            orderBy: [
              { isPrimary: 'desc' },
              { sortOrder: 'asc' }
            ]
          }
        },
        orderBy: {
          [validatedQuery.sortBy]: validatedQuery.sortOrder
        },
        skip,
        take: validatedQuery.limit
      }),
      prisma.product.count({ where })
    ]);

    // Transform products for API response
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      price: parseFloat(product.price.toString()),
      comparePrice: product.comparePrice ? parseFloat(product.comparePrice.toString()) : null,
      sku: product.sku,
      inventoryQuantity: product.inventoryQuantity,
      weight: product.weight ? parseFloat(product.weight.toString()) : null,
      dimensions: product.dimensions,
      status: product.status,
      featured: product.featured,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      categories: product.categories.map(pc => ({
        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug
      })),
      images: product.media.map(pm => ({
        id: pm.media.id,
        filename: pm.media.filename,
        originalName: pm.media.originalName,
        mimeType: pm.media.mimeType,
        width: pm.media.width,
        height: pm.media.height,
        altText: pm.media.altText,
        url: `/uploads/${pm.media.folder}/${pm.media.filename}`,
        isPrimary: pm.isPrimary,
        sortOrder: pm.sortOrder
      }))
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / validatedQuery.limit);
    const hasNextPage = validatedQuery.page < totalPages;
    const hasPreviousPage = validatedQuery.page > 1;

    const response = {
      products: transformedProducts,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    };

    // Log API usage
    const responseTime = Date.now() - startTime;
    await ApiAuthService.logApiUsage({
      apiKeyId,
      endpoint: '/api/public/products',
      method: 'GET',
      statusCode: 200,
      responseTime,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Public products API error:', error);

    // Log error
    if (apiKeyId) {
      const responseTime = Date.now() - startTime;
      await ApiAuthService.logApiUsage({
        apiKeyId,
        endpoint: '/api/public/products',
        method: 'GET',
        statusCode: 500,
        responseTime,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}