/**
 * Public Categories API
 * Provides category data for e-commerce frontend navigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiAuthService } from '@/lib/api-auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema
const categoriesQuerySchema = z.object({
  includeProducts: z.boolean().optional().default(false),
  includeEmpty: z.boolean().optional().default(true),
  parentId: z.string().optional()
});

// GET /api/public/categories - Get categories for e-commerce
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
    if (!ApiAuthService.hasPermission(authResult.permissions!, 'categories:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimitOk = await ApiAuthService.checkRateLimit(apiKeyId, '/api/public/categories');
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      includeProducts: searchParams.get('includeProducts') === 'true',
      includeEmpty: searchParams.get('includeEmpty') !== 'false',
      parentId: searchParams.get('parentId') || undefined
    };

    const validatedQuery = categoriesQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {
      isActive: true
    };

    if (validatedQuery.parentId) {
      where.parentId = validatedQuery.parentId;
    } else {
      where.parentId = null; // Root categories only
    }

    // Get categories
    const categories = await prisma.category.findMany({
      where,
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: {
                products: {
                  where: {
                    product: { status: 'PUBLISHED' }
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            products: {
              where: {
                product: { status: 'PUBLISHED' }
              }
            }
          }
        },
        ...(validatedQuery.includeProducts && {
          products: {
            where: {
              product: { status: 'PUBLISHED' }
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  comparePrice: true,
                  featured: true,
                  media: {
                    where: { isPrimary: true },
                    include: {
                      media: {
                        select: {
                          id: true,
                          filename: true,
                          altText: true,
                          folder: true
                        }
                      }
                    },
                    take: 1
                  }
                }
              }
            },
            take: 10 // Limit products per category
          }
        })
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Filter out empty categories if requested
    const filteredCategories = validatedQuery.includeEmpty 
      ? categories 
      : categories.filter(category => category._count.products > 0);

    // Transform categories for API response
    const transformedCategories = filteredCategories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      productCount: category._count.products,
      children: category.children.map(child => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        sortOrder: child.sortOrder,
        productCount: child._count.products
      })),
      ...(validatedQuery.includeProducts && {
        products: category.products.map(cp => ({
          id: cp.product.id,
          name: cp.product.name,
          slug: cp.product.slug,
          price: parseFloat(cp.product.price.toString()),
          comparePrice: cp.product.comparePrice ? parseFloat(cp.product.comparePrice.toString()) : null,
          featured: cp.product.featured,
          primaryImage: cp.product.media[0] ? {
            id: cp.product.media[0].media.id,
            filename: cp.product.media[0].media.filename,
            altText: cp.product.media[0].media.altText,
            url: `/uploads/${cp.product.media[0].media.folder}/${cp.product.media[0].media.filename}`
          } : null
        }))
      })
    }));

    const response = {
      categories: transformedCategories,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        totalCategories: transformedCategories.length
      }
    };

    // Log successful API usage
    const responseTime = Date.now() - startTime;
    await ApiAuthService.logApiUsage({
      apiKeyId,
      endpoint: '/api/public/categories',
      method: 'GET',
      statusCode: 200,
      responseTime,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Public categories API error:', error);

    // Log error
    if (apiKeyId) {
      const responseTime = Date.now() - startTime;
      await ApiAuthService.logApiUsage({
        apiKeyId,
        endpoint: '/api/public/categories',
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