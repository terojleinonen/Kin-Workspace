'use client'

import { useState, useEffect } from 'react'
import { Product } from './types'

interface ProductsResponse {
  products: Product[]
  total: number
  categories: string[]
}

interface ProductResponse {
  product: Product
}

interface UseProductsOptions {
  category?: string
  limit?: number
  search?: string
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
}

export function useProducts(options: UseProductsOptions = {}) {
  const [data, setData] = useState<ProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        
        if (options.category) params.append('category', options.category)
        if (options.limit) params.append('limit', options.limit.toString())
        if (options.search) params.append('search', options.search)
        if (options.inStock !== undefined) params.append('inStock', options.inStock.toString())
        if (options.minPrice) params.append('minPrice', options.minPrice.toString())
        if (options.maxPrice) params.append('maxPrice', options.maxPrice.toString())

        const response = await fetch(`/api/products?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [
    options.category,
    options.limit,
    options.search,
    options.inStock,
    options.minPrice,
    options.maxPrice
  ])

  return { data, loading, error, refetch: () => setLoading(true) }
}

export function useProduct(slug: string) {
  const [data, setData] = useState<ProductResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/products/${slug}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found')
          }
          throw new Error('Failed to fetch product')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  return { data, loading, error }
}

export function useCategories() {
  const [data, setData] = useState<{ categories: any[], total: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/products/categories')
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { data, loading, error }
}