'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/app/contexts/AuthContext'
import { useWishlist } from '@/app/contexts/WishlistContext'
import { useCart } from '@/app/contexts/CartContext'
import WishlistButton from '@/app/components/WishlistButton'
import { Product } from '@/app/lib/types'
import { products } from '@/app/lib/product-data'

export default function WishlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { wishlist, isLoading: wishlistLoading } = useWishlist()
  const { addToCart } = useCart()
  const router = useRouter()
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    // Get product details for wishlist items
    const productDetails = wishlist
      .map(item => products.find(product => product.id === item.productId))
      .filter(Boolean) as Product[]
    
    setWishlistProducts(productDetails)
  }, [wishlist])

  if (authLoading || wishlistLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-matte-black"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-soft-white pt-20">
      <div className="max-w-site mx-auto px-6 py-section-mobile md:py-section">
        <div className="mb-8">
          <h1 className="font-satoshi font-bold text-3xl text-matte-black mb-2">
            My Wishlist
          </h1>
          <p className="text-slate-gray">
            {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-slate-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="font-satoshi font-semibold text-xl text-matte-black mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-slate-gray mb-6">
              Start adding products you love to keep track of them
            </p>
            <Link
              href="/shop"
              className="inline-block bg-matte-black text-soft-white px-6 py-3 rounded-lg hover:bg-slate-gray transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlistProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border border-warm-beige overflow-hidden group">
                <div className="relative">
                  <Link href={`/products/${product.slug}`}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <div className="absolute top-4 right-4">
                    <WishlistButton productId={product.id} />
                  </div>
                </div>
                
                <div className="p-6">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-satoshi font-semibold text-lg text-matte-black mb-2 hover:text-slate-gray transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <p className="text-slate-gray text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xl text-matte-black">
                      ${product.price}
                    </span>
                    
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-matte-black text-soft-white px-4 py-2 rounded-lg hover:bg-slate-gray transition-colors text-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}