/**
 * Integration Test API
 * Runs integration tests and returns results
 */

import { NextRequest, NextResponse } from 'next/server'
import { runIntegrationTests } from '@/app/lib/integration-test'

export async function GET(request: NextRequest) {
  try {
    const testResults = await runIntegrationTests()
    
    return NextResponse.json({
      success: true,
      results: testResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error running integration tests:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run integration tests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testName } = await request.json()
    
    if (testName) {
      // Run specific test (future enhancement)
      return NextResponse.json(
        { error: 'Specific test execution not yet implemented' },
        { status: 501 }
      )
    }

    // Run all tests
    const testResults = await runIntegrationTests()
    
    return NextResponse.json({
      success: true,
      results: testResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error running integration tests:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run integration tests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}