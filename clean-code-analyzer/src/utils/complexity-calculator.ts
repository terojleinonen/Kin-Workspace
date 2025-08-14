/**
 * Complexity calculation utilities
 */

import * as ts from 'typescript';
import { ComplexityMetrics } from '../types';

/**
 * Calculate comprehensive complexity metrics for a code block using AST analysis
 * @param content - The source code content to analyze
 * @param filePath - Optional file path for context (defaults to 'temp.ts')
 */
export function calculateComplexity(content: string, filePath: string = 'temp.ts'): ComplexityMetrics {
  // Use AST-based analysis for accurate metrics
  return calculateASTComplexity(content, filePath);
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
 * Calculate nesting depth from indentation (legacy method)
 * This is a simplified version - use calculateNestingDepthFromAST for accurate results
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

/**
 * Calculate comprehensive complexity metrics using AST analysis
 */
export function calculateASTComplexity(content: string, filePath: string): ComplexityMetrics {
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.ES2020,
    true
  );

  let cyclomaticComplexity = 0;
  let cognitiveComplexity = 0;
  let maxNestingDepth = 0;
  let totalParameterCount = 0;
  let functionCount = 0;

  const visit = (node: ts.Node, nestingLevel: number = 0) => {
    // Track maximum nesting depth
    maxNestingDepth = Math.max(maxNestingDepth, nestingLevel);

    // Analyze functions
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || 
        ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      
      functionCount++;
      const functionMetrics = calculateFunctionComplexity(node, nestingLevel);
      cyclomaticComplexity += functionMetrics.cyclomaticComplexity;
      cognitiveComplexity += functionMetrics.cognitiveComplexity;
      totalParameterCount += functionMetrics.parameterCount;
      maxNestingDepth = Math.max(maxNestingDepth, functionMetrics.nestingDepth + nestingLevel);
      
      // Don't traverse into function bodies here, they're handled by calculateFunctionComplexity
      return;
    }

    // Determine if this node increases nesting level (exclude generic blocks)
    const increasesNesting = ts.isIfStatement(node) || ts.isWhileStatement(node) ||
                            ts.isForStatement(node) || ts.isForInStatement(node) ||
                            ts.isForOfStatement(node) || ts.isDoStatement(node) ||
                            ts.isTryStatement(node) || ts.isSwitchStatement(node) ||
                            ts.isCatchClause(node);

    const newNestingLevel = increasesNesting ? nestingLevel + 1 : nestingLevel;

    ts.forEachChild(node, child => visit(child, newNestingLevel));
  };

  visit(sourceFile);

  const lineCount = content.trim() === '' ? 0 : content.split('\n').length;

  return {
    cyclomaticComplexity: functionCount > 0 ? Math.round(cyclomaticComplexity / functionCount) : 1,
    cognitiveComplexity: functionCount > 0 ? Math.round(cognitiveComplexity / functionCount) : 0,
    nestingDepth: maxNestingDepth,
    lineCount,
    parameterCount: functionCount > 0 ? Math.round(totalParameterCount / functionCount) : 0
  };
}

/**
 * Count logical operators in an expression (for cyclomatic complexity)
 * Each && and || adds 1 to complexity
 */
function countLogicalOperators(node: ts.Node): number {
  let count = 0;
  
  const visit = (node: ts.Node) => {
    if (ts.isBinaryExpression(node) && 
        (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
         node.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
      count++;
    }
    ts.forEachChild(node, visit);
  };
  
  visit(node);
  return count;
}

/**
 * Calculate cyclomatic complexity for a specific function node
 */
function calculateFunctionComplexity(node: ts.Node, baseNestingLevel: number = 0): ComplexityMetrics {
  let cyclomaticComplexity = 1; // Base complexity
  let cognitiveComplexity = 0;
  let maxNestingDepth = baseNestingLevel;
  let parameterCount = 0;

  // Count parameters
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || 
      ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    parameterCount = node.parameters.length;
  }

  // Calculate line count for this function
  const sourceFile = node.getSourceFile();
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  const lineCount = end.line - start.line + 1;

  const visit = (node: ts.Node, nestingLevel: number = baseNestingLevel) => {
    maxNestingDepth = Math.max(maxNestingDepth, nestingLevel);

    // Cyclomatic complexity - decision points
    if (ts.isIfStatement(node)) {
      cyclomaticComplexity++;
      cognitiveComplexity += Math.max(1, nestingLevel - baseNestingLevel + 1);
    } else if (ts.isConditionalExpression(node)) {
      cyclomaticComplexity++;
      cognitiveComplexity += Math.max(1, nestingLevel - baseNestingLevel + 1);
    } else if (ts.isWhileStatement(node) || ts.isForStatement(node) ||
               ts.isForInStatement(node) || ts.isForOfStatement(node) ||
               ts.isDoStatement(node)) {
      cyclomaticComplexity++;
      cognitiveComplexity += Math.max(1, nestingLevel - baseNestingLevel + 1);
    } else if (ts.isSwitchStatement(node)) {
      // Switch statement itself doesn't add complexity, but cases do
      cognitiveComplexity += Math.max(1, nestingLevel - baseNestingLevel + 1);
    } else if (ts.isCaseClause(node)) {
      cyclomaticComplexity++;
    } else if (ts.isCatchClause(node)) {
      cyclomaticComplexity++;
      cognitiveComplexity += Math.max(1, nestingLevel - baseNestingLevel + 1);
    }

    // Logical operators - count each && and || as +1 complexity
    if (ts.isBinaryExpression(node) && 
        (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
         node.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
      cyclomaticComplexity++;
      cognitiveComplexity++;
    }

    // Increase nesting depth for certain constructs
    const shouldIncreaseDepth = ts.isIfStatement(node) || ts.isWhileStatement(node) ||
                                ts.isForStatement(node) || ts.isForInStatement(node) ||
                                ts.isForOfStatement(node) || ts.isDoStatement(node) ||
                                ts.isTryStatement(node) || ts.isSwitchStatement(node) ||
                                ts.isCatchClause(node);

    ts.forEachChild(node, child => visit(child, shouldIncreaseDepth ? nestingLevel + 1 : nestingLevel));
  };

  visit(node);

  return {
    cyclomaticComplexity,
    cognitiveComplexity,
    nestingDepth: maxNestingDepth - baseNestingLevel,
    lineCount,
    parameterCount
  };
}

/**
 * Calculate cognitive complexity with nesting penalties
 */
export function calculateCognitiveComplexity(content: string, filePath: string): number {
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.ES2020,
    true
  );

  let totalCognitiveComplexity = 0;

  const visit = (node: ts.Node, nestingLevel: number = 0) => {
    // Cognitive complexity increments
    if (ts.isIfStatement(node) || ts.isConditionalExpression(node) ||
        ts.isWhileStatement(node) || ts.isForStatement(node) ||
        ts.isForInStatement(node) || ts.isForOfStatement(node) ||
        ts.isDoStatement(node) || ts.isSwitchStatement(node) ||
        ts.isCatchClause(node)) {
      totalCognitiveComplexity += Math.max(1, nestingLevel + 1);
    }

    // Logical operators add flat complexity
    if (ts.isBinaryExpression(node) && 
        (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
         node.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
      totalCognitiveComplexity++;
    }

    // Increase nesting for certain constructs
    const shouldIncreaseNesting = ts.isIfStatement(node) || ts.isWhileStatement(node) ||
                                  ts.isForStatement(node) || ts.isForInStatement(node) ||
                                  ts.isForOfStatement(node) || ts.isDoStatement(node) ||
                                  ts.isTryStatement(node) || ts.isSwitchStatement(node);

    ts.forEachChild(node, child => visit(child, shouldIncreaseNesting ? nestingLevel + 1 : nestingLevel));
  };

  visit(sourceFile);
  return totalCognitiveComplexity;
}

/**
 * Calculate function size metrics
 */
export function calculateFunctionSize(content: string, filePath: string): { lineCount: number; parameterCount: number } {
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.ES2020,
    true
  );

  let totalLines = 0;
  let totalParams = 0;
  let functionCount = 0;

  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || 
        ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      
      functionCount++;
      totalParams += node.parameters.length;
      
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
      totalLines += (end.line - start.line + 1);
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  // If no functions found, return file-level metrics
  if (functionCount === 0) {
    return {
      lineCount: content.trim() === '' ? 0 : content.split('\n').length,
      parameterCount: 0
    };
  }

  return {
    lineCount: Math.round(totalLines / functionCount),
    parameterCount: Math.round(totalParams / functionCount)
  };
}

/**
 * Calculate nesting depth using AST traversal
 */
export function calculateNestingDepthFromAST(content: string, filePath: string): number {
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.ES2020,
    true
  );

  let maxDepth = 0;

  const visit = (node: ts.Node, depth: number = 0) => {
    maxDepth = Math.max(maxDepth, depth);

    // Increase depth for nesting constructs (exclude generic blocks)
    const increasesDepth = ts.isIfStatement(node) || ts.isWhileStatement(node) ||
                          ts.isForStatement(node) || ts.isForInStatement(node) ||
                          ts.isForOfStatement(node) || ts.isDoStatement(node) ||
                          ts.isTryStatement(node) || ts.isSwitchStatement(node) ||
                          ts.isCatchClause(node);

    ts.forEachChild(node, child => visit(child, increasesDepth ? depth + 1 : depth));
  };

  visit(sourceFile);
  return maxDepth;
}