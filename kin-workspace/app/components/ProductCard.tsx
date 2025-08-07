'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'
import { Product } from '@/app/lib/types'
import { useCart } from '@/app/contexts/CartContext'
import { formatPrice } from '@/app/lib/cart-utils'
import WishlistButton from './WishlistButton'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, 1)
  }

  return (
    <div className="group product-card">
      <Link href={`/product/${product.slug}`}>
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Wishlist Button */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <WishlistButton productId={product.id} className="w-10 h-10 bg-soft-white/90 rounded-full flex items-center justify-center hover:bg-soft-white" />
          </div>
          
          {/* Quick Add Button */}
          <button
            onClick={handleAddToCart}
            className="absolute bottom-4 right-4 w-10 h-10 bg-matte-black text-soft-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-gray"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBagIcon className="h-5 w-5" />
          </button>
        </div>
      </Link>
      <div className="p-6">
        <div className="text-sm text-slate-gray/70 mb-2 font-inter">
          {product.category}
        </div>
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-satoshi font-semibold text-lg text-matte-black mb-2 hover:text-slate-gray transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="font-inter text-slate-gray">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  )
}