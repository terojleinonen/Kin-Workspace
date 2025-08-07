import { NextResponse } from 'next/server'
import { productsDatabase } from '@/app/lib/product-data'

export async function GET() {
  try {
    // Get unique categories with product counts
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
      total: categories.length
    })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}