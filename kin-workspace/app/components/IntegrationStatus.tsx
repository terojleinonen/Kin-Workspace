/**
 * Integration Status Component
 * Displays real-time status of CMS-E-commerce integration
 */

'use client'

import React, { useState, useEffect } from 'react'
import { syncStatus, SyncStatus } from '@/app/lib/sync-status'
import { integrationLogger, LogLevel } from '@/app/lib/integration-logger'

interface IntegrationStatusProps {
  showDetails?: boolean
  className?: string
}

export default function IntegrationStatus({ 
  showDetails = false, 
  className = '' 
}: IntegrationStatusProps) {
  const [status, setStatus] = useState<SyncStatus>(syncStatus.getCurrentStatus())
  const [logs, setLogs] = useState(integrationLogger.getRecentLogs(10))
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Subscribe to status updates
    const unsubscribe = syncStatus.subscribe(setStatus)
    
    // Initial status check
    syncStatus.checkStatus()

    // Update logs periodically
    const logInterval = setInterval(() => {
      setLogs(integrationLogger.getRecentLogs(10))
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(logInterval)
    }
  }, [])

  const getStatusColor = () => {
    if (status.isConnected) return 'text-green-600'
    if (status.error) return 'text-red-600'
    return 'text-yellow-600'
  }

  const getStatusIcon = () => {
    if (status.isConnected) return '🟢'
    if (status.error) return '🔴'
    return '🟡'
  }

  const formatLatency = (latency: number | null) => {
    if (latency === null) return 'N/A'
    return `${latency}ms`
  }

  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Never'
    return date.toLocaleTimeString()
  }

  const handleForceSync = async () => {
    try {
      await syncStatus.forceSync()
    } catch (error) {
      console.error('Force sync failed:', error)
    }
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Status Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{getStatusIcon()}</span>
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                CMS Integration Status
              </h3>
              <p className={`text-sm ${getStatusColor()}`}>
                {status.isConnected ? 'Connected' : 'Disconnected'} 
                {status.dataSource === 'fallback' && ' (Using Fallback Data)'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleForceSync}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Refresh
            </button>
            
            {showDetails && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                {isExpanded ? 'Hide' : 'Details'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Details */}
      {showDetails && (
        <div className="p-4 space-y-4">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {status.productsCount}
              </div>
              <div className="text-xs text-gray-500">Products</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {status.categoriesCount}
              </div>
              <div className="text-xs text-gray-500">Categories</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatLatency(status.latency)}
              </div>
              <div className="text-xs text-gray-500">Latency</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatTimestamp(status.lastSync)}
              </div>
              <div className="text-xs text-gray-500">Last Sync</div>
            </div>
          </div>

          {/* Error Display */}
          {status.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-800">
                <strong>Error:</strong> {status.error}
              </div>
            </div>
          )}

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-4">
              {/* Recent Logs */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Recent Activity
                </h4>
                <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                  {logs.length > 0 ? (
                    <div className="space-y-1">
                      {logs.map((log, index) => (
                        <div key={index} className="text-xs">
                          <span className="text-gray-500">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <span className={`ml-2 font-medium ${
                            log.level === LogLevel.ERROR ? 'text-red-600' :
                            log.level === LogLevel.WARN ? 'text-yellow-600' :
                            log.level === LogLevel.INFO ? 'text-blue-600' :
                            'text-gray-600'
                          }`}>
                            [{log.level.toUpperCase()}]
                          </span>
                          <span className="ml-1 text-gray-700">
                            {log.category}: {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No recent activity</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}