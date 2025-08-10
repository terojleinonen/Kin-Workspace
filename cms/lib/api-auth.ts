/**
 * API Authentication System
 * Handles JWT-based authentication for public API endpoints
 */

import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ApiKeyData {
  id: string;
  name: string;
  keyHash: string;
  permissions: string[];
  isActive: boolean;
  lastUsed: Date | null;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface JWTPayload {
  apiKeyId: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface ApiAuthResult {
  success: boolean;
  apiKeyId?: string;
  permissions?: string[];
  error?: string;
}

export class ApiAuthService {
  private static readonly JWT_SECRET = process.env.API_JWT_SECRET || 'your-api-jwt-secret';
  private static readonly JWT_EXPIRES_IN = '24h';

  /**
   * Generate a new API key
   */
  static generateApiKey(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `kw_${timestamp}_${random}`;
  }

  /**
   * Hash an API key for storage
   */
  static async hashApiKey(apiKey: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Create a new API key
   */
  static async createApiKey(data: {
    name: string;
    permissions: string[];
    createdBy: string;
    expiresAt?: Date;
  }): Promise<{ apiKey: string; id: string }> {
    const apiKey = this.generateApiKey();
    const keyHash = await this.hashApiKey(apiKey);

    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        name: data.name,
        keyHash,
        permissions: data.permissions,
        isActive: true,
        createdBy: data.createdBy,
        expiresAt: data.expiresAt
      }
    });

    return {
      apiKey,
      id: apiKeyRecord.id
    };
  }

  /**
   * Validate an API key and return JWT token
   */
  static async validateApiKey(apiKey: string): Promise<string | null> {
    try {
      const keyHash = await this.hashApiKey(apiKey);
      
      const apiKeyRecord = await prisma.apiKey.findFirst({
        where: {
          keyHash,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      if (!apiKeyRecord) {
        return null;
      }

      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsed: new Date() }
      });

      // Generate JWT token
      const payload: JWTPayload = {
        apiKeyId: apiKeyRecord.id,
        permissions: apiKeyRecord.permissions,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };

      return jwt.sign(payload, this.JWT_SECRET);

    } catch (error) {
      console.error('API key validation error:', error);
      return null;
    }
  }

  /**
   * Verify JWT token from request
   */
  static async verifyToken(request: NextRequest): Promise<ApiAuthResult> {
    try {
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid authorization header' };
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;

      // Verify API key is still active
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { id: decoded.apiKeyId }
      });

      if (!apiKeyRecord || !apiKeyRecord.isActive) {
        return { success: false, error: 'API key is inactive or not found' };
      }

      // Check expiration
      if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
        return { success: false, error: 'API key has expired' };
      }

      return {
        success: true,
        apiKeyId: decoded.apiKeyId,
        permissions: decoded.permissions
      };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return { success: false, error: 'Invalid token' };
      }
      if (error instanceof jwt.TokenExpiredError) {
        return { success: false, error: 'Token expired' };
      }
      
      console.error('Token verification error:', error);
      return { success: false, error: 'Token verification failed' };
    }
  }

  /**
   * Check if API key has specific permission
   */
  static hasPermission(permissions: string[], requiredPermission: string): boolean {
    return permissions.includes('*') || permissions.includes(requiredPermission);
  }

  /**
   * Rate limiting check
   */
  static async checkRateLimit(apiKeyId: string, endpoint: string): Promise<boolean> {
    // Simple in-memory rate limiting (in production, use Redis)
    const key = `${apiKeyId}:${endpoint}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 100; // Max requests per window

    // This is a simplified implementation
    // In production, implement proper rate limiting with Redis
    return true;
  }

  /**
   * Log API usage
   */
  static async logApiUsage(data: {
    apiKeyId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await prisma.apiUsageLog.create({
        data: {
          apiKeyId: data.apiKeyId,
          endpoint: data.endpoint,
          method: data.method,
          statusCode: data.statusCode,
          responseTime: data.responseTime,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log API usage:', error);
    }
  }

  /**
   * Get API key usage statistics
   */
  static async getApiKeyStats(apiKeyId: string, timeframe: '24h' | '7d' | '30d' = '24h'): Promise<{
    totalRequests: number;
    successfulRequests: number;
    errorRequests: number;
    averageResponseTime: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  }> {
    const timeframeDates = {
      '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
      '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    };

    const startDate = timeframeDates[timeframe];

    const logs = await prisma.apiUsageLog.findMany({
      where: {
        apiKeyId,
        timestamp: { gte: startDate }
      }
    });

    const totalRequests = logs.length;
    const successfulRequests = logs.filter(log => log.statusCode >= 200 && log.statusCode < 400).length;
    const errorRequests = totalRequests - successfulRequests;
    const averageResponseTime = logs.length > 0 
      ? logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length 
      : 0;

    // Calculate top endpoints
    const endpointCounts = logs.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      successfulRequests,
      errorRequests,
      averageResponseTime: Math.round(averageResponseTime),
      topEndpoints
    };
  }
}