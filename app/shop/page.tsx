'use client'

import { useSearchParams } from 'next/navigation'
import ProductGrid from '../components/ProductGrid'

export default function ShopPage() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category')

  return (
    <div className="pt-24 pb-section">
      <div className="max-w-site mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="font-satoshi font-bold text-4xl md:text-5xl text-matte-black mb-4">
            {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Products` : 'Shop All Products'}
          </h1>
          <p className="text-slate-gray text-lg max-w-2xl mx-auto">
            {category 
              ? `Explore our ${category} collection designed to create calm and enhance productivity.`
              : 'Explore our complete collection of workspace essentials designed to create calm and enhance productivity.'
            }
          </p>
        </div>
        <ProductGrid category={category || undefined} />
      </div>
    </div>
  )
}