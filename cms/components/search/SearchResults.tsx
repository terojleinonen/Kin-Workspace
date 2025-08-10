'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { SearchResult } from '@/lib/search';

interface SearchResultsProps {
  initialQuery?: string;
  onResultClick?: (result: SearchResult) => void;
}

interface SearchFilters {
  types: ('product' | 'page' | 'media')[];
  status: string[];
  category: string[];
  tags: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

export default function SearchResults({ initialQuery = '', onResultClick }: SearchResultsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [facets, setFacets] = useState<any>({});
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    types: ['product', 'page', 'media'],
    status: [],
    category: [],
    tags: [],
    dateRange: { start: '', end: '' }
  });

  const pageSize = 20;

  useEffect(() => {
    if (query.trim()) {
      performSearch();
    }
  }, [query, filters, sortBy, sortOrder, currentPage]);

  const performSearch = async () => {
    if (!query.trim()) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        query: query.trim(),
        types: filters.types.join(','),
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
        sortBy,
        sortOrder
      });

      if (filters.status.length) params.append('status', filters.status.join(','));
      if (filters.category.length) params.append('category', filters.category.join(','));
      if (filters.tags.length) params.append('tags', filters.tags.join(','));
      if (filters.dateRange.start) params.append('dateStart', filters.dateRange.start);
      if (filters.dateRange.end) params.append('dateEnd', filters.dateRange.end);

      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setResults(data.results);
      setTotalCount(data.totalCount);
      setFacets(data.facets);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      window.open(result.url, '_blank');
    }
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      types: ['product', 'page', 'media'],
      status: [],
      category: [],
      tags: [],
      dateRange: { start: '', end: '' }
    });
    setCurrentPage(1);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'product':
        return '🛍️';
      case 'page':
        return '📄';
      case 'media':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'product':
        return 'Product';
      case 'page':
        return 'Page';
      case 'media':
        return 'Media';
      default:
        return 'Item';
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, pages, and media..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-3 border rounded-lg ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Search Stats */}
        {query && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {isLoading ? (
                <span>Searching...</span>
              ) : (
                <span>
                  {totalCount.toLocaleString()} results for "{query}"
                  {totalCount > 0 && (
                    <span> ({((currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, totalCount)} shown)</span>
                  )}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                aria-label="Sort search results"
              >
                <option value="relevance-desc">Most Relevant</option>
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>

              {/* Content Types */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Content Types</h4>
                <div className="space-y-2">
                  {['product', 'page', 'media'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleFilterChange('types', [...filters.types, type as any]);
                          } else {
                            handleFilterChange('types', filters.types.filter(t => t !== type));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{type}</span>
                      {facets.types?.[type] && (
                        <span className="ml-auto text-xs text-gray-500">({String(facets.types[type])})</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              {Object.keys(facets.statuses || {}).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-3">Status</h4>
                  <div className="space-y-2">
                    {Object.entries(facets.statuses || {}).map(([status, count]) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleFilterChange('status', [...filters.status, status]);
                            } else {
                              handleFilterChange('status', filters.status.filter(s => s !== status));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{status.toLowerCase()}</span>
                        <span className="ml-auto text-xs text-gray-500">({String(count)})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Filter */}
              {Object.keys(facets.categories || {}).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Object.entries(facets.categories || {}).map(([category, count]) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.category.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleFilterChange('category', [...filters.category, category]);
                            } else {
                              handleFilterChange('category', filters.category.filter(c => c !== category));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{category}</span>
                        <span className="ml-auto text-xs text-gray-500">({String(count)})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Date Range</h4>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="End date"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Content */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              {/* Results List */}
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start">
                      <span className="text-2xl mr-4 mt-1">{getResultIcon(result.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <h3 
                            className="text-lg font-medium text-gray-900 hover:text-blue-600"
                            dangerouslySetInnerHTML={{ __html: result.highlights.title || result.title }}
                          />
                          <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {getResultTypeLabel(result.type)}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            Score: {result.score.toFixed(2)}
                          </span>
                        </div>
                        
                        {result.highlights.content && (
                          <p 
                            className="text-gray-600 mb-3 line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: result.highlights.content }}
                          />
                        )}
                        
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span className="text-blue-600 hover:underline">{result.url}</span>
                          {result.metadata.creator && (
                            <span>Created by {result.metadata.creator}</span>
                          )}
                          {result.metadata.updatedAt && (
                            <span>Updated {new Date(result.metadata.updatedAt).toLocaleDateString()}</span>
                          )}
                          {result.metadata.category && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                              {result.metadata.category}
                            </span>
                          )}
                        </div>
                        
                        {result.metadata.tags && result.metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.metadata.tags.slice(0, 5).map((tag: string, index: number) => (
                              <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                            {result.metadata.tags.length > 5 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                +{result.metadata.tags.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 px-4 py-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                      <span className="font-medium">{totalCount}</span> results
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            pageNum === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : query.trim() ? (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">We couldn't find anything matching "{query}"</p>
              <div className="text-sm text-gray-500">
                <p>Try:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Checking your spelling</li>
                  <li>• Using different keywords</li>
                  <li>• Removing some filters</li>
                  <li>• Using more general terms</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
              <p className="text-gray-600">Enter a search term to find products, pages, and media</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}