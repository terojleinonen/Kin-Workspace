/**
 * Complexity calculation utilities
 */

import { ComplexityMetrics } from '../types';

/**
 * Calculate basic complexity metrics for a code block
 * This is a placeholder implementation that will be enhanced in later tasks
 */
export function calculateComplexity(content: string): ComplexityMetrics {
  // Basic line counting for now - will be enhanced with AST analysis
  const lines = content.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  
  return {
    cyclomaticComplexity: 1, // Placeholder - will be calculated from AST
    cognitiveComplexity: 1, // Placeholder - will be calculated from AST
    nestingDepth: 0, // Placeholder - will be calculated from AST
    lineCount: nonEmptyLines.length,
    parameterCount: 0 // Placeholder - will be calculated from function signatures
  };
}

/**
 * Estimate cyclomatic complexity from basic patterns
 * This is a simplified version - full implementation will use AST
 */
export function estimateCyclomaticComplexity(content: string): number {
  // Count decision points (if, while, for, case, catch, &&, ||)
  const decisionPatterns = [
    /\bif\s*\(/g,
    /\bwhile\s*\(/g,
    /\bfor\s*\(/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
    /&&/g,
    /\|\|/g
  ];
  
  let complexity = 1; // Base complexity
  
  for (const pattern of decisionPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }
  
  return complexity;
}

/**
 * Calculate nesting depth from indentation
 * This is a simplified version - full implementation will use AST
 */
export function calculateNestingDepth(content: string): number {
  const lines = content.split('\n');
  let maxDepth = 0;
  
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.length === 0) continue;
    
    const indentation = line.length - trimmed.length;
    const depth = Math.floor(indentation / 2); // Assuming 2-space indentation
    maxDepth = Math.max(maxDepth, depth);
  }
  
  return maxDepth;
}