import { NextResponse } from 'next/server'
import { cmsApi } from '@/app/lib/cms-api'

export async function GET() {
  try {
    // Check if CMS API is available
    const isHealthy = await cmsApi.healthCheck()
    
    if (isHealthy) {
      // Try to fetch from CMS first
      const cmsCategories = await cmsApi.getCategories()
      
      const categories = cmsCategories.map(category => ({
        name: category.name,
        slug: category.slug,
        description: category.description,
        count: category.productCount || 0,
        inStockCount: category.productCount || 0, // Simplified for now
        id: category.id,
        parentId: category.parentId,
        sortOrder: category.sortOrder
      }))

      return NextResponse.json({
        categories,
        total: categories.length,
        source: 'cms'
      })
    }

    // Fallback to mock data
    const { productsDatabase } = await import('@/app/lib/product-data')
    const categoryStats = productsDatabase.reduce((acc, product) => {
      const category = product.category
      if (!acc[category]) {
        acc[category] = {
          name: category,
          slug: category.toLowerCase(),
          count: 0,
          inStockCount: 0
        }
      }
      acc[category].count++
      if (product.inStock) {
        acc[category].inStockCount++
      }
      return acc
    }, {} as Record<string, any>)

    const categories = Object.values(categoryStats)

    return NextResponse.json({
      categories,
      total: categories.length,
      source: 'fallback'
    })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}