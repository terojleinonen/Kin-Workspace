/**
 * Integration Testing Utilities
 * Tools for testing CMS-E-commerce integration
 */

import { cmsApi } from './cms-api'
import { syncStatus } from './sync-status'
import { integrationLogger } from './integration-logger'

export interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  details?: any
}

export interface TestSuite {
  name: string
  tests: TestResult[]
  passed: boolean
  totalDuration: number
  passedCount: number
  failedCount: number
}

class IntegrationTester {
  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<TestSuite> {
    const startTime = Date.now()
    const tests: TestResult[] = []

    // Test CMS connectivity
    tests.push(await this.testCMSConnectivity())
    
    // Test product API
    tests.push(await this.testProductAPI())
    
    // Test category API
    tests.push(await this.testCategoryAPI())
    
    // Test product detail API
    tests.push(await this.testProductDetailAPI())
    
    // Test fallback mechanism
    tests.push(await this.testFallbackMechanism())
    
    // Test data consistency
    tests.push(await this.testDataConsistency())

    const totalDuration = Date.now() - startTime
    const passedCount = tests.filter(t => t.passed).length
    const failedCount = tests.length - passedCount

    return {
      name: 'CMS Integration Test Suite',
      tests,
      passed: failedCount === 0,
      totalDuration,
      passedCount,
      failedCount
    }
  }

  /**
   * Test CMS connectivity
   */
  private async testCMSConnectivity(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const isHealthy = await cmsApi.healthCheck()
      const duration = Date.now() - startTime

      return {
        name: 'CMS Connectivity',
        passed: isHealthy,
        duration,
        error: isHealthy ? undefined : 'CMS health check failed',
        details: { healthy: isHealthy }
      }
    } catch (error) {
      return {
        name: 'CMS Connectivity',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test product API
   */
  private async testProductAPI(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const result = await cmsApi.getProducts({ limit: 5 })
      const duration = Date.now() - startTime

      const passed = Array.isArray(result.products) && 
                    typeof result.total === 'number' &&
                    result.products.length <= 5

      return {
        name: 'Product API',
        passed,
        duration,
        error: passed ? undefined : 'Invalid product API response',
        details: {
          productsCount: result.products.length,
          total: result.total,
          hasProducts: result.products.length > 0
        }
      }
    } catch (error) {
      return {
        name: 'Product API',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test category API
   */
  private async testCategoryAPI(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const categories = await cmsApi.getCategories()
      const duration = Date.now() - startTime

      const passed = Array.isArray(categories) && categories.length > 0

      return {
        name: 'Category API',
        passed,
        duration,
        error: passed ? undefined : 'Invalid category API response',
        details: {
          categoriesCount: categories.length,
          hasCategories: categories.length > 0
        }
      }
    } catch (error) {
      return {
        name: 'Category API',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test product detail API
   */
  private async testProductDetailAPI(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      // First get a product to test with
      const products = await cmsApi.getProducts({ limit: 1 })
      
      if (products.products.length === 0) {
        return {
          name: 'Product Detail API',
          passed: false,
          duration: Date.now() - startTime,
          error: 'No products available to test with'
        }
      }

      const product = await cmsApi.getProductBySlug(products.products[0].slug)
      const duration = Date.now() - startTime

      const passed = product !== null && 
                    typeof product.id === 'string' &&
                    typeof product.name === 'string'

      return {
        name: 'Product Detail API',
        passed,
        duration,
        error: passed ? undefined : 'Invalid product detail response',
        details: {
          productFound: product !== null,
          productSlug: products.products[0].slug
        }
      }
    } catch (error) {
      return {
        name: 'Product Detail API',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test fallback mechanism
   */
  private async testFallbackMechanism(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      // This test assumes fallback works when CMS is unavailable
      // In a real scenario, we'd temporarily disable CMS access
      
      const status = await syncStatus.checkStatus()
      const duration = Date.now() - startTime

      // If CMS is connected, we can't fully test fallback
      // But we can verify the fallback data exists
      if (status.isConnected) {
        const { productsDatabase } = await import('./product-data')
        const passed = Array.isArray(productsDatabase) && productsDatabase.length > 0

        return {
          name: 'Fallback Mechanism',
          passed,
          duration,
          error: passed ? undefined : 'Fallback data not available',
          details: {
            cmsConnected: true,
            fallbackDataAvailable: passed,
            fallbackProductCount: productsDatabase.length
          }
        }
      } else {
        // CMS is disconnected, test if fallback is working
        const passed = status.dataSource === 'fallback' && status.productsCount > 0

        return {
          name: 'Fallback Mechanism',
          passed,
          duration,
          error: passed ? undefined : 'Fallback mechanism not working',
          details: {
            cmsConnected: false,
            dataSource: status.dataSource,
            productsCount: status.productsCount
          }
        }
      }
    } catch (error) {
      return {
        name: 'Fallback Mechanism',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test data consistency
   */
  private async testDataConsistency(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const [products, categories] = await Promise.all([
        cmsApi.getProducts({ limit: 10 }),
        cmsApi.getCategories()
      ])

      const duration = Date.now() - startTime

      // Check if products have valid categories
      const categoryIds = new Set(categories.map(c => c.id))
      const categorySlugs = new Set(categories.map(c => c.slug))
      
      let consistentProducts = 0
      for (const product of products.products) {
        if (product.categories && product.categories.length > 0) {
          const hasValidCategories = product.categories.some(cat => 
            categoryIds.has(cat.id) || categorySlugs.has(cat.slug)
          )
          if (hasValidCategories) {
            consistentProducts++
          }
        }
      }

      const consistencyRate = products.products.length > 0 
        ? consistentProducts / products.products.length 
        : 1

      const passed = consistencyRate >= 0.8 // 80% consistency threshold

      return {
        name: 'Data Consistency',
        passed,
        duration,
        error: passed ? undefined : 'Data consistency below threshold',
        details: {
          productsChecked: products.products.length,
          consistentProducts,
          consistencyRate: Math.round(consistencyRate * 100),
          categoriesCount: categories.length
        }
      }
    } catch (error) {
      return {
        name: 'Data Consistency',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const integrationTester = new IntegrationTester()

// Convenience function to run tests and log results
export async function runIntegrationTests(): Promise<TestSuite> {
  integrationLogger.info('INTEGRATION_TEST', 'Starting integration test suite')
  
  const results = await integrationTester.runAllTests()
  
  integrationLogger.info('INTEGRATION_TEST', 'Integration test suite completed', {
    passed: results.passed,
    passedCount: results.passedCount,
    failedCount: results.failedCount,
    duration: `${results.totalDuration}ms`
  })

  // Log individual test results
  results.tests.forEach(test => {
    if (test.passed) {
      integrationLogger.info('INTEGRATION_TEST', `✅ ${test.name} passed`, {
        duration: `${test.duration}ms`,
        details: test.details
      })
    } else {
      integrationLogger.error('INTEGRATION_TEST', `❌ ${test.name} failed`, 
        new Error(test.error || 'Unknown error'), {
        duration: `${test.duration}ms`,
        details: test.details
      })
    }
  })

  return results
}