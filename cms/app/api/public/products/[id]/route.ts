/**
 * Public Single Product API
 * Provides individual product data for e-commerce frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiAuthService } from '@/lib/api-auth';

const prisma = new PrismaClient();

// GET /api/public/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const rateLimitOk = await ApiAuthService.checkRateLimit(apiKeyId, '/api/public/products/[id]');
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const productId = params.id;

    // Get product by ID or slug
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { slug: productId }
        ],
        status: 'PUBLISHED' // Only return published products
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true
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
        },
        creator: {
          select: {
            name: true
          }
        }
      }
    });

    if (!product) {
      // Log 404
      const responseTime = Date.now() - startTime;
      await ApiAuthService.logApiUsage({
        apiKeyId,
        endpoint: '/api/public/products/[id]',
        method: 'GET',
        statusCode: 404,
        responseTime,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      });

      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Transform product for API response
    const transformedProduct = {
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
        slug: pc.category.slug,
        description: pc.category.description
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
      })),
      creator: product.creator.name
    };

    // Get related products (same categories)
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        status: 'PUBLISHED',
        categories: {
          some: {
            categoryId: {
              in: product.categories.map(pc => pc.categoryId)
            }
          }
        }
      },
      include: {
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
      },
      take: 4,
      orderBy: { updatedAt: 'desc' }
    });

    const transformedRelatedProducts = relatedProducts.map(rp => ({
      id: rp.id,
      name: rp.name,
      slug: rp.slug,
      price: parseFloat(rp.price.toString()),
      comparePrice: rp.comparePrice ? parseFloat(rp.comparePrice.toString()) : null,
      featured: rp.featured,
      primaryImage: rp.media[0] ? {
        id: rp.media[0].media.id,
        filename: rp.media[0].media.filename,
        altText: rp.media[0].media.altText,
        url: `/uploads/${rp.media[0].media.folder}/${rp.media[0].media.filename}`
      } : null
    }));

    const response = {
      product: transformedProduct,
      relatedProducts: transformedRelatedProducts,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    };

    // Log successful API usage
    const responseTime = Date.now() - startTime;
    await ApiAuthService.logApiUsage({
      apiKeyId,
      endpoint: '/api/public/products/[id]',
      method: 'GET',
      statusCode: 200,
      responseTime,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Public product API error:', error);

    // Log error
    if (apiKeyId) {
      const responseTime = Date.now() - startTime;
      await ApiAuthService.logApiUsage({
        apiKeyId,
        endpoint: '/api/public/products/[id]',
        method: 'GET',
        statusCode: 500,
        responseTime,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}