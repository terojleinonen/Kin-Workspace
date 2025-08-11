import { NextRequest, NextResponse } from 'next/server'
import { cmsApi, convertCMSProductToEcommerce } from '@/app/lib/cms-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const limit = searchParams.get('limit')
  const search = searchParams.get('search')
  const inStock = searchParams.get('inStock')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const page = searchParams.get('page')
  const sortBy = searchParams.get('sortBy')
  const sortOrder = searchParams.get('sortOrder')

  try {
    // Check if CMS API is available
    const isHealthy = await cmsApi.healthCheck()
    if (!isHealthy) {
      // Fallback to mock data if CMS is unavailable
      const { productsDatabase } = await import('@/app/lib/product-data')
      let filteredProducts = [...productsDatabase]

      // Apply basic filtering for fallback
      if (category && category !== 'all') {
        filteredProducts = filteredProducts.filter(
          product => product.category.toLowerCase() === category.toLowerCase()
        )
      }

      if (search) {
        const searchTerm = search.toLowerCase()
        filteredProducts = filteredProducts.filter(
          product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        )
      }

      if (limit) {
        filteredProducts = filteredProducts.slice(0, parseInt(limit))
      }

      const products = filteredProducts.map(product => ({
        id: product.id,
        name: product.name,
        price: product.basePrice,
        image: product.image,
        category: product.category,
        slug: product.slug,
        description: product.description,
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
        categories: ['Desks', 'Accessories', 'Lighting', 'Seating'],
        source: 'fallback'
      })
    }

    // Use CMS API
    const filters: any = {}
    
    if (category && category !== 'all') {
      filters.category = category
    }
    if (search) filters.search = search
    if (inStock === 'true') filters.inStock = true
    if (minPrice) filters.minPrice = parseFloat(minPrice)
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice)
    if (limit) filters.limit = parseInt(limit)
    if (page) filters.page = parseInt(page)
    if (sortBy) filters.sortBy = sortBy
    if (sortOrder) filters.sortOrder = sortOrder

    const result = await cmsApi.getProducts(filters)
    
    // Convert CMS products to e-commerce format
    const products = result.products.map(convertCMSProductToEcommerce)

    // Get categories for filter options
    const categories = await cmsApi.getCategories()
    const categoryNames = categories.map(cat => cat.name)

    return NextResponse.json({
      products,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      categories: categoryNames,
      source: 'cms'
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    
    // Fallback to mock data on error
    try {
      const { productsDatabase } = await import('@/app/lib/product-data')
      const products = productsDatabase.slice(0, limit ? parseInt(limit) : 20).map(product => ({
        id: product.id,
        name: product.name,
        price: product.basePrice,
        image: product.image,
        category: product.category,
        slug: product.slug,
        description: product.description,
        rating: product.rating,
        tags: product.tags,
        inStock: product.inStock
      }))

      return NextResponse.json({
        products,
        total: products.length,
        categories: ['Desks', 'Accessories', 'Lighting', 'Seating'],
        source: 'fallback',
        error: 'CMS unavailable, using fallback data'
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }
  }
}