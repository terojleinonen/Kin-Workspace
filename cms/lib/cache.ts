/**
 * Caching System
 * Provides in-memory and Redis-based caching for performance optimization
 */

import { PrismaClient } from '@prisma/client';

// Cache configuration
interface CacheConfig {
  defaultTTL: number; // Time to live in seconds
  maxMemoryItems: number;
  enableRedis: boolean;
  redisUrl?: string;
}

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  totalItems: number;
  memoryUsage: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  oldestItem: number;
  newestItem: number;
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache = new Map<string, CacheItem>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };

  private constructor(config: CacheConfig) {
    this.config = config;
    
    // Clean up expired items every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  static getInstance(config?: CacheConfig): CacheService {
    if (!CacheService.instance) {
      const defaultConfig: CacheConfig = {
        defaultTTL: 300, // 5 minutes
        maxMemoryItems: 1000,
        enableRedis: false,
        redisUrl: process.env.REDIS_URL
      };
      CacheService.instance = new CacheService(config || defaultConfig);
    }
    return CacheService.instance;
  }

  /**
   * Get item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem) {
      if (this.isExpired(memoryItem)) {
        this.memoryCache.delete(key);
        this.stats.misses++;
        return null;
      }
      
      memoryItem.hits++;
      this.stats.hits++;
      return memoryItem.data as T;
    }

    // TODO: Try Redis cache if enabled
    if (this.config.enableRedis) {
      // Redis implementation would go here
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set item in cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const cacheTTL = ttl || this.config.defaultTTL;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: cacheTTL * 1000, // Convert to milliseconds
      hits: 0
    };

    // Check memory cache size limit
    if (this.memoryCache.size >= this.config.maxMemoryItems) {
      this.evictLRU();
    }

    this.memoryCache.set(key, item);
    this.stats.sets++;

    // TODO: Set in Redis if enabled
    if (this.config.enableRedis) {
      // Redis implementation would go here
    }
  }

  /**
   * Delete item from cache
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    this.stats.deletes++;

    // TODO: Delete from Redis if enabled
    if (this.config.enableRedis) {
      // Redis implementation would go here
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    // TODO: Clear Redis if enabled
    if (this.config.enableRedis) {
      // Redis implementation would go here
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const items = Array.from(this.memoryCache.values());
    const totalHits = this.stats.hits;
    const totalMisses = this.stats.misses;
    const totalRequests = totalHits + totalMisses;
    
    return {
      totalItems: this.memoryCache.size,
      memoryUsage: this.calculateMemoryUsage(),
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      totalHits,
      totalMisses,
      oldestItem: items.length > 0 ? Math.min(...items.map(item => item.timestamp)) : 0,
      newestItem: items.length > 0 ? Math.max(...items.map(item => item.timestamp)) : 0
    };
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFunction();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];

    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  /**
   * Check if cache item is expired
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruHits = Infinity;
    let lruTimestamp = Infinity;

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.hits < lruHits || (item.hits === lruHits && item.timestamp < lruTimestamp)) {
        lruKey = key;
        lruHits = item.hits;
        lruTimestamp = item.timestamp;
      }
    }

    if (lruKey) {
      this.memoryCache.delete(lruKey);
    }
  }

  /**
   * Clean up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.memoryCache.delete(key);
    }

    console.log(`Cache cleanup: removed ${keysToDelete.length} expired items`);
  }

  /**
   * Calculate approximate memory usage
   */
  private calculateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, item] of this.memoryCache.entries()) {
      // Rough estimation of memory usage
      totalSize += key.length * 2; // String characters are 2 bytes each
      totalSize += JSON.stringify(item.data).length * 2;
      totalSize += 64; // Overhead for object structure
    }

    return totalSize;
  }
}

/**
 * Database Query Cache
 * Specialized caching for database queries
 */
export class DatabaseCache {
  private cache: CacheService;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.cache = CacheService.getInstance();
    this.prisma = prisma;
  }

  /**
   * Cache product queries
   */
  async getProducts(params: any): Promise<any> {
    const cacheKey = `products:${JSON.stringify(params)}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const { page = 1, limit = 20, category, featured, search, sortBy = 'updatedAt', sortOrder = 'desc' } = params;
      
      const where: any = { status: 'PUBLISHED' };
      
      if (featured !== undefined) where.featured = featured;
      if (category) {
        where.categories = {
          some: { category: { slug: category } }
        };
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const skip = (page - 1) * limit;

      const [products, totalCount] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            categories: {
              include: {
                category: {
                  select: { id: true, name: true, slug: true }
                }
              }
            },
            media: {
              include: {
                media: {
                  select: {
                    id: true,
                    filename: true,
                    altText: true,
                    folder: true,
                    width: true,
                    height: true
                  }
                }
              },
              orderBy: [
                { isPrimary: 'desc' },
                { sortOrder: 'asc' }
              ]
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        this.prisma.product.count({ where })
      ]);

      return { products, totalCount };
    }, 300); // Cache for 5 minutes
  }

  /**
   * Cache single product queries
   */
  async getProduct(id: string): Promise<any> {
    const cacheKey = `product:${id}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      return this.prisma.product.findFirst({
        where: {
          OR: [{ id }, { slug: id }],
          status: 'PUBLISHED'
        },
        include: {
          categories: {
            include: {
              category: {
                select: { id: true, name: true, slug: true, description: true }
              }
            }
          },
          media: {
            include: {
              media: {
                select: {
                  id: true,
                  filename: true,
                  originalName: true,
                  mimeType: true,
                  width: true,
                  height: true,
                  altText: true,
                  folder: true
                }
              }
            },
            orderBy: [
              { isPrimary: 'desc' },
              { sortOrder: 'asc' }
            ]
          },
          creator: {
            select: { name: true }
          }
        }
      });
    }, 600); // Cache for 10 minutes
  }

  /**
   * Cache category queries
   */
  async getCategories(params: any = {}): Promise<any> {
    const cacheKey = `categories:${JSON.stringify(params)}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const { includeProducts = false, includeEmpty = true, parentId } = params;
      
      const where: any = { isActive: true };
      if (parentId) {
        where.parentId = parentId;
      } else {
        where.parentId = null;
      }

      return this.prisma.category.findMany({
        where,
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              _count: {
                select: {
                  products: {
                    where: { product: { status: 'PUBLISHED' } }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              products: {
                where: { product: { status: 'PUBLISHED' } }
              }
            }
          },
          ...(includeProducts && {
            products: {
              where: { product: { status: 'PUBLISHED' } },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    comparePrice: true,
                    featured: true,
                    media: {
                      where: { isPrimary: true },
                      include: {
                        media: {
                          select: {
                            id: true,
                            filename: true,
                            altText: true,
                            folder: true
                          }
                        }
                      },
                      take: 1
                    }
                  }
                }
              },
              take: 10
            }
          })
        },
        orderBy: { sortOrder: 'asc' }
      });
    }, 900); // Cache for 15 minutes
  }

  /**
   * Invalidate product-related cache
   */
  async invalidateProductCache(productId?: string): Promise<void> {
    if (productId) {
      await this.cache.delete(`product:${productId}`);
    }
    
    // Invalidate all product list caches
    await this.cache.invalidatePattern('products:*');
    
    // Invalidate category caches that might include products
    await this.cache.invalidatePattern('categories:*');
  }

  /**
   * Invalidate category-related cache
   */
  async invalidateCategoryCache(categoryId?: string): Promise<void> {
    // Invalidate all category caches
    await this.cache.invalidatePattern('categories:*');
    
    // Invalidate product caches that might be filtered by category
    await this.cache.invalidatePattern('products:*');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }
}

/**
 * Response Cache Middleware
 * Caches API responses based on request parameters
 */
export function createResponseCache(ttl: number = 300) {
  const cache = CacheService.getInstance();

  return {
    async get(key: string) {
      return cache.get(key);
    },

    async set(key: string, data: any, customTTL?: number) {
      return cache.set(key, data, customTTL || ttl);
    },

    generateKey(request: Request): string {
      const url = new URL(request.url);
      const method = request.method;
      const pathname = url.pathname;
      const searchParams = url.searchParams.toString();
      
      return `response:${method}:${pathname}:${searchParams}`;
    }
  };
}

/**
 * Image Cache Utilities
 * Handles caching for processed images
 */
export class ImageCache {
  private cache: CacheService;

  constructor() {
    this.cache = CacheService.getInstance();
  }

  /**
   * Cache processed image metadata
   */
  async cacheImageMetadata(
    originalPath: string, 
    processedPath: string, 
    metadata: any
  ): Promise<void> {
    const cacheKey = `image:${originalPath}:${JSON.stringify(metadata)}`;
    await this.cache.set(cacheKey, {
      processedPath,
      metadata,
      createdAt: Date.now()
    }, 3600); // Cache for 1 hour
  }

  /**
   * Get cached image metadata
   */
  async getCachedImageMetadata(
    originalPath: string, 
    metadata: any
  ): Promise<{ processedPath: string; metadata: any } | null> {
    const cacheKey = `image:${originalPath}:${JSON.stringify(metadata)}`;
    return this.cache.get(cacheKey);
  }

  /**
   * Invalidate image cache
   */
  async invalidateImageCache(originalPath: string): Promise<void> {
    await this.cache.invalidatePattern(`image:${originalPath}:*`);
  }
}