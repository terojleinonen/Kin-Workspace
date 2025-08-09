/**
 * TypeScript type definitions for the CMS
 */

// User types
export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EDITOR' | 'VIEWER'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Category types
export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  parentId?: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // Relations
  parent?: Category | null
  children?: Category[]
  _count?: {
    products: number
    children: number
  }
}

// Product types
export interface Product {
  id: string
  name: string
  slug: string
  description?: string | null
  shortDescription?: string | null
  price: number
  comparePrice?: number | null
  sku?: string | null
  inventoryQuantity: number
  weight?: number | null
  dimensions?: any
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  featured: boolean
  seoTitle?: string | null
  seoDescription?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Relations
  creator?: User
  categories?: ProductCategory[]
  media?: ProductMedia[]
}

export interface ProductCategory {
  productId: string
  categoryId: string
  product?: Product
  category?: Category
}

// Media types
export interface Media {
  id: string
  filename: string
  originalName: string
  mimeType: string
  fileSize: number
  width?: number | null
  height?: number | null
  altText?: string | null
  folder: string
  createdBy: string
  createdAt: string
  
  // Relations
  creator?: User
  products?: ProductMedia[]
}

export interface ProductMedia {
  productId: string
  mediaId: string
  sortOrder: number
  isPrimary: boolean
  product?: Product
  media?: Media
}

// Page types
export interface Page {
  id: string
  title: string
  slug: string
  content?: string | null
  excerpt?: string | null
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  template: string
  seoTitle?: string | null
  seoDescription?: string | null
  publishedAt?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Relations
  creator?: User
}

// Content revision types
export interface ContentRevision {
  id: string
  contentType: string
  contentId: string
  revisionData: any
  createdBy: string
  createdAt: string
  
  // Relations
  creator?: User
}

// API response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Form types
export interface CategoryFormData {
  name: string
  slug: string
  description?: string
  parentId?: string | null
  sortOrder?: number
  isActive: boolean
}

export interface ProductFormData {
  name: string
  slug: string
  description?: string
  shortDescription?: string
  price: number
  comparePrice?: number
  sku?: string
  inventoryQuantity: number
  weight?: number
  dimensions?: any
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  featured: boolean
  seoTitle?: string
  seoDescription?: string
  categoryIds: string[]
}

// Filter types
export interface CategoryFilters {
  search?: string
  parentId?: string | null
  includeInactive?: boolean
}

export interface ProductFilters {
  search?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  categoryId?: string
  featured?: boolean
  minPrice?: number
  maxPrice?: number
}

export interface MediaFilters {
  search?: string
  type?: 'image' | 'document' | 'video' | 'audio'
  folder?: string
  sortBy?: 'name' | 'size' | 'createdAt' | 'type'
  sortOrder?: 'asc' | 'desc'
}