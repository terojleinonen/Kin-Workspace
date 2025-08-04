import { NextRequest, NextResponse } from 'next/server'
import { productsDatabase } from '@/app/lib/product-data'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const limit = searchParams.get('limit')
  const search = searchParams.get('search')
  const inStock = searchParams.get('inStock')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')

  try {
    let filteredProducts = [...productsDatabase]

    // Filter by category
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(
        product => product.category.toLowerCase() === category.toLowerCase()
      )
    }

    // Filter by search term
    if (search) {
      const searchTerm = search.toLowerCase()
      filteredProducts = filteredProducts.filter(
        product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }

    // Filter by stock status
    if (inStock === 'true') {
      filteredProducts = filteredProducts.filter(product => product.inStock)
    }

    // Filter by price range
    if (minPrice) {
      const min = parseFloat(minPrice)
      filteredProducts = filteredProducts.filter(product => product.basePrice >= min)
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice)
      filteredProducts = filteredProducts.filter(product => product.basePrice <= max)
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit)
      filteredProducts = filteredProducts.slice(0, limitNum)
    }

    // Convert to Product format for compatibility
    const products = filteredProducts.map(product => ({
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
      variants: product.variants
    }))

    return NextResponse.json({
      products,
      total: products.length,
      categories: ['Desks', 'Accessories', 'Lighting', 'Seating']
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}