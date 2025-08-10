'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CursorArrowRaysIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline';

interface AnalyticsOverview {
  totalSearches: number;
  uniqueQueries: number;
  noResultsCount: number;
  noResultsRate: number;
  avgResultsPerQuery: number;
  recentSearches: number;
}

interface PopularTerm {
  term: string;
  count: number;
}

interface NoResultsQuery {
  query: string;
  count: number;
  lastSearched: string;
}

interface ClickThroughData {
  clickThroughRates: Array<{
    position: number;
    clicks: number;
    rate: number;
  }>;
  topClickedQueries: Array<{
    query: string;
    clicks: number;
  }>;
  totalClicks: number;
}

export default function SearchAnalytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [popularTerms, setPopularTerms] = useState<PopularTerm[]>([]);
  const [noResultsQueries, setNoResultsQueries] = useState<NoResultsQuery[]>([]);
  const [clickThroughData, setClickThroughData] = useState<ClickThroughData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'terms' | 'no-results' | 'clicks'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Load all analytics data in parallel
      const [overviewRes, termsRes, noResultsRes, clicksRes] = await Promise.all([
        fetch('/api/search/analytics?type=overview'),
        fetch('/api/search/analytics?type=popular-terms&limit=20'),
        fetch('/api/search/analytics?type=no-results&limit=20'),
        fetch('/api/search/analytics?type=click-through')
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data.overview);
      }

      if (termsRes.ok) {
        const data = await termsRes.json();
        setPopularTerms(data.popularTerms);
      }

      if (noResultsRes.ok) {
        const data = await noResultsRes.json();
        setNoResultsQueries(data.noResultsQueries);
      }

      if (clicksRes.ok) {
        const data = await clicksRes.json();
        setClickThroughData(data);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ 
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
    color?: 'blue' | 'green' | 'red' | 'yellow';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      red: 'bg-red-50 text-red-600',
      yellow: 'bg-yellow-50 text-yellow-600'
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
      <div>
        <h2 className=\"text-2xl font-bold text-gray-900\">Search Analytics</h2>
        <p className=\"mt-1 text-gray-600\">
          Monitor search behavior and optimize content discoverability
        </p>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
          <StatCard
            title=\"Total Searches\"
            value={overview.totalSearches.toLocaleString()}
            icon={MagnifyingGlassIcon}
            color=\"blue\"
          />
          <StatCard
            title=\"Unique Queries\"
            value={overview.uniqueQueries.toLocaleString()}
            icon={ChartBarIcon}
            color=\"green\"
          />
          <StatCard
            title=\"No Results Rate\"
            value={`${overview.noResultsRate}%`}
            icon={ExclamationTriangleIcon}
            color={overview.noResultsRate > 20 ? 'red' : 'yellow'}
          />
          <StatCard
            title=\"Avg Results/Query\"
            value={overview.avgResultsPerQuery.toFixed(1)}
            icon={CursorArrowRaysIcon}
            color=\"blue\"
          />
        </div>
      )}

      {/* Tabs */}
      <div className=\"border-b border-gray-200\">
        <nav className=\"-mb-px flex space-x-8\">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'terms', label: 'Popular Terms', icon: TrendingUpIcon },
            { id: 'no-results', label: 'No Results', icon: ExclamationTriangleIcon },
            { id: 'clicks', label: 'Click-Through', icon: CursorArrowRaysIcon }
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
        {activeTab === 'overview' && overview && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Search Overview</h3>
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
              <div>
                <h4 className=\"font-medium text-gray-700 mb-2\">Key Metrics</h4>
                <dl className=\"space-y-2\">
                  <div className=\"flex justify-between\">
                    <dt className=\"text-sm text-gray-600\">Total Searches:</dt>
                    <dd className=\"text-sm font-medium text-gray-900\">{overview.totalSearches}</dd>
                  </div>
                  <div className=\"flex justify-between\">
                    <dt className=\"text-sm text-gray-600\">Unique Queries:</dt>
                    <dd className=\"text-sm font-medium text-gray-900\">{overview.uniqueQueries}</dd>
                  </div>
                  <div className=\"flex justify-between\">
                    <dt className=\"text-sm text-gray-600\">Recent Searches (7d):</dt>
                    <dd className=\"text-sm font-medium text-gray-900\">{overview.recentSearches}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className=\"font-medium text-gray-700 mb-2\">Performance</h4>
                <dl className=\"space-y-2\">
                  <div className=\"flex justify-between\">
                    <dt className=\"text-sm text-gray-600\">No Results Queries:</dt>
                    <dd className=\"text-sm font-medium text-gray-900\">{overview.noResultsCount}</dd>
                  </div>
                  <div className=\"flex justify-between\">
                    <dt className=\"text-sm text-gray-600\">No Results Rate:</dt>
                    <dd className={`text-sm font-medium ${
                      overview.noResultsRate > 20 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {overview.noResultsRate}%
                    </dd>
                  </div>
                  <div className=\"flex justify-between\">
                    <dt className=\"text-sm text-gray-600\">Avg Results per Query:</dt>
                    <dd className=\"text-sm font-medium text-gray-900\">{overview.avgResultsPerQuery}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Popular Search Terms</h3>
            {popularTerms.length > 0 ? (
              <div className=\"space-y-2\">
                {popularTerms.map((term, index) => (
                  <div key={term.term} className=\"flex items-center justify-between py-2 px-3 bg-gray-50 rounded\">
                    <div className=\"flex items-center\">
                      <span className=\"text-sm font-medium text-gray-500 w-6\">#{index + 1}</span>
                      <span className=\"ml-3 text-sm font-medium text-gray-900\">{term.term}</span>
                    </div>
                    <span className=\"text-sm text-gray-600\">{term.count} searches</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className=\"text-gray-500 text-center py-8\">No search terms data available</p>
            )}
          </div>
        )}

        {activeTab === 'no-results' && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Queries with No Results</h3>
            {noResultsQueries.length > 0 ? (
              <div className=\"space-y-2\">
                {noResultsQueries.map((query, index) => (
                  <div key={query.query} className=\"flex items-center justify-between py-3 px-3 bg-red-50 rounded border border-red-200\">
                    <div>
                      <span className=\"text-sm font-medium text-gray-900\">{query.query}</span>
                      <p className=\"text-xs text-gray-600 mt-1\">
                        Last searched: {new Date(query.lastSearched).toLocaleDateString()}
                      </p>
                    </div>
                    <span className=\"text-sm text-red-600 font-medium\">{query.count} times</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className=\"text-gray-500 text-center py-8\">No queries with zero results</p>
            )}
          </div>
        )}

        {activeTab === 'clicks' && clickThroughData && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Click-Through Analytics</h3>
            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
              <div>
                <h4 className=\"font-medium text-gray-700 mb-3\">Click-Through Rate by Position</h4>
                {clickThroughData.clickThroughRates.length > 0 ? (
                  <div className=\"space-y-2\">
                    {clickThroughData.clickThroughRates.slice(0, 10).map((item) => (
                      <div key={item.position} className=\"flex items-center justify-between py-2 px-3 bg-gray-50 rounded\">
                        <span className=\"text-sm font-medium text-gray-900\">Position {item.position}</span>
                        <div className=\"flex items-center space-x-3\">
                          <span className=\"text-sm text-gray-600\">{item.clicks} clicks</span>
                          <span className=\"text-sm font-medium text-blue-600\">{item.rate.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className=\"text-gray-500 text-center py-4\">No click-through data available</p>
                )}
              </div>
              
              <div>
                <h4 className=\"font-medium text-gray-700 mb-3\">Most Clicked Queries</h4>
                {clickThroughData.topClickedQueries.length > 0 ? (
                  <div className=\"space-y-2\">
                    {clickThroughData.topClickedQueries.slice(0, 10).map((item, index) => (
                      <div key={item.query} className=\"flex items-center justify-between py-2 px-3 bg-green-50 rounded\">
                        <div className=\"flex items-center\">
                          <span className=\"text-sm font-medium text-gray-500 w-6\">#{index + 1}</span>
                          <span className=\"ml-3 text-sm font-medium text-gray-900\">{item.query}</span>
                        </div>
                        <span className=\"text-sm text-green-600 font-medium\">{item.clicks} clicks</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className=\"text-gray-500 text-center py-4\">No click data available</p>
                )}
              </div>
            </div>
            
            <div className=\"mt-6 p-4 bg-blue-50 rounded-lg\">
              <p className=\"text-sm text-blue-800\">
                <strong>Total Clicks:</strong> {clickThroughData.totalClicks.toLocaleString()}
              </p>
            </div>
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