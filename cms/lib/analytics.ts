/**
 * Analytics and Reporting System
 * Handles data collection, analysis, and report generation
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DashboardMetrics {
  totalProducts: number;
  totalPages: number;
  totalMedia: number;
  totalUsers: number;
  publishedContent: number;
  draftContent: number;
  recentActivity: number;
  storageUsed: number;
}

export interface ContentPerformance {
  id: string;
  title: string;
  type: 'product' | 'page';
  status: string;
  views: number;
  lastViewed: Date | null;
  createdAt: Date;
  creator: string;
}

export interface InventoryAlert {
  id: string;
  productName: string;
  currentStock: number;
  threshold: number;
  status: 'low' | 'out_of_stock' | 'overstocked';
  lastUpdated: Date;
}

export interface ActivityLog {
  id: string;
  action: string;
  contentType: string;
  contentId: string;
  contentTitle: string;
  userId: string;
  userName: string;
  timestamp: Date;
  details?: any;
}

export interface AnalyticsTimeframe {
  period: '7d' | '30d' | '90d' | '1y';
  startDate: Date;
  endDate: Date;
}

export interface ReportData {
  metrics: DashboardMetrics;
  contentPerformance: ContentPerformance[];
  inventoryAlerts: InventoryAlert[];
  recentActivity: ActivityLog[];
  trends: {
    contentCreation: Array<{ date: string; count: number }>;
    userActivity: Array<{ date: string; count: number }>;
    storageGrowth: Array<{ date: string; size: number }>;
  };
}

export class AnalyticsService {
  /**
   * Get dashboard metrics overview
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const [
        totalProducts,
        totalPages,
        totalMedia,
        totalUsers,
        publishedProducts,
        publishedPages,
        draftProducts,
        draftPages,
        recentProducts,
        recentPages,
        mediaFiles
      ] = await Promise.all([
        prisma.product.count(),
        prisma.page.count(),
        prisma.media.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.product.count({ where: { status: 'PUBLISHED' } }),
        prisma.page.count({ where: { status: 'PUBLISHED' } }),
        prisma.product.count({ where: { status: 'DRAFT' } }),
        prisma.page.count({ where: { status: 'DRAFT' } }),
        prisma.product.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        }),
        prisma.page.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        }),
        prisma.media.findMany({
          select: { fileSize: true }
        })
      ]);

      // Calculate storage used (in bytes)
      const storageUsed = mediaFiles.reduce((total, file) => total + file.fileSize, 0);

      return {
        totalProducts,
        totalPages,
        totalMedia,
        totalUsers,
        publishedContent: publishedProducts + publishedPages,
        draftContent: draftProducts + draftPages,
        recentActivity: recentProducts + recentPages,
        storageUsed
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw new Error('Failed to fetch dashboard metrics');
    }
  }

  /**
   * Get content performance data
   */
  static async getContentPerformance(
    limit: number = 10,
    timeframe: AnalyticsTimeframe
  ): Promise<ContentPerformance[]> {
    try {
      const { startDate, endDate } = timeframe;

      // Get products with performance data
      const products = await prisma.product.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          creator: {
            select: { name: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      });

      // Get pages with performance data
      const pages = await prisma.page.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          creator: {
            select: { name: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      });

      const performance: ContentPerformance[] = [];

      // Add products to performance data
      products.forEach(product => {
        performance.push({
          id: product.id,
          title: product.name,
          type: 'product',
          status: product.status,
          views: Math.floor(Math.random() * 1000), // Mock data - replace with real analytics
          lastViewed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          createdAt: product.createdAt,
          creator: product.creator.name
        });
      });

      // Add pages to performance data
      pages.forEach(page => {
        performance.push({
          id: page.id,
          title: page.title,
          type: 'page',
          status: page.status,
          views: Math.floor(Math.random() * 500), // Mock data - replace with real analytics
          lastViewed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          createdAt: page.createdAt,
          creator: page.creator.name
        });
      });

      // Sort by views descending
      return performance
        .sort((a, b) => b.views - a.views)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting content performance:', error);
      throw new Error('Failed to fetch content performance data');
    }
  }

  /**
   * Get inventory alerts
   */
  static async getInventoryAlerts(): Promise<InventoryAlert[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { inventoryQuantity: { lte: 10 } }, // Low stock threshold
            { inventoryQuantity: { equals: 0 } } // Out of stock
          ]
        },
        orderBy: { inventoryQuantity: 'asc' }
      });

      return products.map(product => ({
        id: product.id,
        productName: product.name,
        currentStock: product.inventoryQuantity,
        threshold: 10, // Default threshold
        status: product.inventoryQuantity === 0 
          ? 'out_of_stock' as const
          : product.inventoryQuantity <= 5 
          ? 'low' as const
          : 'overstocked' as const,
        lastUpdated: product.updatedAt
      }));

    } catch (error) {
      console.error('Error getting inventory alerts:', error);
      throw new Error('Failed to fetch inventory alerts');
    }
  }

  /**
   * Get recent activity log
   */
  static async getRecentActivity(limit: number = 20): Promise<ActivityLog[]> {
    try {
      // Get recent content revisions as activity
      const revisions = await prisma.contentRevision.findMany({
        include: {
          creator: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      const activities: ActivityLog[] = [];

      for (const revision of revisions) {
        let contentTitle = 'Unknown';
        
        // Get content title based on type
        if (revision.contentType === 'product') {
          const product = await prisma.product.findUnique({
            where: { id: revision.contentId },
            select: { name: true }
          });
          contentTitle = product?.name || 'Unknown Product';
        } else if (revision.contentType === 'page') {
          const page = await prisma.page.findUnique({
            where: { id: revision.contentId },
            select: { title: true }
          });
          contentTitle = page?.title || 'Unknown Page';
        }

        activities.push({
          id: revision.id,
          action: this.getActionFromRevisionData(revision.revisionData),
          contentType: revision.contentType,
          contentId: revision.contentId,
          contentTitle,
          userId: revision.createdBy,
          userName: revision.creator.name,
          timestamp: revision.createdAt,
          details: revision.revisionData
        });
      }

      return activities;

    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw new Error('Failed to fetch recent activity');
    }
  }

  /**
   * Get content creation trends
   */
  static async getContentTrends(timeframe: AnalyticsTimeframe): Promise<{
    contentCreation: Array<{ date: string; count: number }>;
    userActivity: Array<{ date: string; count: number }>;
  }> {
    try {
      const { startDate, endDate } = timeframe;
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const contentCreation: Array<{ date: string; count: number }> = [];
      const userActivity: Array<{ date: string; count: number }> = [];

      // Generate daily data points
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];

        // Count content created on this day
        const [productCount, pageCount, activityCount] = await Promise.all([
          prisma.product.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate
              }
            }
          }),
          prisma.page.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate
              }
            }
          }),
          prisma.contentRevision.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate
              }
            }
          })
        ]);

        contentCreation.push({
          date: dateStr,
          count: productCount + pageCount
        });

        userActivity.push({
          date: dateStr,
          count: activityCount
        });
      }

      return {
        contentCreation,
        userActivity
      };

    } catch (error) {
      console.error('Error getting content trends:', error);
      throw new Error('Failed to fetch content trends');
    }
  }

  /**
   * Get storage growth trends
   */
  static async getStorageGrowth(timeframe: AnalyticsTimeframe): Promise<Array<{ date: string; size: number }>> {
    try {
      const { startDate, endDate } = timeframe;
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const storageGrowth: Array<{ date: string; size: number }> = [];
      let cumulativeSize = 0;

      // Get all media files ordered by creation date
      const mediaFiles = await prisma.media.findMany({
        where: {
          createdAt: {
            lte: endDate
          }
        },
        select: {
          fileSize: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      });

      // Calculate cumulative storage for each day
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];

        // Add files created on this day
        const dayFiles = mediaFiles.filter(file => 
          file.createdAt >= date && file.createdAt < nextDate
        );
        
        const daySize = dayFiles.reduce((sum, file) => sum + file.fileSize, 0);
        cumulativeSize += daySize;

        storageGrowth.push({
          date: dateStr,
          size: cumulativeSize
        });
      }

      return storageGrowth;

    } catch (error) {
      console.error('Error getting storage growth:', error);
      throw new Error('Failed to fetch storage growth data');
    }
  }

  /**
   * Generate comprehensive report
   */
  static async generateReport(timeframe: AnalyticsTimeframe): Promise<ReportData> {
    try {
      const [
        metrics,
        contentPerformance,
        inventoryAlerts,
        recentActivity,
        trends,
        storageGrowth
      ] = await Promise.all([
        this.getDashboardMetrics(),
        this.getContentPerformance(20, timeframe),
        this.getInventoryAlerts(),
        this.getRecentActivity(50),
        this.getContentTrends(timeframe),
        this.getStorageGrowth(timeframe)
      ]);

      return {
        metrics,
        contentPerformance,
        inventoryAlerts,
        recentActivity,
        trends: {
          ...trends,
          storageGrowth
        }
      };

    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate analytics report');
    }
  }

  /**
   * Export report data to CSV format
   */
  static async exportToCSV(reportData: ReportData): Promise<string> {
    try {
      let csv = '';

      // Metrics section
      csv += 'DASHBOARD METRICS\n';
      csv += 'Metric,Value\n';
      csv += `Total Products,${reportData.metrics.totalProducts}\n`;
      csv += `Total Pages,${reportData.metrics.totalPages}\n`;
      csv += `Total Media,${reportData.metrics.totalMedia}\n`;
      csv += `Total Users,${reportData.metrics.totalUsers}\n`;
      csv += `Published Content,${reportData.metrics.publishedContent}\n`;
      csv += `Draft Content,${reportData.metrics.draftContent}\n`;
      csv += `Recent Activity,${reportData.metrics.recentActivity}\n`;
      csv += `Storage Used (bytes),${reportData.metrics.storageUsed}\n\n`;

      // Content performance section
      csv += 'CONTENT PERFORMANCE\n';
      csv += 'Title,Type,Status,Views,Creator,Created At\n';
      reportData.contentPerformance.forEach(item => {
        csv += `"${item.title}",${item.type},${item.status},${item.views},"${item.creator}",${item.createdAt.toISOString()}\n`;
      });
      csv += '\n';

      // Inventory alerts section
      csv += 'INVENTORY ALERTS\n';
      csv += 'Product Name,Current Stock,Threshold,Status,Last Updated\n';
      reportData.inventoryAlerts.forEach(alert => {
        csv += `"${alert.productName}",${alert.currentStock},${alert.threshold},${alert.status},${alert.lastUpdated.toISOString()}\n`;
      });
      csv += '\n';

      // Recent activity section
      csv += 'RECENT ACTIVITY\n';
      csv += 'Action,Content Type,Content Title,User,Timestamp\n';
      reportData.recentActivity.forEach(activity => {
        csv += `"${activity.action}",${activity.contentType},"${activity.contentTitle}","${activity.userName}",${activity.timestamp.toISOString()}\n`;
      });

      return csv;

    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export report to CSV');
    }
  }

  /**
   * Helper method to determine action from revision data
   */
  private static getActionFromRevisionData(revisionData: any): string {
    // Check if this is a workflow log
    if (revisionData.action) {
      return revisionData.action;
    }

    // Determine action based on data changes
    if (revisionData.status) {
      return `Status changed to ${revisionData.status}`;
    }

    return 'Content updated';
  }

  /**
   * Get analytics timeframe helper
   */
  static getTimeframe(period: '7d' | '30d' | '90d' | '1y'): AnalyticsTimeframe {
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      period,
      startDate,
      endDate
    };
  }
}