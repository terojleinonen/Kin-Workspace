import { prisma } from './db'

export interface WishlistItem {
  id: string
  userId: string
  productId: string
  createdAt: string
}

export async function addToWishlist(userId: string, productId: string): Promise<{ success: boolean; wishlistItem?: WishlistItem; error?: string }> {
  try {
    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    })

    if (existing) {
      return { success: false, error: 'Product is already in wishlist' }
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId,
        productId
      }
    })

    return {
      success: true,
      wishlistItem: {
        ...wishlistItem,
        createdAt: wishlistItem.createdAt.toISOString()
      }
    }
  } catch (error) {
    console.error('Add to wishlist error:', error)
    return { success: false, error: 'Failed to add to wishlist' }
  }
}

export async function removeFromWishlist(userId: string, productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Remove from wishlist error:', error)
    return { success: false, error: 'Failed to remove from wishlist' }
  }
}

export async function getUserWishlist(userId: string): Promise<WishlistItem[]> {
  try {
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return wishlistItems.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString()
    }))
  } catch (error) {
    console.error('Get wishlist error:', error)
    return []
  }
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const item = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    })

    return !!item
  } catch (error) {
    console.error('Check wishlist error:', error)
    return false
  }
}

export async function getWishlistCount(userId: string): Promise<number> {
  try {
    return await prisma.wishlistItem.count({
      where: { userId }
    })
  } catch (error) {
    console.error('Get wishlist count error:', error)
    return 0
  }
}