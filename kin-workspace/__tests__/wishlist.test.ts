import { PrismaClient } from '@prisma/client'
import { createUser } from '../app/lib/auth-utils'
import { addToWishlist, removeFromWishlist, getUserWishlist, isInWishlist } from '../app/lib/wishlist-utils'

const prisma = new PrismaClient()

describe('Wishlist Functionality', () => {
  let testUser: any

  beforeEach(async () => {
    await prisma.wishlistItem.deleteMany()
    await prisma.user.deleteMany()
    
    testUser = await createUser({
      email: 'wishlist@test.com',
      password: 'TestPass123',
      firstName: 'Wishlist',
      lastName: 'User'
    })
  })

  afterAll(async () => {
    await prisma.wishlistItem.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  test('should add product to wishlist', async () => {
    const productId = 'test-product-1'
    
    const result = await addToWishlist(testUser.id, productId)
    
    expect(result.success).toBe(true)
    expect(result.wishlistItem?.productId).toBe(productId)
    expect(result.wishlistItem?.userId).toBe(testUser.id)
  })

  test('should not add duplicate product to wishlist', async () => {
    const productId = 'test-product-2'
    
    // Add first time
    await addToWishlist(testUser.id, productId)
    
    // Try to add again
    const result = await addToWishlist(testUser.id, productId)
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('already in wishlist')
  })

  test('should remove product from wishlist', async () => {
    const productId = 'test-product-3'
    
    // Add to wishlist first
    await addToWishlist(testUser.id, productId)
    
    // Remove from wishlist
    const result = await removeFromWishlist(testUser.id, productId)
    
    expect(result.success).toBe(true)
  })

  test('should get user wishlist', async () => {
    const productIds = ['product-1', 'product-2', 'product-3']
    
    // Add multiple products to wishlist
    for (const productId of productIds) {
      await addToWishlist(testUser.id, productId)
    }
    
    const wishlist = await getUserWishlist(testUser.id)
    
    expect(wishlist).toHaveLength(3)
    expect(wishlist.map(item => item.productId)).toEqual(expect.arrayContaining(productIds))
  })

  test('should check if product is in wishlist', async () => {
    const productId = 'test-product-4'
    
    // Initially not in wishlist
    let inWishlist = await isInWishlist(testUser.id, productId)
    expect(inWishlist).toBe(false)
    
    // Add to wishlist
    await addToWishlist(testUser.id, productId)
    
    // Now should be in wishlist
    inWishlist = await isInWishlist(testUser.id, productId)
    expect(inWishlist).toBe(true)
  })

  test('should return empty wishlist for new user', async () => {
    const newUser = await createUser({
      email: 'newuser@test.com',
      password: 'TestPass123',
      firstName: 'New',
      lastName: 'User'
    })
    
    const wishlist = await getUserWishlist(newUser.id)
    
    expect(wishlist).toHaveLength(0)
  })
})