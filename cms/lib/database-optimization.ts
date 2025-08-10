/**
 * Database Optimization Service
 * Handles database query optimization, indexing, and performance monitoring
 */

import { PrismaClient } from '@prisma/client';
import { PerformanceMonitor, measureDatabaseQuery } from './performance';
import { DatabaseCache } from './cache';

interface QueryOptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  estimatedImprovement: number;
  recommendations: string[];
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

interface DatabaseStats {
  totalQueries: number;
  slowQueries: number;
  averageQueryTime: number;
  cacheHitRate: number;
  connectionPoolUsage: number;
  tableStats: Array<{
    table: string;
    rowCount: number;
    size: string;
    indexCount: number;
  }>;
}

export class DatabaseOptimizationService {
  private prisma: PrismaClient;
  private cache: DatabaseCache;
  private performanceMonitor: PerformanceMonitor;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cache = new DatabaseCache(prisma);
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  /**
   * Optimize common product queries
   */
  async optimizeProductQueries() {
    const optimizations = [
      {
        name: 'Product listing with categories',
        original: `
          SELECT p.*, c.name as category_name 
          FROM products p 
          LEFT JOIN product_categories pc ON p.id = pc.product_id 
          LEFT JOIN categories c ON pc.category_id = c.id 
          WHERE p.status = 'PUBLISHED'
        `,
        optimized: `
          SELECT p.id, p.name, p.slug, p.price, p.status, 
                 array_agg(c.name) as categories
          FROM products p 
          LEFT JOIN product_categories pc ON p.id = pc.product_id 
          LEFT JOIN categories c ON pc.category_id = c.id 
          WHERE p.status = 'PUBLISHED'
          GROUP BY p.id, p.name, p.slug, p.price, p.status
        `,
        recommendations: [
          'Add composite index on (status, updated_at) for efficient filtering and sorting',
          'Consider materialized view for frequently accessed product-category combinations',
          'Use array aggregation to reduce result set size'
        ]
      }
    ];

    return optimizations;
  }

  /**
   * Generate index recommendations based on query patterns
   */
  async generateIndexRecommendations(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    // Analyze slow queries to identify missing indexes
    const slowQueries = this.performanceMonitor.getSlowQueries(20, 500);
    
    // Common patterns that benefit from indexes
    const indexPatterns = [
      {
        table: 'products',
        columns: ['status', 'updated_at'],
        type: 'btree' as const,
        reason: 'Frequently filtered by status and sorted by updated_at',
        estimatedImpact: 'high' as const
      },
      {
        table: 'products',
        columns: ['featured', 'status'],
        type: 'btree' as const,
        reason: 'Common filter combination for featured products',
        estimatedImpact: 'medium' as const
      },
      {
        table: 'product_categories',
        columns: ['product_id', 'category_id'],
        type: 'btree' as const,
        reason: 'Junction table for many-to-many relationship',
        estimatedImpact: 'high' as const
      },
      {
        table: 'media',
        columns: ['folder', 'created_at'],
        type: 'btree' as const,
        reason: 'Media browsing by folder and date',
        estimatedImpact: 'medium' as const
      },
      {
        table: 'pages',
        columns: ['status', 'published_at'],
        type: 'btree' as const,
        reason: 'Published pages sorted by publication date',
        estimatedImpact: 'medium' as const
      },
      {
        table: 'content_revisions',
        columns: ['content_type', 'content_id', 'created_at'],
        type: 'btree' as const,
        reason: 'Revision history queries',
        estimatedImpact: 'low' as const
      }
    ];

    recommendations.push(...indexPatterns);

    // Full-text search indexes
    recommendations.push({
      table: 'products',
      columns: ['name', 'description'],
      type: 'gin',
      reason: 'Full-text search on product content',
      estimatedImpact: 'high'
    });

    return recommendations;
  }

  /**
   * Optimize database queries with caching
   */
  async optimizedProductQuery(params: {
    page?: number;
    limit?: number;
    category?: string;
    featured?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return measureDatabaseQuery(
      'optimized_product_query',
      async () => {
        return this.cache.getProducts(params);
      }
    );
  }

  /**
   * Optimized single product query
   */
  async optimizedProductByIdQuery(id: string) {
    return measureDatabaseQuery(
      'optimized_product_by_id_query',
      async () => {
        return this.cache.getProduct(id);
      }
    );
  }

  /**
   * Optimized category query
   */
  async optimizedCategoryQuery(params: {
    includeProducts?: boolean;
    includeEmpty?: boolean;
    parentId?: string;
  } = {}) {
    return measureDatabaseQuery(
      'optimized_category_query',
      async () => {
        return this.cache.getCategories(params);
      }
    );
  }

  /**
   * Batch operations for better performance
   */
  async batchUpdateProducts(updates: Array<{ id: string; data: any }>) {
    return measureDatabaseQuery(
      'batch_update_products',
      async () => {
        // Use transaction for batch operations
        return this.prisma.$transaction(
          updates.map(update => 
            this.prisma.product.update({
              where: { id: update.id },
              data: update.data
            })
          )
        );
      }
    );
  }

  /**
   * Efficient bulk insert for products
   */
  async bulkInsertProducts(products: any[]) {
    return measureDatabaseQuery(
      'bulk_insert_products',
      async () => {
        // Use createMany for efficient bulk insert
        return this.prisma.product.createMany({
          data: products,
          skipDuplicates: true
        });
      }
    );
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    const performanceReport = this.performanceMonitor.getPerformanceReport(
      Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
      Date.now()
    );

    // Get table statistics (simplified - would need raw SQL for detailed stats)
    const tableStats = await Promise.all([
      this.getTableStats('products'),
      this.getTableStats('pages'),
      this.getTableStats('media'),
      this.getTableStats('categories'),
      this.getTableStats('users')
    ]);

    return {
      totalQueries: performanceReport.databaseMetrics.totalQueries,
      slowQueries: performanceReport.databaseMetrics.slowestQueries.length,
      averageQueryTime: performanceReport.databaseMetrics.averageQueryTime,
      cacheHitRate: this.cache.getCacheStats().hitRate,
      connectionPoolUsage: 0, // Would need connection pool monitoring
      tableStats: tableStats.filter(Boolean)
    };
  }

  /**
   * Analyze query performance
   */
  async analyzeQueryPerformance(query: string): Promise<{
    executionTime: number;
    rowsAffected: number;
    recommendations: string[];
  }> {
    const startTime = Date.now();
    
    try {
      // Execute query and measure performance
      const result = await this.prisma.$queryRawUnsafe(query);
      const executionTime = Date.now() - startTime;
      
      const recommendations = this.generateQueryRecommendations(query, executionTime);
      
      return {
        executionTime,
        rowsAffected: Array.isArray(result) ? result.length : 1,
        recommendations
      };
    } catch (error) {
      throw new Error(`Query analysis failed: ${error}`);
    }
  }

  /**
   * Connection pool optimization
   */
  optimizeConnectionPool() {
    return {
      recommendations: [
        'Set connection pool size based on concurrent users (typically 10-20 connections)',
        'Configure connection timeout to prevent hanging connections',
        'Use connection pooling middleware for better resource management',
        'Monitor connection pool usage and adjust based on load patterns',
        'Implement connection retry logic for transient failures'
      ],
      currentConfig: {
        // These would come from Prisma configuration
        maxConnections: 10,
        connectionTimeout: 30000,
        idleTimeout: 600000
      }
    };
  }

  /**
   * Database maintenance recommendations
   */
  async getMaintenanceRecommendations(): Promise<{
    vacuum: boolean;
    reindex: boolean;
    analyze: boolean;
    recommendations: string[];
  }> {
    const stats = await this.getDatabaseStats();
    const recommendations: string[] = [];
    
    let needsVacuum = false;
    let needsReindex = false;
    let needsAnalyze = false;

    // Check if database needs maintenance based on stats
    if (stats.averageQueryTime > 1000) {
      needsAnalyze = true;
      recommendations.push('Run ANALYZE to update query planner statistics');
    }

    if (stats.slowQueries > stats.totalQueries * 0.1) {
      needsReindex = true;
      recommendations.push('Consider rebuilding indexes for better performance');
    }

    // General maintenance recommendations
    recommendations.push(
      'Schedule regular VACUUM operations to reclaim storage',
      'Monitor table bloat and run VACUUM FULL if necessary',
      'Update table statistics regularly with ANALYZE',
      'Consider partitioning large tables for better performance'
    );

    return {
      vacuum: needsVacuum,
      reindex: needsReindex,
      analyze: needsAnalyze,
      recommendations
    };
  }

  /**
   * Cache invalidation strategies
   */
  async invalidateRelatedCache(operation: 'product' | 'category' | 'page', id?: string) {
    switch (operation) {
      case 'product':
        await this.cache.invalidateProductCache(id);
        break;
      case 'category':
        await this.cache.invalidateCategoryCache(id);
        break;
      case 'page':
        // Implement page cache invalidation
        break;
    }
  }

  /**
   * Get table statistics
   */
  private async getTableStats(tableName: string) {
    try {
      // This is a simplified version - in production, you'd use raw SQL
      // to get detailed table statistics from pg_stat_user_tables
      let count = 0;
      
      switch (tableName) {
        case 'products':
          count = await this.prisma.product.count();
          break;
        case 'pages':
          count = await this.prisma.page.count();
          break;
        case 'media':
          count = await this.prisma.media.count();
          break;
        case 'categories':
          count = await this.prisma.category.count();
          break;
        case 'users':
          count = await this.prisma.user.count();
          break;
      }

      return {
        table: tableName,
        rowCount: count,
        size: 'N/A', // Would need raw SQL to get actual size
        indexCount: 0 // Would need raw SQL to get index count
      };
    } catch (error) {
      console.error(`Failed to get stats for table ${tableName}:`, error);
      return null;
    }
  }

  /**
   * Generate query optimization recommendations
   */
  private generateQueryRecommendations(query: string, executionTime: number): string[] {
    const recommendations: string[] = [];
    
    if (executionTime > 1000) {
      recommendations.push('Query execution time is high - consider optimization');
    }

    if (query.toLowerCase().includes('select *')) {
      recommendations.push('Avoid SELECT * - specify only needed columns');
    }

    if (query.toLowerCase().includes('like %')) {
      recommendations.push('Leading wildcard LIKE queries are slow - consider full-text search');
    }

    if (!query.toLowerCase().includes('limit')) {
      recommendations.push('Add LIMIT clause to prevent large result sets');
    }

    if (query.toLowerCase().includes('order by') && !query.toLowerCase().includes('index')) {
      recommendations.push('Ensure ORDER BY columns are indexed');
    }

    return recommendations;
  }
}