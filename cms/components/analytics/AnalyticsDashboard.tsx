'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { DashboardMetrics, ContentPerformance, InventoryAlert, ActivityLog } from '@/lib/analytics';

interface AnalyticsDashboardProps {
  initialTimeframe?: '7d' | '30d' | '90d' | '1y';
}

export default function AnalyticsDashboard({ initialTimeframe = '30d' }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [performance, setPerformance] = useState<ContentPerformance[]>([]);
  const [inventory, setInventory] = useState<InventoryAlert[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'inventory' | 'activity'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      const [metricsRes, performanceRes, inventoryRes, activityRes, trendsRes] = await Promise.all([
        fetch('/api/analytics?type=metrics'),
        fetch(`/api/analytics?type=performance&timeframe=${timeframe}&limit=10`),
        fetch('/api/analytics?type=inventory'),
        fetch(`/api/analytics?type=activity&limit=20`),
        fetch(`/api/analytics?type=trends&timeframe=${timeframe}`)
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics);
      }

      if (performanceRes.ok) {
        const data = await performanceRes.json();
        setPerformance(data.performance);
      }

      if (inventoryRes.ok) {
        const data = await inventoryRes.json();
        setInventory(data.inventory);
      }

      if (activityRes.ok) {
        const data = await activityRes.json();
        setActivity(data.activity);
      }

      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(data.trends);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&timeframe=${timeframe}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${timeframe}-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(`Export failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'overstocked':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue,
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      red: 'bg-red-50 text-red-600',
      purple: 'bg-purple-50 text-purple-600'
    };

    return (
      <div className=\"bg-white rounded-lg border border-gray-200 p-6\">
        <div className=\"flex items-center\">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className=\"h-6 w-6\" />
          </div>
          <div className=\"ml-4 flex-1\">
            <p className=\"text-sm font-medium text-gray-600\">{title}</p>
            <div className=\"flex items-center mt-1\">
              <p className=\"text-2xl font-semibold text-gray-900\">{value}</p>
              {trend && trendValue && (
                <div className={`ml-2 flex items-center text-sm ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend === 'up' ? (
                    <TrendingUpIcon className=\"h-4 w-4 mr-1\" />
                  ) : (
                    <TrendingDownIcon className=\"h-4 w-4 mr-1\" />
                  )}
                  {trendValue}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center py-12\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
        <span className=\"ml-3 text-gray-600\">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h2 className=\"text-2xl font-bold text-gray-900\">Analytics Dashboard</h2>
          <p className=\"mt-1 text-gray-600\">
            Monitor performance and track key metrics
          </p>
        </div>
        
        <div className=\"flex items-center space-x-4\">
          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className=\"px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500\"
            aria-label=\"Select timeframe\"
          >
            <option value=\"7d\">Last 7 days</option>
            <option value=\"30d\">Last 30 days</option>
            <option value=\"90d\">Last 90 days</option>
            <option value=\"1y\">Last year</option>
          </select>
          
          {/* Export Buttons */}
          <div className=\"flex items-center space-x-2\">
            <button
              onClick={() => handleExport('csv')}
              className=\"flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50\"
            >
              <ArrowDownTrayIcon className=\"h-4 w-4 mr-2\" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className=\"flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50\"
            >
              <ArrowDownTrayIcon className=\"h-4 w-4 mr-2\" />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
          <MetricCard
            title=\"Total Products\"
            value={metrics.totalProducts}
            icon={DocumentTextIcon}
            color=\"blue\"
          />
          <MetricCard
            title=\"Total Pages\"
            value={metrics.totalPages}
            icon={DocumentTextIcon}
            color=\"green\"
          />
          <MetricCard
            title=\"Media Files\"
            value={metrics.totalMedia}
            icon={PhotoIcon}
            color=\"purple\"
          />
          <MetricCard
            title=\"Active Users\"
            value={metrics.totalUsers}
            icon={UsersIcon}
            color=\"yellow\"
          />
        </div>
      )}

      {/* Secondary Metrics */}
      {metrics && (
        <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
          <MetricCard
            title=\"Published Content\"
            value={metrics.publishedContent}
            icon={ChartBarIcon}
            color=\"green\"
          />
          <MetricCard
            title=\"Draft Content\"
            value={metrics.draftContent}
            icon={DocumentTextIcon}
            color=\"yellow\"
          />
          <MetricCard
            title=\"Storage Used\"
            value={formatBytes(metrics.storageUsed)}
            icon={PhotoIcon}
            color=\"purple\"
          />
        </div>
      )}

      {/* Tabs */}
      <div className=\"border-b border-gray-200\">
        <nav className=\"-mb-px flex space-x-8\">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'performance', label: 'Content Performance', icon: TrendingUpIcon },
            { id: 'inventory', label: 'Inventory Alerts', icon: ExclamationTriangleIcon },
            { id: 'activity', label: 'Recent Activity', icon: CalendarIcon }
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
              {tab.id === 'inventory' && inventory.length > 0 && (
                <span className=\"ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full\">
                  {inventory.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className=\"bg-white rounded-lg border border-gray-200\">
        {activeTab === 'overview' && trends && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Content Trends</h3>
            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
              <div>
                <h4 className=\"font-medium text-gray-700 mb-3\">Content Creation</h4>
                <div className=\"space-y-2\">
                  {trends.contentCreation.slice(-7).map((item: any, index: number) => (
                    <div key={index} className=\"flex items-center justify-between py-2 px-3 bg-gray-50 rounded\">
                      <span className=\"text-sm text-gray-600\">{new Date(item.date).toLocaleDateString()}</span>
                      <span className=\"text-sm font-medium text-gray-900\">{item.count} items</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className=\"font-medium text-gray-700 mb-3\">User Activity</h4>
                <div className=\"space-y-2\">
                  {trends.userActivity.slice(-7).map((item: any, index: number) => (
                    <div key={index} className=\"flex items-center justify-between py-2 px-3 bg-blue-50 rounded\">
                      <span className=\"text-sm text-gray-600\">{new Date(item.date).toLocaleDateString()}</span>
                      <span className=\"text-sm font-medium text-blue-900\">{item.count} actions</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Top Performing Content</h3>
            {performance.length > 0 ? (
              <div className=\"space-y-4\">
                {performance.map((item) => (
                  <div key={item.id} className=\"flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg\">
                    <div className=\"flex-1\">
                      <div className=\"flex items-center mb-1\">
                        <h4 className=\"font-medium text-gray-900\">{item.title}</h4>
                        <span className=\"ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded\">
                          {item.type}
                        </span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                          item.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className=\"text-sm text-gray-600\">
                        Created by {item.creator} on {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className=\"text-right\">
                      <p className=\"text-lg font-semibold text-gray-900\">{item.views}</p>
                      <p className=\"text-sm text-gray-600\">views</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className=\"text-gray-500 text-center py-8\">No performance data available</p>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Inventory Alerts</h3>
            {inventory.length > 0 ? (
              <div className=\"space-y-3\">
                {inventory.map((alert) => (
                  <div key={alert.id} className=\"flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg\">
                    <div className=\"flex-1\">
                      <h4 className=\"font-medium text-gray-900\">{alert.productName}</h4>
                      <p className=\"text-sm text-gray-600\">
                        Last updated: {new Date(alert.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <div className=\"flex items-center space-x-3\">
                      <div className=\"text-right\">
                        <p className=\"text-sm font-medium text-gray-900\">{alert.currentStock} units</p>
                        <p className=\"text-xs text-gray-600\">Threshold: {alert.threshold}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(alert.status)}`}>
                        {alert.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className=\"text-center py-8\">
                <ExclamationTriangleIcon className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />
                <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No inventory alerts</h3>
                <p className=\"text-gray-600\">All products are within normal stock levels.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Recent Activity</h3>
            {activity.length > 0 ? (
              <div className=\"space-y-3\">
                {activity.map((item) => (
                  <div key={item.id} className=\"flex items-start py-3 px-4 bg-gray-50 rounded-lg\">
                    <div className=\"flex-1\">
                      <p className=\"text-sm font-medium text-gray-900\">{item.action}</p>
                      <p className=\"text-sm text-gray-600\">
                        {item.contentTitle} ({item.contentType}) by {item.userName}
                      </p>
                      <p className=\"text-xs text-gray-500 mt-1\">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className=\"text-gray-500 text-center py-8\">No recent activity</p>
            )}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className=\"flex justify-end\">
        <button
          onClick={loadAnalyticsData}
          disabled={isLoading}
          className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed\"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
}