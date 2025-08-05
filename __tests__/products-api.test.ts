import { NextRequest } from 'next/server'
import { GET as getProductsHandler } from '../app/api/products/route'
import { GET as getCategoriesHandler } from '../app/api/products/categories/route'
import { GET as getProductBySlugHandler } from '../app/api/products/[slug]/route'

describe('Products API', () => {
  test('should get all products', async () => {
    const request = new NextRequest('http://localhost:3000/api/products')
    
    const response = await getProductsHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.products)).toBe(true)
    expect(data.products.length).toBeGreaterThan(0)
    
    // Check product structure
    const product = data.products[0]
    expect(product).toHaveProperty('id')
    expect(product).toHaveProperty('name')
    expect(product).toHaveProperty('price')
    expect(product).toHaveProperty('category')
    expect(product).toHaveProperty('slug')
  })

  test('should filter products by category', async () => {
    const request = new NextRequest('http://localhost:3000/api/products?category=desks')
    
    const response = await getProductsHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.products)).toBe(true)
    
    // All products should be in the 'desks' category
    data.products.forEach((product: any) => {
      expect(product.category.toLowerCase()).toContain('desk')
    })
  })

  test('should get product categories', async () => {
    const request = new NextRequest('http://localhost:3000/api/products/categories')
    
    const response = await getCategoriesHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.categories)).toBe(true)
    expect(data.categories.length).toBeGreaterThan(0)
    
    // Check category structure
    const category = data.categories[0]
    expect(category).toHaveProperty('name')
    expect(category).toHaveProperty('count')
    expect(typeof category.count).toBe('number')
  })

  test('should get product by slug', async () => {
    // First get a product to test with
    const productsRequest = new NextRequest('http://localhost:3000/api/products')
    const productsResponse = await getProductsHandler(productsRequest)
    const productsData = await productsResponse.json()
    const testProduct = productsData.products[0]

    // Now test getting by slug
    const request = new NextRequest(`http://localhost:3000/api/products/${testProduct.slug}`)
    
    const response = await getProductBySlugHandler(request, { params: { slug: testProduct.slug } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.product).toBeDefined()
    expect(data.product.slug).toBe(testProduct.slug)
    expect(data.product.id).toBe(testProduct.id)
  })

  test('should return 404 for non-existent product slug', async () => {
    const request = new NextRequest('http://localhost:3000/api/products/non-existent-product')
    
    const response = await getProductBySlugHandler(request, { params: { slug: 'non-existent-product' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toContain('not found')
  })

  test('should handle search query', async () => {
    const request = new NextRequest('http://localhost:3000/api/products?search=desk')
    
    const response = await getProductsHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.products)).toBe(true)
    
    // Results should contain the search term
    data.products.forEach((product: any) => {
      const searchableText = `${product.name} ${product.description || ''} ${product.category}`.toLowerCase()
      expect(searchableText).toContain('desk')
    })
  })
})