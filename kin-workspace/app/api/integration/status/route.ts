/**
 * Integration Status API
 * Provides status information about CMS integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncStatus } from '@/app/lib/sync-status'
import { integrationLogger } from '@/app/lib/integration-logger'

export async function GET(request: NextRequest) {
  try {
    // Get current sync status
    const currentStatus = await syncStatus.checkStatus()
    
    // Get recent logs
    const recentLogs = integrationLogger.getRecentLogs(50)
    const logStats = integrationLogger.getStats()

    // Calculate uptime percentage (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentErrorLogs = recentLogs.filter(log => 
      log.level === 'error' && log.timestamp > last24Hours
    )
    
    const uptimePercentage = recentErrorLogs.length > 0 
      ? Math.max(0, 100 - (recentErrorLogs.length / recentLogs.length) * 100)
      : 100

    const response = {
      status: currentStatus,
      logs: {
        recent: recentLogs.slice(0, 10), // Last 10 logs
        stats: logStats
      },
      metrics: {
        uptimePercentage: Math.round(uptimePercentage * 100) / 100,
        totalRequests: logStats.byCategory['API'] || 0,
        errorRate: logStats.byLevel['error'] / Math.max(1, logStats.total) * 100,
        averageLatency: currentStatus.latency
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error getting integration status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get integration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    switch (action) {
      case 'force-sync':
        const status = await syncStatus.forceSync()
        return NextResponse.json({ 
          success: true, 
          status,
          message: 'Sync forced successfully'
        })

      case 'clear-logs':
        integrationLogger.clearLogs()
        return NextResponse.json({ 
          success: true,
          message: 'Logs cleared successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error handling integration action:', error)
    return NextResponse.json(
      { 
        error: 'Failed to handle action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}