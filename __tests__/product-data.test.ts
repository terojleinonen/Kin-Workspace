import { products, getProductBySlug, getProductsByCategory, searchProducts, getCategories } from '../app/lib/product-data'

describe('Product Data', () => {
  describe('products array', () => {
    test('should contain products', () => {
      expect(Array.isArray(products)).toBe(true)
      expect(products.length).toBeGreaterThan(0)
    })

    test('should have valid product structure', () => {
      const product = products[0]
      expect(product).toHaveProperty('id')
      expect(product).toHaveProperty('name')
      expect(product).toHaveProperty('price')
      expect(product).toHaveProperty('image')
      expect(product).toHaveProperty('category')
      expect(product).toHaveProperty('slug')
      
      expect(typeof product.id).toBe('string')
      expect(typeof product.name).toBe('string')
      expect(typeof product.price).toBe('number')
      expect(typeof product.image).toBe('string')
      expect(typeof product.category).toBe('string')
      expect(typeof product.slug).toBe('string')
    })

    test('should have unique IDs', () => {
      const ids = products.map(p => p.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    test('should have unique slugs', () => {
      const slugs = products.map(p => p.slug)
      const uniqueSlugs = new Set(slugs)
      expect(uniqueSlugs.size).toBe(slugs.length)
    })

    test('should have positive prices', () => {
      products.forEach(product => {
        expect(product.price).toBeGreaterThan(0)
      })
    })
  })

  describe('getProductBySlug', () => {
    test('should find product by slug', () => {
      const testProduct = products[0]
      const foundProduct = getProductBySlug(testProduct.slug)
      
      expect(foundProduct).toBeDefined()
      expect(foundProduct?.id).toBe(testProduct.id)
      expect(foundProduct?.slug).toBe(testProduct.slug)
    })

    test('should return undefined for non-existent slug', () => {
      const foundProduct = getProductBySlug('non-existent-slug')
      expect(foundProduct).toBeUndefined()
    })

    test('should be case sensitive', () => {
      const testProduct = products[0]
      const foundProduct = getProductBySlug(testProduct.slug.toUpperCase())
      expect(foundProduct).toBeUndefined()
    })
  })

  describe('getProductsByCategory', () => {
    test('should filter products by category', () => {
      const categories = [...new Set(products.map(p => p.category))]
      const testCategory = categories[0]
      
      const filteredProducts = getProductsByCategory(testCategory)
      
      expect(Array.isArray(filteredProducts)).toBe(true)
      expect(filteredProducts.length).toBeGreaterThan(0)
      
      filteredProducts.forEach(product => {
        expect(product.category).toBe(testCategory)
      })
    })

    test('should return empty array for non-existent category', () => {
      const filteredProducts = getProductsByCategory('Non-existent Category')
      expect(filteredProducts).toEqual([])
    })

    test('should be case sensitive', () => {
      const categories = [...new Set(products.map(p => p.category))]
      const testCategory = categories[0]
      
      const filteredProducts = getProductsByCategory(testCategory.toLowerCase())
      expect(filteredProducts).toEqual([])
    })
  })

  describe('searchProducts', () => {
    test('should search products by name', () => {
      const testProduct = products[0]
      const searchTerm = testProduct.name.split(' ')[0] // First word of name
      
      const searchResults = searchProducts(searchTerm)
      
      expect(Array.isArray(searchResults)).toBe(true)
      expect(searchResults.length).toBeGreaterThan(0)
      
      const foundTestProduct = searchResults.find(p => p.id === testProduct.id)
      expect(foundTestProduct).toBeDefined()
    })

    test('should search products by category', () => {
      const testCategory = products[0].category
      const searchResults = searchProducts(testCategory)
      
      expect(searchResults.length).toBeGreaterThan(0)
      searchResults.forEach(product => {
        const searchableText = `${product.name} ${product.description || ''} ${product.category}`.toLowerCase()
        expect(searchableText).toContain(testCategory.toLowerCase())
      })
    })

    test('should be case insensitive', () => {
      const testProduct = products[0]
      const searchTerm = testProduct.name.split(' ')[0].toUpperCase()
      
      const searchResults = searchProducts(searchTerm)
      expect(searchResults.length).toBeGreaterThan(0)
    })

    test('should return empty array for no matches', () => {
      const searchResults = searchProducts('xyznomatchfound123')
      expect(searchResults).toEqual([])
    })

    test('should handle empty search term', () => {
      const searchResults = searchProducts('')
      expect(searchResults).toEqual(products)
    })

    test('should search in description if available', () => {
      const productWithDescription = products.find(p => p.description)
      if (productWithDescription) {
        const descriptionWord = productWithDescription.description!.split(' ')[0]
        const searchResults = searchProducts(descriptionWord)
        
        const foundProduct = searchResults.find(p => p.id === productWithDescription.id)
        expect(foundProduct).toBeDefined()
      }
    })
  })

  describe('getCategories', () => {
    test('should return all unique categories', () => {
      const categories = getCategories()
      
      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)
      
      // Check uniqueness
      const uniqueCategories = new Set(categories.map(c => c.name))
      expect(uniqueCategories.size).toBe(categories.length)
    })

    test('should include product count for each category', () => {
      const categories = getCategories()
      
      categories.forEach(category => {
        expect(category).toHaveProperty('name')
        expect(category).toHaveProperty('count')
        expect(typeof category.name).toBe('string')
        expect(typeof category.count).toBe('number')
        expect(category.count).toBeGreaterThan(0)
      })
    })

    test('should have correct product counts', () => {
      const categories = getCategories()
      
      categories.forEach(category => {
        const productsInCategory = products.filter(p => p.category === category.name)
        expect(category.count).toBe(productsInCategory.length)
      })
    })

    test('should be sorted by name', () => {
      const categories = getCategories()
      const sortedNames = categories.map(c => c.name).sort()
      const actualNames = categories.map(c => c.name)
      
      expect(actualNames).toEqual(sortedNames)
    })
  })
})