import { Product } from './types'

export interface ProductVariant {
  id: string
  color: string
  colorHex: string
  size?: string
  price: number
  stock: number
  images: string[]
}

export interface ProductWithVariants extends Omit<Product, 'price' | 'images'> {
  basePrice: number
  variants: ProductVariant[]
  colors: string[]
  sizes?: string[]
  rating: number
  tags: string[]
  inStock: boolean
}

// Enhanced product data based on your JSON with variants
export const productsDatabase: ProductWithVariants[] = [
  // DESKS CATEGORY (8 products)
  {
    id: 'des-000',
    name: 'Minimal Oak Desk',
    category: 'Desks',
    slug: 'desks-item-1',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 89,
    description: 'A premium quality desk designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: false,
    colors: ['Natural Wood', 'White', 'Black'],
    sizes: ['Standard', 'Large'],
    variants: [
      {
        id: 'des-000-natural-standard',
        color: 'Natural Wood',
        colorHex: '#D2B48C',
        size: 'Standard',
        price: 89,
        stock: 0,
        images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'des-000-white-standard',
        color: 'White',
        colorHex: '#FFFFFF',
        size: 'Standard',
        price: 94,
        stock: 5,
        images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'des-001',
    name: 'Standing Desk Converter',
    category: 'Desks',
    slug: 'desks-item-2',
    image: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 104,
    description: 'A premium quality desk designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Oak', 'Walnut', 'Cherry'],
    sizes: ['Standard', 'Large'],
    variants: [
      {
        id: 'des-001-oak-standard',
        color: 'Oak',
        colorHex: '#D2B48C',
        size: 'Standard',
        price: 104,
        stock: 12,
        images: ['https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'des-001-oak-large',
        color: 'Oak',
        colorHex: '#D2B48C',
        size: 'Large',
        price: 124,
        stock: 8,
        images: ['https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'des-001-walnut-standard',
        color: 'Walnut',
        colorHex: '#5D4037',
        size: 'Standard',
        price: 114,
        stock: 10,
        images: ['https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'des-002',
    name: 'Executive L-Shaped Desk',
    category: 'Desks',
    slug: 'desks-item-3',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 119,
    description: 'A premium quality desk designed for calm and productivity.',
    rating: 4.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Black', 'White', 'Gray'],
    variants: [
      {
        id: 'des-002-black',
        color: 'Black',
        colorHex: '#000000',
        price: 119,
        stock: 15,
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'des-002-white',
        color: 'White',
        colorHex: '#FFFFFF',
        price: 119,
        stock: 12,
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'des-003',
    name: 'Compact Writing Desk',
    category: 'Desks',
    slug: 'desks-item-4',
    image: 'https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 119,
    description: 'A premium quality desk designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Natural', 'Dark Brown'],
    sizes: ['Compact', 'Standard'],
    variants: [
      {
        id: 'des-003-natural-compact',
        color: 'Natural',
        colorHex: '#DEB887',
        size: 'Compact',
        price: 119,
        stock: 8,
        images: ['https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'des-003-natural-standard',
        color: 'Natural',
        colorHex: '#DEB887',
        size: 'Standard',
        price: 139,
        stock: 6,
        images: ['https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'des-004',
    name: 'Industrial Pipe Desk',
    category: 'Desks',
    slug: 'desks-item-5',
    image: 'https://images.unsplash.com/photo-1551298370-9c50423c2c4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 134,
    description: 'A premium quality desk designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Bamboo', 'Teak'],
    variants: [
      {
        id: 'des-004-bamboo',
        color: 'Bamboo',
        colorHex: '#D2B48C',
        price: 134,
        stock: 10,
        images: ['https://images.unsplash.com/photo-1551298370-9c50423c2c4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'des-004-teak',
        color: 'Teak',
        colorHex: '#CD853F',
        price: 144,
        stock: 7,
        images: ['https://images.unsplash.com/photo-1551298370-9c50423c2c4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'des-005',
    name: 'Glass Top Modern Desk',
    category: 'Desks',
    slug: 'desks-item-6',
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 149,
    description: 'A premium quality desk designed for calm and productivity.',
    rating: 4.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: false,
    colors: ['Espresso', 'Mahogany'],
    sizes: ['Standard', 'Executive'],
    variants: [
      {
        id: 'des-005-espresso-standard',
        color: 'Espresso',
        colorHex: '#3C2415',
        size: 'Standard',
        price: 149,
        stock: 0,
        images: ['https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'des-006',
    name: 'Adjustable Height Desk',
    category: 'Desks',
    slug: 'desks-item-7',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 149,
    description: 'A premium quality desk designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Pine', 'Oak', 'Maple'],
    variants: [
      {
        id: 'des-006-pine',
        color: 'Pine',
        colorHex: '#DEB887',
        price: 149,
        stock: 9,
        images: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'des-006-oak',
        color: 'Oak',
        colorHex: '#D2B48C',
        price: 159,
        stock: 11,
        images: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'des-007',
    name: 'Vintage Secretary Desk',
    category: 'Desks',
    slug: 'desks-item-8',
    image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 164,
    description: 'A premium quality desk designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Glass Clear', 'Glass Frosted'],
    sizes: ['Standard', 'Large'],
    variants: [
      {
        id: 'des-007-clear-standard',
        color: 'Glass Clear',
        colorHex: '#F0F8FF',
        size: 'Standard',
        price: 164,
        stock: 6,
        images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'des-007-clear-large',
        color: 'Glass Clear',
        colorHex: '#F0F8FF',
        size: 'Large',
        price: 184,
        stock: 4,
        images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },

  // ACCESSORIES CATEGORY (8 products)
  {
    id: 'acc-008',
    name: 'Ceramic Desk Organizer',
    category: 'Accessories',
    slug: 'accessories-item-1',
    image: 'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 89,
    description: 'A premium quality accessorie designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: false,
    colors: ['White', 'Black', 'Gray'],
    variants: [
      {
        id: 'acc-008-white',
        color: 'White',
        colorHex: '#FFFFFF',
        price: 89,
        stock: 0,
        images: ['https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'acc-009',
    name: 'Bamboo Monitor Stand',
    category: 'Accessories',
    slug: 'accessories-item-2',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 104,
    description: 'A premium quality accessorie designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Sage Green', 'Terracotta', 'Charcoal'],
    sizes: ['Small', 'Medium', 'Large'],
    variants: [
      {
        id: 'acc-009-sage-medium',
        color: 'Sage Green',
        colorHex: '#9CAF88',
        size: 'Medium',
        price: 104,
        stock: 15,
        images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'acc-009-terracotta-medium',
        color: 'Terracotta',
        colorHex: '#E2725B',
        size: 'Medium',
        price: 104,
        stock: 12,
        images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'acc-010',
    name: 'Leather Desk Pad',
    category: 'Accessories',
    slug: 'accessories-item-3',
    image: 'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 119,
    description: 'A premium quality accessorie designed for calm and productivity.',
    rating: 4.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Natural Bamboo', 'Dark Bamboo'],
    sizes: ['Standard', 'Wide'],
    variants: [
      {
        id: 'acc-010-natural-standard',
        color: 'Natural Bamboo',
        colorHex: '#D2B48C',
        size: 'Standard',
        price: 119,
        stock: 20,
        images: ['https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'acc-010-natural-wide',
        color: 'Natural Bamboo',
        colorHex: '#D2B48C',
        size: 'Wide',
        price: 139,
        stock: 8,
        images: ['https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'acc-011',
    name: 'Wireless Charging Pad',
    category: 'Accessories',
    slug: 'accessories-item-4',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 119,
    description: 'A premium quality accessorie designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Black Leather', 'Brown Leather', 'Cognac'],
    sizes: ['Medium', 'Large', 'XL'],
    variants: [
      {
        id: 'acc-011-black-large',
        color: 'Black Leather',
        colorHex: '#000000',
        size: 'Large',
        price: 119,
        stock: 15,
        images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'acc-011-brown-large',
        color: 'Brown Leather',
        colorHex: '#8B4513',
        size: 'Large',
        price: 119,
        stock: 10,
        images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'acc-012',
    name: 'Cable Management Tray',
    category: 'Accessories',
    slug: 'accessories-item-5',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 134,
    description: 'A premium quality accessorie designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Walnut', 'Maple', 'Black'],
    variants: [
      {
        id: 'acc-012-walnut',
        color: 'Walnut',
        colorHex: '#5D4037',
        price: 134,
        stock: 25,
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'acc-012-maple',
        color: 'Maple',
        colorHex: '#D2B48C',
        price: 134,
        stock: 18,
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'acc-013',
    name: 'Wooden Pen Holder',
    category: 'Accessories',
    slug: 'accessories-item-6',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 149,
    description: 'A premium quality accessorie designed for calm and productivity.',
    rating: 4.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: false,
    colors: ['Black', 'White', 'Silver'],
    variants: [
      {
        id: 'acc-013-black',
        color: 'Black',
        colorHex: '#000000',
        price: 149,
        stock: 0,
        images: ['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'acc-014',
    name: 'Document Organizer',
    category: 'Accessories',
    slug: 'accessories-item-7',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 149,
    description: 'A premium quality accessorie designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Oak', 'Walnut', 'Cherry', 'Pine'],
    variants: [
      {
        id: 'acc-014-oak',
        color: 'Oak',
        colorHex: '#D2B48C',
        price: 149,
        stock: 30,
        images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'acc-014-walnut',
        color: 'Walnut',
        colorHex: '#5D4037',
        price: 154,
        stock: 25,
        images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'acc-015',
    name: 'Desk Plant Holder',
    category: 'Accessories',
    slug: 'accessories-item-8',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 164,
    description: 'A premium quality accessorie designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Natural', 'Black', 'White'],
    variants: [
      {
        id: 'acc-015-natural',
        color: 'Natural',
        colorHex: '#D2B48C',
        price: 164,
        stock: 18,
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'acc-015-black',
        color: 'Black',
        colorHex: '#000000',
        price: 164,
        stock: 15,
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },

  // LIGHTING CATEGORY (8 products)
  {
    id: 'lig-016',
    name: 'Warm LED Desk Lamp',
    category: 'Lighting',
    slug: 'lighting-item-1',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 89,
    description: 'A premium quality lightin designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: false,
    colors: ['Black', 'White', 'Silver'],
    variants: [
      {
        id: 'lig-016-black',
        color: 'Black',
        colorHex: '#000000',
        price: 89,
        stock: 0,
        images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'lig-017',
    name: 'Lighting Item 2',
    category: 'Lighting',
    slug: 'lighting-item-2',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 104,
    description: 'A premium quality lightin designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Black', 'White', 'Silver', 'Gold'],
    variants: [
      {
        id: 'lig-017-black',
        color: 'Black',
        colorHex: '#000000',
        price: 104,
        stock: 22,
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'lig-017-white',
        color: 'White',
        colorHex: '#FFFFFF',
        price: 104,
        stock: 18,
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'lig-017-gold',
        color: 'Gold',
        colorHex: '#FFD700',
        price: 114,
        stock: 12,
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'lig-018',
    name: 'Lighting Item 3',
    category: 'Lighting',
    slug: 'lighting-item-3',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 119,
    description: 'A premium quality lightin designed for calm and productivity.',
    rating: 4.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Brass', 'Black', 'Chrome'],
    variants: [
      {
        id: 'lig-018-brass',
        color: 'Brass',
        colorHex: '#B5651D',
        price: 119,
        stock: 12,
        images: ['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'lig-018-black',
        color: 'Black',
        colorHex: '#000000',
        price: 119,
        stock: 8,
        images: ['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'lig-019',
    name: 'Lighting Item 4',
    category: 'Lighting',
    slug: 'lighting-item-4',
    image: 'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 119,
    description: 'A premium quality lightin designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Black', 'White', 'Copper'],
    variants: [
      {
        id: 'lig-019-black',
        color: 'Black',
        colorHex: '#000000',
        price: 119,
        stock: 8,
        images: ['https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'lig-019-copper',
        color: 'Copper',
        colorHex: '#B87333',
        price: 129,
        stock: 6,
        images: ['https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'lig-020',
    name: 'Lighting Item 5',
    category: 'Lighting',
    slug: 'lighting-item-5',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 134,
    description: 'A premium quality lightin designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Warm White', 'Cool White', 'RGB'],
    sizes: ['24"', '36"', '48"'],
    variants: [
      {
        id: 'lig-020-warm-36',
        color: 'Warm White',
        colorHex: '#FFF8DC',
        size: '36"',
        price: 134,
        stock: 30,
        images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'lig-020-cool-36',
        color: 'Cool White',
        colorHex: '#F0F8FF',
        size: '36"',
        price: 134,
        stock: 25,
        images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'lig-021',
    name: 'Lighting Item 6',
    category: 'Lighting',
    slug: 'lighting-item-6',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 149,
    description: 'A premium quality lightin designed for calm and productivity.',
    rating: 4.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: false,
    colors: ['Black', 'Brass', 'White'],
    variants: [
      {
        id: 'lig-021-black',
        color: 'Black',
        colorHex: '#000000',
        price: 149,
        stock: 0,
        images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'lig-022',
    name: 'Lighting Item 7',
    category: 'Lighting',
    slug: 'lighting-item-7',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 149,
    description: 'A premium quality lightin designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Black', 'Silver', 'Red', 'Blue'],
    variants: [
      {
        id: 'lig-022-black',
        color: 'Black',
        colorHex: '#000000',
        price: 149,
        stock: 25,
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'lig-022-silver',
        color: 'Silver',
        colorHex: '#C0C0C0',
        price: 149,
        stock: 20,
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'lig-023',
    name: 'Lighting Item 8',
    category: 'Lighting',
    slug: 'lighting-item-8',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 164,
    description: 'A premium quality lightin designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Black', 'White'],
    variants: [
      {
        id: 'lig-023-black',
        color: 'Black',
        colorHex: '#000000',
        price: 164,
        stock: 10,
        images: ['https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'lig-023-white',
        color: 'White',
        colorHex: '#FFFFFF',
        price: 164,
        stock: 8,
        images: ['https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },

  // SEATING CATEGORY (8 products)
  {
    id: 'sea-024',
    name: 'Seating Item 1',
    category: 'Seating',
    slug: 'seating-item-1',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 89,
    description: 'A premium quality seatin designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: false,
    colors: ['Black', 'Gray', 'White'],
    variants: [
      {
        id: 'sea-024-black',
        color: 'Black',
        colorHex: '#000000',
        price: 89,
        stock: 0,
        images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'sea-025',
    name: 'Seating Item 2',
    category: 'Seating',
    slug: 'seating-item-2',
    image: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 104,
    description: 'A premium quality seatin designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Black', 'Gray', 'White', 'Blue'],
    variants: [
      {
        id: 'sea-025-black',
        color: 'Black',
        colorHex: '#000000',
        price: 104,
        stock: 15,
        images: ['https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'sea-025-gray',
        color: 'Gray',
        colorHex: '#808080',
        price: 104,
        stock: 12,
        images: ['https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'sea-025-blue',
        color: 'Blue',
        colorHex: '#0000FF',
        price: 114,
        stock: 8,
        images: ['https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'sea-026',
    name: 'Seating Item 3',
    category: 'Seating',
    slug: 'seating-item-3',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 119,
    description: 'A premium quality seatin designed for calm and productivity.',
    rating: 4.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Black Leather', 'Brown Leather', 'Cognac'],
    variants: [
      {
        id: 'sea-026-black',
        color: 'Black Leather',
        colorHex: '#000000',
        price: 119,
        stock: 8,
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'sea-026-brown',
        color: 'Brown Leather',
        colorHex: '#8B4513',
        price: 129,
        stock: 6,
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'sea-027',
    name: 'Seating Item 4',
    category: 'Seating',
    slug: 'seating-item-4',
    image: 'https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 119,
    description: 'A premium quality seatin designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Charcoal', 'Navy', 'Cream'],
    variants: [
      {
        id: 'sea-027-charcoal',
        color: 'Charcoal',
        colorHex: '#36454F',
        price: 119,
        stock: 20,
        images: ['https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'sea-027-navy',
        color: 'Navy',
        colorHex: '#000080',
        price: 119,
        stock: 15,
        images: ['https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'sea-028',
    name: 'Seating Item 5',
    category: 'Seating',
    slug: 'seating-item-5',
    image: 'https://images.unsplash.com/photo-1551298370-9c50423c2c4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 134,
    description: 'A premium quality seatin designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Natural Wood', 'Black', 'White'],
    variants: [
      {
        id: 'sea-028-natural',
        color: 'Natural Wood',
        colorHex: '#D2B48C',
        price: 134,
        stock: 25,
        images: ['https://images.unsplash.com/photo-1551298370-9c50423c2c4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'sea-028-black',
        color: 'Black',
        colorHex: '#000000',
        price: 134,
        stock: 18,
        images: ['https://images.unsplash.com/photo-1551298370-9c50423c2c4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'sea-029',
    name: 'Seating Item 6',
    category: 'Seating',
    slug: 'seating-item-6',
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 149,
    description: 'A premium quality seatin designed for calm and productivity.',
    rating: 4.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: false,
    colors: ['Emerald', 'Navy', 'Blush'],
    variants: [
      {
        id: 'sea-029-emerald',
        color: 'Emerald',
        colorHex: '#50C878',
        price: 149,
        stock: 0,
        images: ['https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'sea-030',
    name: 'Seating Item 7',
    category: 'Seating',
    slug: 'seating-item-7',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 149,
    description: 'A premium quality seatin designed for calm and productivity.',
    rating: 3.5,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Black', 'Gray', 'Blue'],
    variants: [
      {
        id: 'sea-030-black',
        color: 'Black',
        colorHex: '#000000',
        price: 149,
        stock: 15,
        images: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'sea-030-gray',
        color: 'Gray',
        colorHex: '#808080',
        price: 149,
        stock: 12,
        images: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  },
  {
    id: 'sea-031',
    name: 'Seating Item 8',
    category: 'Seating',
    slug: 'seating-item-8',
    image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    basePrice: 164,
    description: 'A premium quality seatin designed for calm and productivity.',
    rating: 4.0,
    tags: ['minimalist', 'workspace', 'calm'],
    inStock: true,
    colors: ['Black', 'Blue', 'Red', 'Green'],
    variants: [
      {
        id: 'sea-031-black',
        color: 'Black',
        colorHex: '#000000',
        price: 164,
        stock: 30,
        images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      },
      {
        id: 'sea-031-blue',
        color: 'Blue',
        colorHex: '#0000FF',
        price: 164,
        stock: 25,
        images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
      }
    ]
  }
]

// Convert ProductWithVariants to simple Product array for compatibility
export const products: Product[] = productsDatabase.map(product => ({
  id: product.id,
  name: product.name,
  price: product.basePrice,
  image: product.image,
  category: product.category,
  slug: product.slug,
  description: product.description,
  features: product.tags,
  inStock: product.inStock,
  rating: product.rating
}))

// Helper functions for product operations
export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find(product => product.slug === slug)
}

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter(product => product.category === category)
}

export const searchProducts = (query: string): Product[] => {
  if (!query.trim()) {
    return products
  }
  
  const searchTerm = query.toLowerCase()
  return products.filter(product => {
    const searchableText = `${product.name} ${product.description || ''} ${product.category}`.toLowerCase()
    return searchableText.includes(searchTerm)
  })
}

export const getCategories = (): Array<{ name: string; count: number }> => {
  const categoryMap = new Map<string, number>()
  
  products.forEach(product => {
    const count = categoryMap.get(product.category) || 0
    categoryMap.set(product.category, count + 1)
  })
  
  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name))
}