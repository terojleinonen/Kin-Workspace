/**
 * Search Service
 * Comprehensive search functionality using MiniSearch for client-side search
 */

import MiniSearch from 'minisearch'

// Search result interface
export interface SearchResult {
  id: string
  type: 'product' | 'page' | 'media'
  title: string
  content: string
  url: string
  score: number
  highlights: {
    title?: string
    content?: string
  }
  metadata: Record<string, any>
}

// Search options interface
export interface SearchOptions {
  query: string
  types?: ('product' | 'page' | 'media')[]
  limit?: number
  offset?: number
  filters?: {
    status?: string[]
    category?: string[]
    tags?: string[]
    dateRange?: {
      start?: string
      end?: string
    }
  }
  sortBy?: 'relevance' | 'date' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// Searchable document interface
interface SearchDocument {
  id: string
  type: 'product' | 'page' | 'media'
  title: string
  content: string
  excerpt?: string
  tags: string[]
  status: string
  category?: string
  createdAt: string
  updatedAt: string
  url: string
  metadata: Record<string, any>
}

class SearchService {
  private miniSearch: MiniSearch<SearchDocument>
  private documents: Map<string, SearchDocument> = new Map()

  constructor() {
    this.miniSearch = new MiniSearch({
      fields: ['title', 'content', 'excerpt', 'tags'], // Fields to index for full-text search
      storeFields: ['id', 'type', 'title', 'content', 'excerpt', 'tags', 'status', 'category', 'createdAt', 'updatedAt', 'url', 'metadata'], // Fields to return with search results
      searchOptions: {
        boost: { title: 2, tags: 1.5 }, // Boost title and tags in search results
        fuzzy: 0.2, // Enable fuzzy matching
        prefix: true, // Enable prefix matching
        combineWith: 'AND' // Default combination of search terms
      },
      extractField: (document, fieldName) => {
        // Custom field extraction for complex fields
        if (fieldName === 'tags' && Array.isArray(document.tags)) {
          return document.tags.join(' ')
        }
        return document[fieldName as keyof SearchDocument]
      }
    })
  }

  /**
   * Add or update a document in the search index
   */
  addDocument(document: SearchDocument): void {
    // Remove existing document if it exists
    if (this.documents.has(document.id)) {
      this.miniSearch.discard(document.id)
    }

    // Add new document
    this.documents.set(document.id, document)
    this.miniSearch.add(document)
  }

  /**
   * Add multiple documents to the search index
   */
  addDocuments(documents: SearchDocument[]): void {
    documents.forEach(doc => this.addDocument(doc))
  }

  /**
   * Remove a document from the search index
   */
  removeDocument(id: string): void {
    if (this.documents.has(id)) {
      this.miniSearch.discard(id)
      this.documents.delete(id)
    }
  }

  /**
   * Clear all documents from the search index
   */
  clearIndex(): void {
    this.miniSearch.removeAll()
    this.documents.clear()
  }

  /**
   * Perform a search with advanced options
   */
  search(options: SearchOptions): {
    results: SearchResult[]
    totalCount: number
    facets: {
      types: Record<string, number>
      statuses: Record<string, number>
      categories: Record<string, number>
      tags: Record<string, number>
    }
  } {
    const {
      query,
      types = ['product', 'page', 'media'],
      limit = 20,
      offset = 0,
      filters = {},
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = options

    // Perform the search
    let searchResults = this.miniSearch.search(query, {
      fuzzy: 0.2,
      prefix: true,
      boost: { title: 2, tags: 1.5 },
      combineWith: 'AND'
    })

    // Apply type filter
    if (types.length < 3) {
      searchResults = searchResults.filter(result => 
        types.includes(result.type as 'product' | 'page' | 'media')
      )
    }

    // Apply additional filters
    searchResults = this.applyFilters(searchResults, filters)

    // Calculate facets before pagination
    const facets = this.calculateFacets(searchResults)

    // Sort results
    searchResults = this.sortResults(searchResults, sortBy, sortOrder)

    // Apply pagination
    const totalCount = searchResults.length
    const paginatedResults = searchResults.slice(offset, offset + limit)

    // Convert to SearchResult format with highlighting
    const results: SearchResult[] = paginatedResults.map(result => ({
      id: result.id,
      type: result.type as 'product' | 'page' | 'media',
      title: result.title,
      content: result.content || result.excerpt || '',
      url: result.url,
      score: result.score,
      highlights: this.generateHighlights(result, query),
      metadata: result.metadata || {}
    }))

    return {
      results,
      totalCount,
      facets
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  getSuggestions(query: string, limit: number = 5): string[] {
    if (query.length < 2) return []

    const suggestions = this.miniSearch.autoSuggest(query, {
      fuzzy: 0.2,
      prefix: true
    })

    return suggestions
      .slice(0, limit)
      .map(suggestion => suggestion.suggestion)
  }

  /**
   * Get popular search terms
   */
  getPopularTerms(): string[] {
    // In a real implementation, this would track search queries
    // For now, return some common terms based on indexed content
    const allTerms = new Set<string>()
    
    this.documents.forEach(doc => {
      const words = doc.title.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.length > 3) {
          allTerms.add(word)
        }
      })
    })

    return Array.from(allTerms).slice(0, 10)
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(results: any[], filters: SearchOptions['filters']): any[] {
    let filteredResults = results

    if (filters?.status?.length) {
      filteredResults = filteredResults.filter(result =>
        filters.status!.includes(result.status)
      )
    }

    if (filters?.category?.length) {
      filteredResults = filteredResults.filter(result =>
        result.category && filters.category!.includes(result.category)
      )
    }

    if (filters?.tags?.length) {
      filteredResults = filteredResults.filter(result =>
        result.tags && filters.tags!.some(tag => result.tags.includes(tag))
      )
    }

    if (filters?.dateRange?.start || filters?.dateRange?.end) {
      filteredResults = filteredResults.filter(result => {
        const resultDate = new Date(result.createdAt)
        const startDate = filters.dateRange?.start ? new Date(filters.dateRange.start) : null
        const endDate = filters.dateRange?.end ? new Date(filters.dateRange.end) : null

        if (startDate && resultDate < startDate) return false
        if (endDate && resultDate > endDate) return false
        return true
      })
    }

    return filteredResults
  }

  /**
   * Sort search results
   */
  private sortResults(results: any[], sortBy: string, sortOrder: string): any[] {
    return results.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'relevance':
          comparison = b.score - a.score
          break
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        default:
          comparison = b.score - a.score
      }

      return sortOrder === 'desc' ? comparison : -comparison
    })
  }

  /**
   * Calculate facets for search results
   */
  private calculateFacets(results: any[]): {
    types: Record<string, number>
    statuses: Record<string, number>
    categories: Record<string, number>
    tags: Record<string, number>
  } {
    const facets = {
      types: {} as Record<string, number>,
      statuses: {} as Record<string, number>,
      categories: {} as Record<string, number>,
      tags: {} as Record<string, number>
    }

    results.forEach(result => {
      // Count types
      facets.types[result.type] = (facets.types[result.type] || 0) + 1

      // Count statuses
      if (result.status) {
        facets.statuses[result.status] = (facets.statuses[result.status] || 0) + 1
      }

      // Count categories
      if (result.category) {
        facets.categories[result.category] = (facets.categories[result.category] || 0) + 1
      }

      // Count tags
      if (result.tags && Array.isArray(result.tags)) {
        result.tags.forEach((tag: string) => {
          facets.tags[tag] = (facets.tags[tag] || 0) + 1
        })
      }
    })

    return facets
  }

  /**
   * Generate highlights for search results
   */
  private generateHighlights(result: any, query: string): { title?: string; content?: string } {
    const highlights: { title?: string; content?: string } = {}
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)

    // Highlight title
    if (result.title) {
      highlights.title = this.highlightText(result.title, queryTerms)
    }

    // Highlight content
    const content = result.content || result.excerpt || ''
    if (content) {
      highlights.content = this.highlightText(content, queryTerms, 200)
    }

    return highlights
  }

  /**
   * Highlight search terms in text
   */
  private highlightText(text: string, terms: string[], maxLength?: number): string {
    let highlightedText = text

    terms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
    })

    // Truncate if needed and try to include highlighted terms
    if (maxLength && highlightedText.length > maxLength) {
      const markIndex = highlightedText.indexOf('<mark>')
      if (markIndex !== -1) {
        const start = Math.max(0, markIndex - 50)
        const end = Math.min(highlightedText.length, start + maxLength)
        highlightedText = (start > 0 ? '...' : '') + 
                         highlightedText.substring(start, end) + 
                         (end < highlightedText.length ? '...' : '')
      } else {
        highlightedText = highlightedText.substring(0, maxLength) + '...'
      }
    }

    return highlightedText
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Get search statistics
   */
  getStats(): {
    totalDocuments: number
    documentsByType: Record<string, number>
    indexSize: number
  } {
    const documentsByType: Record<string, number> = {}
    
    this.documents.forEach(doc => {
      documentsByType[doc.type] = (documentsByType[doc.type] || 0) + 1
    })

    return {
      totalDocuments: this.documents.size,
      documentsByType,
      indexSize: this.documents.size // Simplified size calculation
    }
  }
}

// Export singleton instance
export const searchService = new SearchService()
export default searchService