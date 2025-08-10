/**
 * Performance Monitoring System
 * Tracks and analyzes application performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface DatabaseQueryMetric {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
  rowCount?: number;
}

interface ApiRequestMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  userAgent?: string;
  ipAddress?: string;
}

interface PerformanceReport {
  timeRange: {
    start: number;
    end: number;
  };
  apiMetrics: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowestEndpoints: Array<{
      endpoint: string;
      averageTime: number;
      requestCount: number;
    }>;
  };
  databaseMetrics: {
    totalQueries: number;
    averageQueryTime: number;
    slowestQueries: Array<{
      query: string;
      averageTime: number;
      executionCount: number;
    }>;
  };
  systemMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    cacheHitRate: number;
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private dbQueries: DatabaseQueryMetric[] = [];
  private apiRequests: ApiRequestMetric[] = [];
  private maxMetricsHistory = 10000; // Keep last 10k metrics

  private constructor() {
    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags
    });

    this.enforceHistoryLimit();
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(
    query: string,
    duration: number,
    success: boolean,
    rowCount?: number
  ): void {
    this.dbQueries.push({
      query: this.sanitizeQuery(query),
      duration,
      timestamp: Date.now(),
      success,
      rowCount
    });

    this.enforceHistoryLimit();
  }

  /**
   * Record API request performance
   */
  recordApiRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    userAgent?: string,
    ipAddress?: string
  ): void {
    this.apiRequests.push({
      endpoint,
      method,
      statusCode,
      duration,
      timestamp: Date.now(),
      userAgent,
      ipAddress
    });

    this.enforceHistoryLimit();
  }

  /**
   * Get performance report for a time range
   */
  getPerformanceReport(startTime: number, endTime: number): PerformanceReport {
    const filteredApiRequests = this.apiRequests.filter(
      req => req.timestamp >= startTime && req.timestamp <= endTime
    );

    const filteredDbQueries = this.dbQueries.filter(
      query => query.timestamp >= startTime && query.timestamp <= endTime
    );

    return {
      timeRange: { start: startTime, end: endTime },
      apiMetrics: this.calculateApiMetrics(filteredApiRequests),
      databaseMetrics: this.calculateDatabaseMetrics(filteredDbQueries),
      systemMetrics: this.getSystemMetrics()
    };
  }

  /**
   * Get real-time performance metrics
   */
  getRealTimeMetrics(): {
    currentRequests: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: number;
  } {
    const lastMinute = Date.now() - 60 * 1000;
    const recentRequests = this.apiRequests.filter(req => req.timestamp >= lastMinute);

    const totalRequests = recentRequests.length;
    const averageResponseTime = totalRequests > 0 
      ? recentRequests.reduce((sum, req) => sum + req.duration, 0) / totalRequests 
      : 0;
    
    const errorRequests = recentRequests.filter(req => req.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    return {
      currentRequests: totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Get slow queries report
   */
  getSlowQueries(limit: number = 10, minDuration: number = 1000): DatabaseQueryMetric[] {
    return this.dbQueries
      .filter(query => query.duration >= minDuration)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get endpoint performance statistics
   */
  getEndpointStats(endpoint: string): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    statusCodeDistribution: Record<number, number>;
  } {
    const endpointRequests = this.apiRequests.filter(req => req.endpoint === endpoint);
    const totalRequests = endpointRequests.length;

    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        statusCodeDistribution: {}
      };
    }

    const averageResponseTime = endpointRequests.reduce((sum, req) => sum + req.duration, 0) / totalRequests;
    const errorRequests = endpointRequests.filter(req => req.statusCode >= 400).length;
    const errorRate = (errorRequests / totalRequests) * 100;

    const statusCodeDistribution: Record<number, number> = {};
    endpointRequests.forEach(req => {
      statusCodeDistribution[req.statusCode] = (statusCodeDistribution[req.statusCode] || 0) + 1;
    });

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      statusCodeDistribution
    };
  }

  /**
   * Performance middleware for API routes
   */
  createMiddleware() {
    return {
      before: (endpoint: string, method: string) => {
        return {
          startTime: Date.now(),
          endpoint,
          method
        };
      },

      after: (
        context: { startTime: number; endpoint: string; method: string },
        statusCode: number,
        userAgent?: string,
        ipAddress?: string
      ) => {
        const duration = Date.now() - context.startTime;
        this.recordApiRequest(
          context.endpoint,
          context.method,
          statusCode,
          duration,
          userAgent,
          ipAddress
        );
      }
    };
  }

  /**
   * Database query middleware
   */
  createDatabaseMiddleware() {
    return {
      before: () => {
        return { startTime: Date.now() };
      },

      after: (
        context: { startTime: number },
        query: string,
        success: boolean,
        rowCount?: number
      ) => {
        const duration = Date.now() - context.startTime;
        this.recordDatabaseQuery(query, duration, success, rowCount);
      }
    };
  }

  /**
   * Calculate API metrics
   */
  private calculateApiMetrics(requests: ApiRequestMetric[]) {
    const totalRequests = requests.length;
    const averageResponseTime = totalRequests > 0 
      ? requests.reduce((sum, req) => sum + req.duration, 0) / totalRequests 
      : 0;

    const errorRequests = requests.filter(req => req.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    // Calculate slowest endpoints
    const endpointStats = new Map<string, { totalTime: number; count: number }>();
    requests.forEach(req => {
      const existing = endpointStats.get(req.endpoint) || { totalTime: 0, count: 0 };
      endpointStats.set(req.endpoint, {
        totalTime: existing.totalTime + req.duration,
        count: existing.count + 1
      });
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: Math.round(stats.totalTime / stats.count),
        requestCount: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      slowestEndpoints
    };
  }

  /**
   * Calculate database metrics
   */
  private calculateDatabaseMetrics(queries: DatabaseQueryMetric[]) {
    const totalQueries = queries.length;
    const averageQueryTime = totalQueries > 0 
      ? queries.reduce((sum, query) => sum + query.duration, 0) / totalQueries 
      : 0;

    // Calculate slowest queries
    const queryStats = new Map<string, { totalTime: number; count: number }>();
    queries.forEach(query => {
      const existing = queryStats.get(query.query) || { totalTime: 0, count: 0 };
      queryStats.set(query.query, {
        totalTime: existing.totalTime + query.duration,
        count: existing.count + 1
      });
    });

    const slowestQueries = Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        averageTime: Math.round(stats.totalTime / stats.count),
        executionCount: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    return {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime),
      slowestQueries
    };
  }

  /**
   * Get system metrics
   */
  private getSystemMetrics() {
    return {
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: 0, // Would need additional implementation for CPU monitoring
      cacheHitRate: 0 // Would be provided by cache service
    };
  }

  /**
   * Get memory usage in MB
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return Math.round(usage.heapUsed / 1024 / 1024);
    }
    return 0;
  }

  /**
   * Sanitize SQL query for logging
   */
  private sanitizeQuery(query: string): string {
    // Remove sensitive data and normalize query
    return query
      .replace(/\$\d+/g, '?') // Replace parameter placeholders
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 200); // Limit length
  }

  /**
   * Enforce history limits to prevent memory leaks
   */
  private enforceHistoryLimit(): void {
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
    if (this.dbQueries.length > this.maxMetricsHistory) {
      this.dbQueries = this.dbQueries.slice(-this.maxMetricsHistory);
    }
    if (this.apiRequests.length > this.maxMetricsHistory) {
      this.apiRequests = this.apiRequests.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Clean up old metrics
   */
  private cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
    this.dbQueries = this.dbQueries.filter(query => query.timestamp > cutoff);
    this.apiRequests = this.apiRequests.filter(request => request.timestamp > cutoff);

    console.log('Performance metrics cleanup completed');
  }
}

/**
 * Performance decorator for functions
 */
export function measurePerformance(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        monitor.recordMetric(`${name}.${propertyKey}`, duration, { status: 'success' });
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        monitor.recordMetric(`${name}.${propertyKey}`, duration, { status: 'error' });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Database query performance wrapper
 */
export async function measureDatabaseQuery<T>(
  query: string,
  operation: () => Promise<T>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    // Estimate row count if result is an array
    const rowCount = Array.isArray(result) ? result.length : undefined;
    
    monitor.recordDatabaseQuery(query, duration, true, rowCount);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    monitor.recordDatabaseQuery(query, duration, false);
    throw error;
  }
}