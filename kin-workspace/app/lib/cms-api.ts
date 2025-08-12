/**
 * CMS API Integration Service
 * Provides unified access to CMS data for the e-commerce frontend
 */

import { apiLogger } from './integration-logger'

const CMS_API_URL = process.env.CMS_API_URL || 'http://localhost:3001/api'

export interface CMSProduct {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: number
  comparePrice: number | null
  sku: string | null
  inventoryQuantity: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  featured: boolean
  createdAt: string
  updatedAt: string
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
  media: Array<{
    id: string
    filename: string
    altText: string | null
    sortOrder: number
    isPrimary: boolean
  }>
}

export interface CMSCategory {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  children?: CMSCategory[]
}

export interface ProductFilters {
  category?: string
  featured?: boolean
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
  search?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  page?: number
  limit?: number
  sortBy?: 'name' | 'price' | 'createdAt' | 'featured'
  sortOrder?: 'asc' | 'desc'
}

class CMSApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = CMS_API_URL
  }

  /**
   * Fetch all published products with optional filtering
   */
  async getProducts(filters: ProductFilters = {}): Promise<{
    products: CMSProduct[]
    total: number
    page: number
    totalPages: number
  }> {
    const startTime = Date.now()
    apiLogger.debug('Fetching products from CMS', filters)

    const params = new URLSearchParams()
    
    // Default to published products only for e-commerce
    params.append('status', filters.status || 'PUBLISHED')
    
    if (filters.category) params.append('category', filters.category)
    if (filters.featured !== undefined) params.append('featured', filters.featured.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
    if (filters.inStock !== undefined) params.append('inStock', filters.inStock.toString())
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

    try {
      const response = await fetch(`${this.baseUrl}/public/products?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`)
      }

      const result = await response.json()
      const duration = Date.now() - startTime
      
      apiLogger.info('Products fetched successfully', {
        count: result.products.length,
        total: result.total,
        duration: `${duration}ms`
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      apiLogger.error('Failed to fetch products', error as Error, {
        filters,
        duration: `${duration}ms`
      })
      throw error
    }
  }

  /**
   * Fetch a single product by slug
   */
  async getProductBySlug(slug: string): Promise<CMSProduct | null> {
    const response = await fetch(`${this.baseUrl}/public/products/${slug}`)
    
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Fetch all active categories
   */
  async getCategories(): Promise<CMSCategory[]> {
    const response = await fetch(`${this.baseUrl}/public/categories`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Fetch featured products
   */
  async getFeaturedProducts(limit: number = 8): Promise<CMSProduct[]> {
    const result = await this.getProducts({
      featured: true,
      status: 'PUBLISHED',
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    
    return result.products
  }

  /**
   * Search products
   */
  async searchProducts(query: string, filters: Omit<ProductFilters, 'search'> = {}): Promise<{
    products: CMSProduct[]
    total: number
    page: number
    totalPages: number
  }> {
    return this.getProducts({
      ...filters,
      search: query
    })
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categorySlug: string, filters: Omit<ProductFilters, 'category'> = {}): Promise<{
    products: CMSProduct[]
    total: number
    page: number
    totalPages: number
  }> {
    return this.getProducts({
      ...filters,
      category: categorySlug
    })
  }

  /**
   * Get media URL for a media file
   */
  getMediaUrl(filename: string): string {
    return `${this.baseUrl.replace('/api', '')}/uploads/${filename}`
  }

  /**
   * Health check for CMS API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch (error) {
      console.error('CMS API health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const cmsApi = new CMSApiService()

// Helper function to convert CMS product to e-commerce product format
export function convertCMSProductToEcommerce(cmsProduct: CMSProduct): any {
  const primaryImage = cmsProduct.media.find(m => m.isPrimary) || cmsProduct.media[0]
  
  return {
    id: cmsProduct.id,
    name: cmsProduct.name,
    slug: cmsProduct.slug,
    price: Number(cmsProduct.price),
    comparePrice: cmsProduct.comparePrice ? Number(cmsProduct.comparePrice) : undefined,
    image: primaryImage ? cmsApi.getMediaUrl(primaryImage.filename) : '/placeholder-product.jpg',
    images: cmsProduct.media.map(m => cmsApi.getMediaUrl(m.filename)),
    category: cmsProduct.categories[0]?.name || 'Uncategorized',
    categories: cmsProduct.categories.map(c => c.name),
    description: cmsProduct.description || cmsProduct.shortDescription || '',
    shortDescription: cmsProduct.shortDescription,
    sku: cmsProduct.sku,
    inStock: cmsProduct.inventoryQuantity > 0,
    inventoryQuantity: cmsProduct.inventoryQuantity,
    featured: cmsProduct.featured,
    rating: 4.0, // Default rating - can be enhanced with review system
    tags: cmsProduct.categories.map(c => c.name.toLowerCase()),
    createdAt: cmsProduct.createdAt,
    updatedAt: cmsProduct.updatedAt
  }
}