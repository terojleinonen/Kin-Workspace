export interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  slug: string
  material?: string
  dimensions?: string
  description?: string
  features?: string[]
  shipping?: string
  images?: string[]
  rating?: number
  tags?: string[]
  inStock?: boolean
  colors?: string[]
  sizes?: string[]
  variants?: Array<{
    id: string
    color: string
    colorHex: string
    size?: string
    price: number
    stock: number
    images: string[]
  }>
}

export interface CartItem {
  id: string
  product: Product
  quantity: number
  variant?: {
    size?: string
    color?: string
  }
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

export interface CartContextType {
  cart: Cart
  addToCart: (product: Product, quantity?: number, variant?: CartItem['variant']) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

// Authentication Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  updatedAt: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  error?: string
}

// Review Types
export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  createdAt: string
  updatedAt: string
  verified: boolean
  helpful: number
  photos?: string[]
}

export interface ReviewFormData {
  productId: string
  rating: number
  title: string
  comment: string
  photos: string[]
}

export interface ReviewSummary {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  verifiedReviews: number
}

export interface ReviewContextType {
  reviews: Review[]
  reviewSummary: ReviewSummary | null
  isLoading: boolean
  submitReview: (reviewData: ReviewFormData) => Promise<{ success: boolean; error?: string }>
  updateHelpful: (reviewId: string) => Promise<{ success: boolean; error?: string }>
  fetchReviews: (productId: string, options?: ReviewFetchOptions) => Promise<void>
}

export interface ReviewFetchOptions {
  page?: number
  limit?: number
  sortBy?: 'date' | 'rating' | 'helpful'
  filterBy?: {
    rating?: number
    verified?: boolean
    withPhotos?: boolean
  }
}