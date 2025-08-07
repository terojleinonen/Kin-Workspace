'use client'

import React, { useState } from 'react'
import ProductCard from './ProductCard'
import { useProducts, useCategories } from '@/app/lib/api-hooks'

interface ProductGridProps {
  showTitle?: boolean
  limit?: number
  category?: string
}

export default function ProductGrid({ showTitle = true, limit, category }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState(category || 'All')
  const { data: categoriesData } = useCategories()
  const { data: productsData, loading, error } = useProducts({
    category: selectedCategory === 'All' ? undefined : selectedCategory.toLowerCase(),
    limit
  })

  // Update selected category when URL category changes
  React.useEffect(() => {
    if (category && category !== selectedCategory) {
      setSelectedCategory(category)
    }
  }, [category, selectedCategory])

  const categories = ['All', ...(categoriesData?.categories.map(cat => cat.name) || [])]

  if (loading) {
    return (
      <section className="py-section md:py-section px-6">
        <div className="max-w-site mx-auto">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-warm-beige rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-warm-beige rounded w-96 mx-auto mb-12"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-warm-beige rounded-lg mb-4"></div>
                  <div className="h-4 bg-warm-beige rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-warm-beige rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-section md:py-section px-6">
        <div className="max-w-site mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-satoshi font-semibold text-red-800 mb-2">
              Error Loading Products
            </h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  const products = productsData?.products || []

  return (
    <section className="py-section md:py-section px-6">
      <div className="max-w-site mx-auto">
        {showTitle && (
          <div className="text-center mb-12">
            <h2 className="font-satoshi font-bold text-3xl md:text-4xl text-matte-black mb-4">
              Featured Products
            </h2>
            <p className="text-slate-gray max-w-2xl mx-auto">
              Discover our carefully curated collection of workspace essentials designed to enhance your productivity and well-being.
            </p>
          </div>
        )}

        {/* Category Filter */}
        {!category && (
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full font-inter font-medium transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-matte-black text-soft-white'
                    : 'bg-warm-beige text-slate-gray hover:bg-slate-gray hover:text-soft-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="font-satoshi font-semibold text-xl text-matte-black mb-2">
              No Products Found
            </h3>
            <p className="text-slate-gray">
              {selectedCategory === 'All' 
                ? 'No products are currently available.'
                : `No products found in the ${selectedCategory} category.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Product Count */}
        {products.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-slate-gray">
              Showing {products.length} of {productsData?.total || 0} products
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}