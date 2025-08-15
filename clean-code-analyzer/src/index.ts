/**
 * Clean Code Analyzer - Main Entry Point
 * 
 * A comprehensive tool for analyzing and improving code quality
 * according to Clean Code principles.
 */

export * from './analyzer';
export * from './utils';
export * from './cli';

// Re-export specific types to avoid conflicts
export {
  CleanCodePrinciple,
  Severity,
  EffortLevel,
  ImpactLevel,
  RefactoringType,
  CodeLocation,
  ComplexityMetrics,
  Violation,
  Recommendation
} from './types';

// Version information
export const VERSION = '1.0.0';