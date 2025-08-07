'use client'

import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { useState } from 'react'
import { useCart } from '@/app/contexts/CartContext'
import { useProduct } from '@/app/lib/api-hooks'
import { formatPrice } from '@/app/lib/cart-utils'
import { ProductVariant } from '@/app/lib/product-data'
import ReviewsSection from '@/app/components/reviews/ReviewsSection'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ slug: string } | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const { addToCart } = useCart()

  // Resolve params on mount
  React.useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  const { data: productData, loading, error } = useProduct(resolvedParams?.slug || '')

  // Set default variant when product loads
  React.useEffect(() => {
    if (productData?.product?.variants && !selectedVariant) {
      setSelectedVariant(productData.product.variants[0])
    }
  }, [productData, selectedVariant])

  if (!resolvedParams || loading) {
    return (
      <div className="pt-24 pb-section">
        <div className="max-w-site mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-warm-beige rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square bg-warm-beige rounded-lg animate-pulse"></div>
                <div className="aspect-square bg-warm-beige rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-warm-beige rounded animate-pulse"></div>
              <div className="h-12 bg-warm-beige rounded animate-pulse"></div>
              <div className="h-6 bg-warm-beige rounded animate-pulse"></div>
              <div className="h-24 bg-warm-beige rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !productData?.product) {
    notFound()
  }

  const product = productData.product
  const currentPrice = selectedVariant?.price || product.price
  const currentStock = selectedVariant?.stock || 0
  const currentImages = selectedVariant?.images || product.images || [product.image]

  const handleAddToCart = () => {
    const variant = selectedVariant ? {
      color: selectedVariant.color,
      size: selectedVariant.size
    } : undefined

    addToCart(product, quantity, variant)
  }

  const handleColorChange = (color: string) => {
    const variant = product.variants?.find(v => v.color === color)
    if (variant) {
      setSelectedVariant(variant)
    }
  }

  const handleSizeChange = (size: string) => {
    const variant = product.variants?.find(v =>
      v.color === selectedVariant?.color && v.size === size
    ) || product.variants?.find(v => v.size === size)

    if (variant) {
      setSelectedVariant(variant)
    }
  }

  return (
    <div className="pt-24 pb-section">
      <div className="max-w-site mx-auto px-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm mb-8" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-slate-gray hover:text-matte-black transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
          <span className="text-slate-gray">•</span>
          <Link href="/shop" className="text-slate-gray hover:text-matte-black transition-colors">
            Shop
          </Link>
          <span className="text-slate-gray">•</span>
          <Link 
            href={`/shop?category=${product.category.toLowerCase()}`}
            className="text-slate-gray hover:text-matte-black transition-colors"
          >
            {product.category}
          </Link>
          <span className="text-slate-gray">•</span>
          <span className="text-matte-black font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg">
              <Image
                src={currentImages[0]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            {currentImages.length > 1 && (
              <div className="grid grid-cols-2 gap-4">
                {currentImages.slice(1).map((image, index) => (
                  <div key={index} className="aspect-square relative overflow-hidden rounded-lg">
                    <Image
                      src={image}
                      alt={`${product.name} view ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:pl-8">
            <div className="text-sm text-slate-gray/70 mb-2 font-inter">
              {product.category}
            </div>
            <h1 className="font-satoshi font-bold text-3xl md:text-4xl text-matte-black mb-4">
              {product.name}
            </h1>
            <div className="flex items-center space-x-4 mb-6">
              <p className="text-2xl font-inter text-matte-black">
                {formatPrice(currentPrice)}
              </p>
              {product.rating && (
                <div className="flex items-center space-x-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-slate-gray">({product.rating})</span>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {currentStock > 0 ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 text-sm font-medium">
                    {currentStock} in stock
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-600 text-sm font-medium">Out of stock</span>
                </div>
              )}
            </div>

            {product.description && (
              <p className="text-slate-gray mb-8 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Product Details */}
            <div className="space-y-4 mb-8">
              {product.material && (
                <div>
                  <span className="font-satoshi font-semibold text-matte-black">Material: </span>
                  <span className="text-slate-gray">{product.material}</span>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <span className="font-satoshi font-semibold text-matte-black">Dimensions: </span>
                  <span className="text-slate-gray">{product.dimensions}</span>
                </div>
              )}
              {product.shipping && (
                <div>
                  <span className="font-satoshi font-semibold text-matte-black">Shipping: </span>
                  <span className="text-slate-gray">{product.shipping}</span>
                </div>
              )}
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-8">
                <h3 className="font-satoshi font-semibold text-lg text-matte-black mb-4">
                  Features
                </h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-slate-gray">
                      <span className="w-2 h-2 bg-matte-black rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 1 && (
              <div className="mb-6">
                <label className="block font-satoshi font-semibold text-matte-black mb-3">
                  Color: {selectedVariant?.color}
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => {
                    const variant = product.variants?.find(v => v.color === color)
                    const isSelected = selectedVariant?.color === color
                    const isAvailable = variant && variant.stock > 0

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        disabled={!isAvailable}
                        className={`color-swatch w-10 h-10 rounded-full border-2 transition-all ${isSelected
                          ? 'border-matte-black scale-110'
                          : 'border-warm-beige hover:border-slate-gray'
                          } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        ref={(el) => {
                          if (el && variant?.colorHex) {
                            el.style.setProperty('--swatch-color', variant.colorHex)
                          }
                        }}
                        aria-label={`Select ${color} color`}
                        title={`${color}${!isAvailable ? ' (Out of stock)' : ''}`}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 1 && (
              <div className="mb-6">
                <label className="block font-satoshi font-semibold text-matte-black mb-3">
                  Size: {selectedVariant?.size}
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => {
                    const variant = product.variants?.find(v =>
                      v.size === size && v.color === selectedVariant?.color
                    )
                    const isSelected = selectedVariant?.size === size
                    const isAvailable = variant && variant.stock > 0

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSizeChange(size)}
                        disabled={!isAvailable}
                        className={`px-4 py-2 border rounded-lg font-medium transition-all ${isSelected
                          ? 'border-matte-black bg-matte-black text-soft-white'
                          : 'border-warm-beige hover:border-slate-gray'
                          } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block font-satoshi font-semibold text-matte-black mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-warm-beige rounded-lg flex items-center justify-center hover:bg-warm-beige transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="w-10 h-10 border border-warm-beige rounded-lg flex items-center justify-center hover:bg-warm-beige transition-colors"
                  aria-label="Increase quantity"
                  disabled={quantity >= currentStock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              className="w-full btn-primary text-lg py-4 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStock === 0
                ? 'Out of Stock'
                : `Add to Cart - ${formatPrice(currentPrice * quantity)}`
              }
            </button>
            <button type="button" className="w-full btn-secondary text-lg py-4">
              Add to Wishlist
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 pt-16 border-t border-warm-beige">
          <ReviewsSection productId={product.id} />
        </div>
      </div>
    </div>
  )
}