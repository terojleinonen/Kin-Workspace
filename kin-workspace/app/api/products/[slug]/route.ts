import { NextRequest, NextResponse } from 'next/server'
import { productsDatabase } from '@/app/lib/product-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const product = productsDatabase.find(p => p.slug === slug)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Convert to Product format with full variant information
    const productResponse = {
      id: product.id,
      name: product.name,
      price: product.basePrice,
      image: product.image,
      category: product.category,
      slug: product.slug,
      description: product.description,
      material: product.material,
      dimensions: product.dimensions,
      features: product.features,
      shipping: product.shipping,
      rating: product.rating,
      tags: product.tags,
      inStock: product.inStock,
      colors: product.colors,
      sizes: product.sizes,
      variants: product.variants,
      images: product.variants[0]?.images || [product.image]
    }

    return NextResponse.json({ product: productResponse })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}