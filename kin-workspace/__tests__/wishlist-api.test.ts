import { NextRequest } from 'next/server'
import { GET as getWishlistHandler, POST as addToWishlistHandler, DELETE as removeFromWishlistHandler } from '../app/api/wishlist/route'
import { POST as loginHandler } from '../app/api/auth/login/route'
import { PrismaClient } from '@prisma/client'
import { createUser } from '../app/lib/auth-utils'

const prisma = new PrismaClient()

describe('Wishlist API', () => {
  let testUser: any
  let authToken: string

  beforeEach(async () => {
    await prisma.wishlistItem.deleteMany()
    await prisma.user.deleteMany()
    
    testUser = await createUser({
      email: 'wishlistapi@test.com',
      password: 'TestPass123',
      firstName: 'Wishlist',
      lastName: 'API'
    })

    // Get auth token
    const loginRequest = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: 'TestPass123'
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    const loginResponse = await loginHandler(loginRequest)
    const loginData = await loginResponse.json()
    authToken = loginData.token
  })

  afterAll(async () => {
    await prisma.wishlistItem.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  test('should add product to wishlist via API', async () => {
    const productId = 'api-test-product-1'

    const request = new NextRequest('http://localhost:3000/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })

    const response = await addToWishlistHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.wishlistItem.productId).toBe(productId)
  })

  test('should get user wishlist via API', async () => {
    const productIds = ['get-product-1', 'get-product-2']

    // Add products to wishlist
    for (const productId of productIds) {
      const addRequest = new NextRequest('http://localhost:3000/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      })
      await addToWishlistHandler(addRequest)
    }

    // Get wishlist
    const getRequest = new NextRequest('http://localhost:3000/api/wishlist', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    })

    const response = await getWishlistHandler(getRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.wishlist).toHaveLength(2)
    expect(data.wishlist.map((item: any) => item.productId)).toEqual(expect.arrayContaining(productIds))
  })

  test('should remove product from wishlist via API', async () => {
    const productId = 'remove-product-1'

    // Add to wishlist first
    const addRequest = new NextRequest('http://localhost:3000/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    await addToWishlistHandler(addRequest)

    // Remove from wishlist
    const removeRequest = new NextRequest('http://localhost:3000/api/wishlist', {
      method: 'DELETE',
      body: JSON.stringify({ productId }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })

    const response = await removeFromWishlistHandler(removeRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('removed')
  })

  test('should reject unauthorized requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/wishlist', {
      method: 'GET'
    })

    const response = await getWishlistHandler(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toContain('No token')
  })

  test('should handle duplicate product addition', async () => {
    const productId = 'duplicate-product'

    // Add first time
    const firstRequest = new NextRequest('http://localhost:3000/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    await addToWishlistHandler(firstRequest)

    // Try to add again
    const secondRequest = new NextRequest('http://localhost:3000/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })

    const response = await addToWishlistHandler(secondRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('already in wishlist')
  })
})