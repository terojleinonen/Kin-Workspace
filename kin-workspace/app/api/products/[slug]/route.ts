import { NextRequest, NextResponse } from 'next/server'
import { cmsApi, convertCMSProductToEcommerce } from '@/app/lib/cms-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Check if CMS API is available
    const isHealthy = await cmsApi.healthCheck()
    
    if (isHealthy) {
      // Try to fetch from CMS first
      const cmsProduct = await cmsApi.getProductBySlug(slug)
      
      if (cmsProduct) {
        const product = convertCMSProductToEcommerce(cmsProduct)
        return NextResponse.json({ 
          product,
          source: 'cms'
        })
      }
    }

    // Fallback to mock data
    const { productsDatabase } = await import('@/app/lib/product-data')
    const mockProduct = productsDatabase.find(p => p.slug === slug)
    
    if (!mockProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Convert to Product format with full variant information
    const productResponse = {
      id: mockProduct.id,
      name: mockProduct.name,
      price: mockProduct.basePrice,
      image: mockProduct.image,
      category: mockProduct.category,
      slug: mockProduct.slug,
      description: mockProduct.description,
      material: mockProduct.material,
      dimensions: mockProduct.dimensions,
      features: mockProduct.features,
      shipping: mockProduct.shipping,
      rating: mockProduct.rating,
      tags: mockProduct.tags,
      inStock: mockProduct.inStock,
      colors: mockProduct.colors,
      sizes: mockProduct.sizes,
      variants: mockProduct.variants,
      images: mockProduct.variants[0]?.images || [mockProduct.image]
    }

    return NextResponse.json({ 
      product: productResponse,
      source: 'fallback'
    })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}