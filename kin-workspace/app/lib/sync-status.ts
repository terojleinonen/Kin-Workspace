/**
 * Sync Status Service
 * Monitors and reports synchronization status between CMS and e-commerce
 */

import { cmsApi } from './cms-api'

export interface SyncStatus {
  isConnected: boolean
  lastSync: Date | null
  dataSource: 'cms' | 'fallback'
  latency: number | null
  error: string | null
  productsCount: number
  categoriesCount: number
}

class SyncStatusService {
  private status: SyncStatus = {
    isConnected: false,
    lastSync: null,
    dataSource: 'fallback',
    latency: null,
    error: null,
    productsCount: 0,
    categoriesCount: 0
  }

  private listeners: Array<(status: SyncStatus) => void> = []

  /**
   * Check current sync status
   */
  async checkStatus(): Promise<SyncStatus> {
    const startTime = Date.now()
    
    try {
      // Test CMS connectivity
      const isHealthy = await cmsApi.healthCheck()
      const latency = Date.now() - startTime

      if (isHealthy) {
        // Get data counts from CMS
        const [productsResult, categories] = await Promise.all([
          cmsApi.getProducts({ limit: 1 }),
          cmsApi.getCategories()
        ])

        this.status = {
          isConnected: true,
          lastSync: new Date(),
          dataSource: 'cms',
          latency,
          error: null,
          productsCount: productsResult.total,
          categoriesCount: categories.length
        }
      } else {
        throw new Error('CMS health check failed')
      }
    } catch (error) {
      // Fallback to mock data counts
      const { productsDatabase } = await import('./product-data')
      const mockCategories = ['Desks', 'Accessories', 'Lighting', 'Seating']

      this.status = {
        isConnected: false,
        lastSync: this.status.lastSync, // Keep last successful sync time
        dataSource: 'fallback',
        latency: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        productsCount: productsDatabase.length,
        categoriesCount: mockCategories.length
      }
    }

    // Notify listeners
    this.notifyListeners()
    return this.status
  }

  /**
   * Get current status without checking
   */
  getCurrentStatus(): SyncStatus {
    return { ...this.status }
  }

  /**
   * Subscribe to status changes
   */
  subscribe(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Start periodic status monitoring
   */
  startMonitoring(intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      this.checkStatus()
    }, intervalMs)

    // Initial check
    this.checkStatus()

    // Return stop function
    return () => clearInterval(interval)
  }

  /**
   * Force sync check
   */
  async forceSync(): Promise<SyncStatus> {
    return this.checkStatus()
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.status)
      } catch (error) {
        console.error('Error in sync status listener:', error)
      }
    })
  }
}

// Export singleton instance
export const syncStatus = new SyncStatusService()

// React hook for sync status
export function useSyncStatus() {
  const [status, setStatus] = React.useState<SyncStatus>(syncStatus.getCurrentStatus())

  React.useEffect(() => {
    const unsubscribe = syncStatus.subscribe(setStatus)
    syncStatus.checkStatus() // Initial check
    
    return unsubscribe
  }, [])

  return {
    status,
    forceSync: () => syncStatus.forceSync(),
    startMonitoring: (interval?: number) => syncStatus.startMonitoring(interval)
  }
}

// Add React import for the hook
import React from 'react'