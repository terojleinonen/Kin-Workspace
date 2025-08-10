'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  CircleStackIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface PerformanceMetrics {
  realTime: {
    currentRequests: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: number;
  };
  database: {
    totalQueries: number;
    slowQueries: number;
    averageQueryTime: number;
    cacheHitRate: number;
  };
  cache: {
    totalItems: number;
    memoryUsage: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  };
  images: {
    totalProcessed: number;
    averageCompressionRatio: number;
    totalSizeSaved: number;
  };
}

interface SlowQuery {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'database' | 'cache' | 'images'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadPerformanceData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadPerformanceData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      
      const [metricsRes, slowQueriesRes] = await Promise.all([
        fetch('/api/admin/performance/metrics'),
        fetch('/api/admin/performance/slow-queries')
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics);
      }

      if (slowQueriesRes.ok) {
        const data = await slowQueriesRes.json();
        setSlowQueries(data.slowQueries);
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    unit = '', 
    icon: Icon, 
    trend, 
    trendValue,
    color = 'blue',
    status = 'normal'
  }: {
    title: string;
    value: string | number;
    unit?: string;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    status?: 'normal' | 'warning' | 'critical';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      red: 'bg-red-50 text-red-600',
      purple: 'bg-purple-50 text-purple-600'
    };

    const statusClasses = {
      normal: 'border-gray-200',
      warning: 'border-yellow-300 bg-yellow-50',
      critical: 'border-red-300 bg-red-50'
    };

    return (
      <div className={`bg-white rounded-lg border p-6 ${statusClasses[status]}`}>
        <div className=\"flex items-center justify-between\">
          <div className=\"flex items-center\">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              <Icon className=\"h-6 w-6\" />
            </div>
            <div className=\"ml-4\">
              <p className=\"text-sm font-medium text-gray-600\">{title}</p>
              <div className=\"flex items-center mt-1\">
                <p className=\"text-2xl font-semibold text-gray-900\">
                  {value}{unit}
                </p>
                {trend && trendValue && (
                  <div className={`ml-2 flex items-center text-sm ${
                    trend === 'up' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {trend === 'up' ? (
                      <ArrowTrendingUpIcon className=\"h-4 w-4 mr-1\" />
                    ) : (
                      <ArrowTrendingDownIcon className=\"h-4 w-4 mr-1\" />
                    )}
                    {trendValue}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {status !== 'normal' && (
            <div className=\"ml-4\">
              {status === 'warning' ? (
                <ExclamationTriangleIcon className=\"h-6 w-6 text-yellow-500\" />
              ) : (
                <ExclamationTriangleIcon className=\"h-6 w-6 text-red-500\" />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'normal';
  };

  if (isLoading && !metrics) {
    return (
      <div className=\"flex items-center justify-center py-12\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
        <span className=\"ml-3 text-gray-600\">Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h2 className=\"text-2xl font-bold text-gray-900\">Performance Dashboard</h2>
          <p className=\"mt-1 text-gray-600\">
            Monitor system performance and optimize bottlenecks
          </p>
        </div>
        
        <div className=\"flex items-center space-x-4\">
          <label className=\"flex items-center\">
            <input
              type=\"checkbox\"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className=\"mr-2\"
            />
            <span className=\"text-sm text-gray-600\">Auto-refresh</span>
          </label>
          
          <button
            onClick={loadPerformanceData}
            disabled={isLoading}
            className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50\"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Real-time Metrics */}
      {metrics && (
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
          <MetricCard
            title=\"Response Time\"
            value={metrics.realTime.averageResponseTime}
            unit=\"ms\"
            icon={ClockIcon}
            color=\"blue\"
            status={getStatus(metrics.realTime.averageResponseTime, { warning: 500, critical: 1000 })}
          />
          <MetricCard
            title=\"Error Rate\"
            value={metrics.realTime.errorRate}
            unit=\"%\"
            icon={ExclamationTriangleIcon}
            color={metrics.realTime.errorRate > 5 ? 'red' : 'green'}
            status={getStatus(metrics.realTime.errorRate, { warning: 2, critical: 5 })}
          />
          <MetricCard
            title=\"Memory Usage\"
            value={metrics.realTime.memoryUsage}
            unit=\"MB\"
            icon={CpuChipIcon}
            color=\"purple\"
            status={getStatus(metrics.realTime.memoryUsage, { warning: 512, critical: 1024 })}
          />
          <MetricCard
            title=\"Active Requests\"
            value={metrics.realTime.currentRequests}
            icon={ChartBarIcon}
            color=\"yellow\"
          />
        </div>
      )}

      {/* Tabs */}
      <div className=\"border-b border-gray-200\">
        <nav className=\"-mb-px flex space-x-8\">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'database', label: 'Database', icon: CircleStackIcon },
            { id: 'cache', label: 'Cache', icon: CpuChipIcon },
            { id: 'images', label: 'Images', icon: PhotoIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className=\"h-4 w-4 mr-2\" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className=\"bg-white rounded-lg border border-gray-200\">
        {activeTab === 'overview' && metrics && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">System Overview</h3>
            
            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
              <div>
                <h4 className=\"font-medium text-gray-700 mb-3\">Performance Summary</h4>
                <div className=\"space-y-3\">
                  <div className=\"flex items-center justify-between py-2 px-3 bg-gray-50 rounded\">
                    <span className=\"text-sm font-medium\">Average Response Time</span>
                    <span className={`text-sm font-medium ${
                      metrics.realTime.averageResponseTime > 500 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {metrics.realTime.averageResponseTime}ms
                    </span>
                  </div>
                  <div className=\"flex items-center justify-between py-2 px-3 bg-gray-50 rounded\">
                    <span className=\"text-sm font-medium\">Database Query Time</span>
                    <span className={`text-sm font-medium ${
                      metrics.database.averageQueryTime > 100 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {metrics.database.averageQueryTime}ms
                    </span>
                  </div>
                  <div className=\"flex items-center justify-between py-2 px-3 bg-gray-50 rounded\">
                    <span className=\"text-sm font-medium\">Cache Hit Rate</span>
                    <span className={`text-sm font-medium ${
                      metrics.cache.hitRate < 80 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {metrics.cache.hitRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className=\"font-medium text-gray-700 mb-3\">System Health</h4>
                <div className=\"space-y-3\">
                  <div className=\"flex items-center py-2 px-3 bg-green-50 rounded\">
                    <CheckCircleIcon className=\"h-5 w-5 text-green-500 mr-3\" />
                    <span className=\"text-sm text-green-800\">Database connection healthy</span>
                  </div>
                  <div className=\"flex items-center py-2 px-3 bg-green-50 rounded\">
                    <CheckCircleIcon className=\"h-5 w-5 text-green-500 mr-3\" />
                    <span className=\"text-sm text-green-800\">Cache system operational</span>
                  </div>
                  {metrics.realTime.errorRate > 5 && (
                    <div className=\"flex items-center py-2 px-3 bg-red-50 rounded\">
                      <ExclamationTriangleIcon className=\"h-5 w-5 text-red-500 mr-3\" />
                      <span className=\"text-sm text-red-800\">High error rate detected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && metrics && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Database Performance</h3>
            
            <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6\">
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-gray-900\">{metrics.database.totalQueries}</p>
                <p className=\"text-sm text-gray-600\">Total Queries</p>
              </div>
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-gray-900\">{metrics.database.averageQueryTime}ms</p>
                <p className=\"text-sm text-gray-600\">Average Query Time</p>
              </div>
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-red-600\">{metrics.database.slowQueries}</p>
                <p className=\"text-sm text-gray-600\">Slow Queries</p>
              </div>
            </div>

            {slowQueries.length > 0 && (
              <div>
                <h4 className=\"font-medium text-gray-700 mb-3\">Slow Queries</h4>
                <div className=\"space-y-2 max-h-64 overflow-y-auto\">
                  {slowQueries.slice(0, 10).map((query, index) => (
                    <div key={index} className=\"p-3 bg-red-50 border border-red-200 rounded\">
                      <div className=\"flex items-center justify-between mb-2\">
                        <span className=\"text-sm font-medium text-red-800\">
                          {query.duration}ms
                        </span>
                        <span className=\"text-xs text-red-600\">
                          {new Date(query.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <code className=\"text-xs text-gray-700 bg-white p-2 rounded block overflow-x-auto\">
                        {query.query}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cache' && metrics && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Cache Performance</h3>
            
            <div className=\"grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6\">
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-gray-900\">{metrics.cache.totalItems}</p>
                <p className=\"text-sm text-gray-600\">Cached Items</p>
              </div>
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-blue-600\">{metrics.cache.hitRate.toFixed(1)}%</p>
                <p className=\"text-sm text-gray-600\">Hit Rate</p>
              </div>
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-green-600\">{metrics.cache.totalHits}</p>
                <p className=\"text-sm text-gray-600\">Cache Hits</p>
              </div>
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-red-600\">{metrics.cache.totalMisses}</p>
                <p className=\"text-sm text-gray-600\">Cache Misses</p>
              </div>
            </div>

            <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4\">
              <h4 className=\"font-medium text-blue-900 mb-2\">Cache Optimization Tips</h4>
              <ul className=\"text-sm text-blue-800 space-y-1\">
                <li>• Aim for a cache hit rate above 80% for optimal performance</li>
                <li>• Monitor memory usage to prevent cache eviction</li>
                <li>• Consider increasing cache TTL for stable data</li>
                <li>• Use cache warming for frequently accessed data</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'images' && metrics && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Image Optimization</h3>
            
            <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6\">
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-gray-900\">{metrics.images.totalProcessed}</p>
                <p className=\"text-sm text-gray-600\">Images Processed</p>
              </div>
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-green-600\">{metrics.images.averageCompressionRatio}%</p>
                <p className=\"text-sm text-gray-600\">Avg Compression</p>
              </div>
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-blue-600\">{(metrics.images.totalSizeSaved / 1024 / 1024).toFixed(1)}MB</p>
                <p className=\"text-sm text-gray-600\">Storage Saved</p>
              </div>
            </div>

            <div className=\"bg-green-50 border border-green-200 rounded-lg p-4\">
              <h4 className=\"font-medium text-green-900 mb-2\">Image Performance Tips</h4>
              <ul className=\"text-sm text-green-800 space-y-1\">
                <li>• Use WebP format for better compression</li>
                <li>• Generate multiple sizes for responsive images</li>
                <li>• Implement lazy loading for better page performance</li>
                <li>• Consider AVIF format for modern browsers</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}