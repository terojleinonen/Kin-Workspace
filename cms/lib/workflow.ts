/**
 * Content Workflow Management System
 * Handles content status transitions, approvals, and scheduling
 */

import { PrismaClient, ProductStatus, PageStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export type ContentType = 'product' | 'page';
export type WorkflowStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface WorkflowTransition {
  from: WorkflowStatus;
  to: WorkflowStatus;
  requiredRole: UserRole;
  requiresApproval?: boolean;
}

export interface WorkflowAction {
  id: string;
  contentType: ContentType;
  contentId: string;
  action: 'submit_for_review' | 'approve' | 'reject' | 'publish' | 'archive' | 'schedule';
  userId: string;
  comment?: string;
  scheduledFor?: Date;
}

export interface ContentWorkflowData {
  id: string;
  title: string;
  status: WorkflowStatus;
  contentType: ContentType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledFor?: Date;
  creator: {
    name: string;
    email: string;
  };
}

// Workflow transition rules
const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // Draft transitions
  { from: 'DRAFT', to: 'REVIEW', requiredRole: 'EDITOR' },
  { from: 'DRAFT', to: 'PUBLISHED', requiredRole: 'ADMIN' },
  { from: 'DRAFT', to: 'ARCHIVED', requiredRole: 'EDITOR' },
  
  // Review transitions
  { from: 'REVIEW', to: 'DRAFT', requiredRole: 'EDITOR' },
  { from: 'REVIEW', to: 'PUBLISHED', requiredRole: 'ADMIN', requiresApproval: true },
  { from: 'REVIEW', to: 'ARCHIVED', requiredRole: 'ADMIN' },
  
  // Published transitions
  { from: 'PUBLISHED', to: 'DRAFT', requiredRole: 'ADMIN' },
  { from: 'PUBLISHED', to: 'ARCHIVED', requiredRole: 'ADMIN' },
  
  // Archived transitions
  { from: 'ARCHIVED', to: 'DRAFT', requiredRole: 'ADMIN' },
  { from: 'ARCHIVED', to: 'PUBLISHED', requiredRole: 'ADMIN' }
];\n\nexport class WorkflowService {\n  /**\n   * Check if a workflow transition is allowed\n   */\n  static canTransition(\n    from: WorkflowStatus,\n    to: WorkflowStatus,\n    userRole: UserRole\n  ): boolean {\n    const transition = WORKFLOW_TRANSITIONS.find(\n      t => t.from === from && t.to === to\n    );\n    \n    if (!transition) return false;\n    \n    // Check role hierarchy: ADMIN > EDITOR > VIEWER\n    const roleHierarchy = { VIEWER: 0, EDITOR: 1, ADMIN: 2 };\n    return roleHierarchy[userRole] >= roleHierarchy[transition.requiredRole];\n  }\n\n  /**\n   * Get available transitions for current status and user role\n   */\n  static getAvailableTransitions(\n    currentStatus: WorkflowStatus,\n    userRole: UserRole\n  ): WorkflowTransition[] {\n    return WORKFLOW_TRANSITIONS.filter(\n      t => t.from === currentStatus && this.canTransition(currentStatus, t.to, userRole)\n    );\n  }\n\n  /**\n   * Execute a workflow action\n   */\n  static async executeWorkflowAction(action: WorkflowAction): Promise<boolean> {\n    try {\n      const { contentType, contentId, action: actionType, userId, comment, scheduledFor } = action;\n      \n      // Get current content and user\n      const [content, user] = await Promise.all([\n        this.getContent(contentType, contentId),\n        prisma.user.findUnique({ where: { id: userId } })\n      ]);\n      \n      if (!content || !user) {\n        throw new Error('Content or user not found');\n      }\n      \n      const currentStatus = content.status as WorkflowStatus;\n      let newStatus: WorkflowStatus;\n      \n      // Determine new status based on action\n      switch (actionType) {\n        case 'submit_for_review':\n          newStatus = 'REVIEW';\n          break;\n        case 'approve':\n        case 'publish':\n          newStatus = 'PUBLISHED';\n          break;\n        case 'reject':\n          newStatus = 'DRAFT';\n          break;\n        case 'archive':\n          newStatus = 'ARCHIVED';\n          break;\n        case 'schedule':\n          newStatus = 'REVIEW'; // Will be published later\n          break;\n        default:\n          throw new Error(`Unknown action: ${actionType}`);\n      }\n      \n      // Check if transition is allowed\n      if (!this.canTransition(currentStatus, newStatus, user.role)) {\n        throw new Error(`Transition from ${currentStatus} to ${newStatus} not allowed for role ${user.role}`);\n      }\n      \n      // Create revision before updating\n      await this.createRevision(contentType, contentId, content, userId);\n      \n      // Update content status\n      await this.updateContentStatus(\n        contentType,\n        contentId,\n        newStatus,\n        actionType === 'publish' ? new Date() : undefined,\n        scheduledFor\n      );\n      \n      // Log workflow action\n      await this.logWorkflowAction({\n        contentType,\n        contentId,\n        action: actionType,\n        fromStatus: currentStatus,\n        toStatus: newStatus,\n        userId,\n        comment\n      });\n      \n      return true;\n    } catch (error) {\n      console.error('Workflow action failed:', error);\n      return false;\n    }\n  }\n\n  /**\n   * Get content by type and ID\n   */\n  private static async getContent(contentType: ContentType, contentId: string) {\n    switch (contentType) {\n      case 'product':\n        return await prisma.product.findUnique({\n          where: { id: contentId },\n          include: { creator: true }\n        });\n      case 'page':\n        return await prisma.page.findUnique({\n          where: { id: contentId },\n          include: { creator: true }\n        });\n      default:\n        return null;\n    }\n  }\n\n  /**\n   * Update content status\n   */\n  private static async updateContentStatus(\n    contentType: ContentType,\n    contentId: string,\n    status: WorkflowStatus,\n    publishedAt?: Date,\n    scheduledFor?: Date\n  ) {\n    const updateData: any = {\n      status,\n      updatedAt: new Date()\n    };\n    \n    if (publishedAt) {\n      updateData.publishedAt = publishedAt;\n    }\n    \n    switch (contentType) {\n      case 'product':\n        await prisma.product.update({\n          where: { id: contentId },\n          data: { ...updateData, status: status as ProductStatus }\n        });\n        break;\n      case 'page':\n        await prisma.page.update({\n          where: { id: contentId },\n          data: { ...updateData, status: status as PageStatus }\n        });\n        break;\n    }\n    \n    // Handle scheduled publishing\n    if (scheduledFor && status === 'REVIEW') {\n      await this.schedulePublication(contentType, contentId, scheduledFor);\n    }\n  }\n\n  /**\n   * Create content revision\n   */\n  private static async createRevision(\n    contentType: ContentType,\n    contentId: string,\n    content: any,\n    userId: string\n  ) {\n    // Remove relations and metadata for clean revision data\n    const { creator, createdAt, updatedAt, ...revisionData } = content;\n    \n    await prisma.contentRevision.create({\n      data: {\n        contentType,\n        contentId,\n        revisionData,\n        createdBy: userId\n      }\n    });\n  }\n\n  /**\n   * Log workflow action\n   */\n  private static async logWorkflowAction(data: {\n    contentType: ContentType;\n    contentId: string;\n    action: string;\n    fromStatus: WorkflowStatus;\n    toStatus: WorkflowStatus;\n    userId: string;\n    comment?: string;\n  }) {\n    // In a real implementation, you might want a separate workflow_logs table\n    // For now, we'll use the content revision system to track workflow changes\n    await prisma.contentRevision.create({\n      data: {\n        contentType: 'workflow_log',\n        contentId: data.contentId,\n        revisionData: {\n          action: data.action,\n          fromStatus: data.fromStatus,\n          toStatus: data.toStatus,\n          comment: data.comment,\n          timestamp: new Date().toISOString()\n        },\n        createdBy: data.userId\n      }\n    });\n  }\n\n  /**\n   * Schedule content for publication\n   */\n  private static async schedulePublication(\n    contentType: ContentType,\n    contentId: string,\n    scheduledFor: Date\n  ) {\n    // In a real implementation, you would use a job queue like Bull or Agenda\n    // For now, we'll store the schedule and check it periodically\n    console.log(`Scheduled ${contentType} ${contentId} for publication at ${scheduledFor}`);\n    \n    // You could implement this with a cron job or background task\n    // that periodically checks for scheduled content and publishes it\n  }\n\n  /**\n   * Get content pending review\n   */\n  static async getContentPendingReview(userId?: string): Promise<ContentWorkflowData[]> {\n    const [products, pages] = await Promise.all([\n      prisma.product.findMany({\n        where: {\n          status: 'DRAFT',\n          ...(userId && { createdBy: userId })\n        },\n        include: { creator: true },\n        orderBy: { updatedAt: 'desc' }\n      }),\n      prisma.page.findMany({\n        where: {\n          status: 'REVIEW',\n          ...(userId && { createdBy: userId })\n        },\n        include: { creator: true },\n        orderBy: { updatedAt: 'desc' }\n      })\n    ]);\n    \n    const result: ContentWorkflowData[] = [];\n    \n    // Add products\n    products.forEach(product => {\n      result.push({\n        id: product.id,\n        title: product.name,\n        status: product.status as WorkflowStatus,\n        contentType: 'product',\n        createdBy: product.createdBy,\n        createdAt: product.createdAt,\n        updatedAt: product.updatedAt,\n        creator: {\n          name: product.creator.name,\n          email: product.creator.email\n        }\n      });\n    });\n    \n    // Add pages\n    pages.forEach(page => {\n      result.push({\n        id: page.id,\n        title: page.title,\n        status: page.status as WorkflowStatus,\n        contentType: 'page',\n        createdBy: page.createdBy,\n        createdAt: page.createdAt,\n        updatedAt: page.updatedAt,\n        publishedAt: page.publishedAt || undefined,\n        creator: {\n          name: page.creator.name,\n          email: page.creator.email\n        }\n      });\n    });\n    \n    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());\n  }\n\n  /**\n   * Get content revisions\n   */\n  static async getContentRevisions(\n    contentType: ContentType,\n    contentId: string\n  ): Promise<any[]> {\n    const revisions = await prisma.contentRevision.findMany({\n      where: {\n        contentType,\n        contentId\n      },\n      include: {\n        creator: {\n          select: {\n            name: true,\n            email: true\n          }\n        }\n      },\n      orderBy: { createdAt: 'desc' }\n    });\n    \n    return revisions;\n  }\n\n  /**\n   * Get workflow statistics\n   */\n  static async getWorkflowStats(): Promise<{\n    totalContent: number;\n    draftContent: number;\n    reviewContent: number;\n    publishedContent: number;\n    archivedContent: number;\n  }> {\n    const [productStats, pageStats] = await Promise.all([\n      prisma.product.groupBy({\n        by: ['status'],\n        _count: { status: true }\n      }),\n      prisma.page.groupBy({\n        by: ['status'],\n        _count: { status: true }\n      })\n    ]);\n    \n    const stats = {\n      totalContent: 0,\n      draftContent: 0,\n      reviewContent: 0,\n      publishedContent: 0,\n      archivedContent: 0\n    };\n    \n    // Aggregate product stats\n    productStats.forEach(stat => {\n      stats.totalContent += stat._count.status;\n      switch (stat.status) {\n        case 'DRAFT':\n          stats.draftContent += stat._count.status;\n          break;\n        case 'PUBLISHED':\n          stats.publishedContent += stat._count.status;\n          break;\n        case 'ARCHIVED':\n          stats.archivedContent += stat._count.status;\n          break;\n      }\n    });\n    \n    // Aggregate page stats\n    pageStats.forEach(stat => {\n      stats.totalContent += stat._count.status;\n      switch (stat.status) {\n        case 'DRAFT':\n          stats.draftContent += stat._count.status;\n          break;\n        case 'REVIEW':\n          stats.reviewContent += stat._count.status;\n          break;\n        case 'PUBLISHED':\n          stats.publishedContent += stat._count.status;\n          break;\n        case 'ARCHIVED':\n          stats.archivedContent += stat._count.status;\n          break;\n      }\n    });\n    \n    return stats;\n  }\n}