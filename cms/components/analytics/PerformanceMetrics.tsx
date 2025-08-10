'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { ContentPerformance } from '@/lib/analytics';

interface PerformanceMetricsProps {
  timeframe?: '7d' | '30d' | '90d' | '1y';
  limit?: number;
}

export default function PerformanceMetrics({ 
  timeframe = '30d', 
  limit = 20 
}: PerformanceMetricsProps) {
  const [performance, setPerformance] = useState<ContentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'views' | 'created' | 'title'>('views');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'product' | 'page'>('all');

  useEffect(() => {
    loadPerformanceData();
  }, [timeframe, limit]);

  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics?type=performance&timeframe=${timeframe}&limit=${limit}`
      );

      if (response.ok) {
        const data = await response.json();
        setPerformance(data.performance);
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedData = performance
    .filter(item => filterType === 'all' || item.type === filterType)
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'views':
          aValue = a.views;
          bValue = b.views;
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getPerformanceIcon = (views: number) => {
    if (views > 500) return <TrendingUpIcon className=\"h-4 w-4 text-green-500\" />;
    if (views > 100) return <ChartBarIcon className=\"h-4 w-4 text-blue-500\" />;
    return <TrendingDownIcon className=\"h-4 w-4 text-gray-400\" />;
  };

  const getPerformanceColor = (views: number) => {
    if (views > 500) return 'text-green-600';
    if (views > 100) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotalViews = () => {
    return filteredAndSortedData.reduce((total, item) => total + item.views, 0);
  };

  const calculateAverageViews = () => {
    const total = calculateTotalViews();
    return filteredAndSortedData.length > 0 ? Math.round(total / filteredAndSortedData.length) : 0;
  };

  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center py-8\">
        <div className=\"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600\"></div>
        <span className=\"ml-3 text-gray-600\">Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header with Controls */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h3 className=\"text-lg font-medium text-gray-900\">Content Performance</h3>
          <p className=\"text-sm text-gray-600\">
            Track views and engagement across your content
          </p>
        </div>
        
        <div className=\"flex items-center space-x-4\">
          {/* Filter by Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className=\"px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500\"
            aria-label=\"Filter by content type\"
          >
            <option value=\"all\">All Content</option>
            <option value=\"product\">Products</option>
            <option value=\"page\">Pages</option>
          </select>
          
          {/* Sort Controls */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy as any);
              setSortOrder(newSortOrder as any);
            }}
            className=\"px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500\"
            aria-label=\"Sort content\"
          >
            <option value=\"views-desc\">Most Views</option>
            <option value=\"views-asc\">Least Views</option>
            <option value=\"created-desc\">Newest First</option>
            <option value=\"created-asc\">Oldest First</option>
            <option value=\"title-asc\">Title A-Z</option>
            <option value=\"title-desc\">Title Z-A</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
        <div className=\"bg-white border border-gray-200 rounded-lg p-4\">
          <div className=\"flex items-center\">
            <EyeIcon className=\"h-5 w-5 text-blue-500 mr-2\" />
            <div>
              <p className=\"text-sm font-medium text-gray-600\">Total Views</p>
              <p className=\"text-xl font-semibold text-gray-900\">{calculateTotalViews().toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className=\"bg-white border border-gray-200 rounded-lg p-4\">
          <div className=\"flex items-center\">
            <ChartBarIcon className=\"h-5 w-5 text-green-500 mr-2\" />
            <div>
              <p className=\"text-sm font-medium text-gray-600\">Average Views</p>
              <p className=\"text-xl font-semibold text-gray-900\">{calculateAverageViews().toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className=\"bg-white border border-gray-200 rounded-lg p-4\">
          <div className=\"flex items-center\">
            <UserIcon className=\"h-5 w-5 text-purple-500 mr-2\" />
            <div>
              <p className=\"text-sm font-medium text-gray-600\">Content Items</p>
              <p className=\"text-xl font-semibold text-gray-900\">{filteredAndSortedData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance List */}
      <div className=\"bg-white border border-gray-200 rounded-lg overflow-hidden\">
        {filteredAndSortedData.length > 0 ? (
          <div className=\"divide-y divide-gray-200\">
            {filteredAndSortedData.map((item, index) => (
              <div key={item.id} className=\"p-4 hover:bg-gray-50 transition-colors\">
                <div className=\"flex items-center justify-between\">
                  <div className=\"flex-1 min-w-0\">
                    <div className=\"flex items-center mb-2\">
                      <span className=\"text-sm font-medium text-gray-500 mr-3\">#{index + 1}</span>
                      <h4 className=\"font-medium text-gray-900 truncate\">{item.title}</h4>
                      <span className=\"ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded\">
                        {item.type}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <div className=\"flex items-center text-sm text-gray-600 space-x-4\">
                      <div className=\"flex items-center\">
                        <UserIcon className=\"h-4 w-4 mr-1\" />
                        <span>{item.creator}</span>
                      </div>
                      <div className=\"flex items-center\">
                        <ClockIcon className=\"h-4 w-4 mr-1\" />
                        <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      {item.lastViewed && (
                        <div className=\"flex items-center\">
                          <EyeIcon className=\"h-4 w-4 mr-1\" />
                          <span>Last viewed {new Date(item.lastViewed).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className=\"flex items-center ml-4\">
                    {getPerformanceIcon(item.views)}
                    <div className=\"ml-3 text-right\">
                      <p className={`text-lg font-semibold ${getPerformanceColor(item.views)}`}>
                        {item.views.toLocaleString()}
                      </p>
                      <p className=\"text-sm text-gray-600\">views</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className=\"p-8 text-center\">
            <ChartBarIcon className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />
            <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No performance data</h3>
            <p className=\"text-gray-600\">
              {filterType === 'all' 
                ? 'No content performance data available for the selected timeframe.'
                : `No ${filterType} performance data available for the selected timeframe.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      {filteredAndSortedData.length > 0 && (
        <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4\">
          <h4 className=\"font-medium text-blue-900 mb-2\">Performance Insights</h4>
          <div className=\"text-sm text-blue-800 space-y-1\">
            <p>
              • Top performing content has {Math.max(...filteredAndSortedData.map(i => i.views)).toLocaleString()} views
            </p>
            <p>
              • {filteredAndSortedData.filter(i => i.views > 100).length} items have over 100 views
            </p>
            <p>
              • {filteredAndSortedData.filter(i => i.status === 'PUBLISHED').length} published items out of {filteredAndSortedData.length} total
            </p>
          </div>
        </div>
      )}
    </div>
  );
}