/**
 * Quality Assessor - Evaluates code against Clean Code principles
 */

import { CleanCodePrinciple, Violation, Severity } from '../types';
import { FileAnalysis } from './file-parser';

export interface PrincipleScore {
  principle: CleanCodePrinciple;
  score: number;
  maxScore: number;
  violations: Violation[];
}

export interface QualityReport {
  filePath: string;
  overallScore: number;
  principleScores: Map<CleanCodePrinciple, PrincipleScore>;
  violations: Violation[];
  strengths: string[];
}

export interface OverallQuality {
  totalFiles: number;
  averageScore: number;
  totalViolations: number;
  principleBreakdown: Map<CleanCodePrinciple, number>;
}

export interface QualityAssessor {
  assessFile(analysis: FileAnalysis): QualityReport;
  assessPrinciple(principle: CleanCodePrinciple, analysis: FileAnalysis): PrincipleScore;
  generateOverallScore(reports: QualityReport[]): OverallQuality;
}

/**
 * Clean Code Assessor implementation
 * Evaluates code against Clean Code principles
 */
export class CleanCodeAssessor implements QualityAssessor {
  private readonly MAX_FUNCTION_LINES = 20;
  private readonly MAX_FUNCTION_PARAMETERS = 3;
  private readonly MAX_CYCLOMATIC_COMPLEXITY = 10;
  private readonly MAX_COGNITIVE_COMPLEXITY = 15;
  private readonly MAX_NESTING_DEPTH = 4;
  private readonly MAX_CLASS_METHODS = 10;
  private readonly MAX_CLASS_PROPERTIES = 8;

  assessFile(analysis: FileAnalysis): QualityReport {
    const principleScores = new Map<CleanCodePrinciple, PrincipleScore>();
    const allViolations: Violation[] = [];
    const strengths: string[] = [];

    // Assess each Clean Code principle
    const principles = [
      CleanCodePrinciple.NAMING,
      CleanCodePrinciple.FUNCTIONS,
      CleanCodePrinciple.CLASSES,
      CleanCodePrinciple.COMMENTS,
      CleanCodePrinciple.ERROR_HANDLING
    ];

    for (const principle of principles) {
      const score = this.assessPrinciple(principle, analysis);
      principleScores.set(principle, score);
      allViolations.push(...score.violations);
    }

    // Calculate overall score (weighted average)
    const weights: Record<CleanCodePrinciple, number> = {
      [CleanCodePrinciple.NAMING]: 0.25,
      [CleanCodePrinciple.FUNCTIONS]: 0.25,
      [CleanCodePrinciple.CLASSES]: 0.20,
      [CleanCodePrinciple.COMMENTS]: 0.15,
      [CleanCodePrinciple.ERROR_HANDLING]: 0.15,
      [CleanCodePrinciple.SOLID_PRINCIPLES]: 0.0 // Not implemented yet
    };

    let weightedScore = 0;
    let totalWeight = 0;

    for (const [principle, score] of principleScores) {
      const weight = weights[principle] || 0;
      const normalizedScore = score.maxScore > 0 ? score.score / score.maxScore : 0;
      weightedScore += normalizedScore * weight;
      totalWeight += weight;
    }

    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    // Identify strengths
    for (const [principle, score] of principleScores) {
      const normalizedScore = score.maxScore > 0 ? score.score / score.maxScore : 0;
      if (normalizedScore >= 0.8) {
        strengths.push(`Good ${principle} practices`);
      }
    }

    return {
      filePath: analysis.filePath,
      overallScore,
      principleScores,
      violations: allViolations,
      strengths
    };
  }

  assessPrinciple(principle: CleanCodePrinciple, analysis: FileAnalysis): PrincipleScore {
    switch (principle) {
      case CleanCodePrinciple.NAMING:
        return this.assessNamingPrinciple(analysis);
      case CleanCodePrinciple.FUNCTIONS:
        return this.assessFunctionPrinciple(analysis);
      case CleanCodePrinciple.CLASSES:
        return this.assessClassPrinciple(analysis);
      case CleanCodePrinciple.COMMENTS:
        return this.assessCommentPrinciple(analysis);
      case CleanCodePrinciple.ERROR_HANDLING:
        return this.assessErrorHandlingPrinciple(analysis);
      default:
        return {
          principle,
          score: 0,
          maxScore: 10,
          violations: []
        };
    }
  }

  generateOverallScore(reports: QualityReport[]): OverallQuality {
    if (reports.length === 0) {
      return {
        totalFiles: 0,
        averageScore: 0,
        totalViolations: 0,
        principleBreakdown: new Map()
      };
    }

    const totalScore = reports.reduce((sum, report) => sum + report.overallScore, 0);
    const averageScore = totalScore / reports.length;
    const totalViolations = reports.reduce((sum, report) => sum + report.violations.length, 0);

    // Calculate principle breakdown
    const principleBreakdown = new Map<CleanCodePrinciple, number>();
    const principleCounts = new Map<CleanCodePrinciple, number>();

    for (const report of reports) {
      for (const [principle, score] of report.principleScores) {
        const normalizedScore = score.maxScore > 0 ? score.score / score.maxScore : 0;
        principleBreakdown.set(principle, (principleBreakdown.get(principle) || 0) + normalizedScore);
        principleCounts.set(principle, (principleCounts.get(principle) || 0) + 1);
      }
    }

    // Average the principle scores
    for (const [principle, totalScore] of principleBreakdown) {
      const count = principleCounts.get(principle) || 1;
      principleBreakdown.set(principle, Math.round((totalScore / count) * 10)); // Scale to 0-10
    }

    return {
      totalFiles: reports.length,
      averageScore,
      totalViolations,
      principleBreakdown
    };
  }

  private assessNamingPrinciple(analysis: FileAnalysis): PrincipleScore {
    const violations: Violation[] = [];
    let score = 10;
    const maxScore = 10;

    try {
      // Check if file exists before trying to read it
      if (require('fs').existsSync(analysis.filePath)) {
        // Use naming analyzer to get detailed naming analysis
        const namingAnalyzer = new (require('./naming-analyzer').NamingAnalyzer)(
          require('typescript').createSourceFile(
            analysis.filePath,
            require('fs').readFileSync(analysis.filePath, 'utf-8'),
            require('typescript').ScriptTarget.ES2020,
            true
          )
        );

        const namingResult = namingAnalyzer.analyze();
        
        // Convert naming violations to standard violations
        for (const namingViolation of namingResult.violations) {
          violations.push({
            id: namingViolation.id,
            principle: CleanCodePrinciple.NAMING,
            severity: namingViolation.severity,
            location: namingViolation.location,
            description: namingViolation.description,
            suggestion: namingViolation.suggestion
          });
        }

        // Calculate score based on naming metrics
        const metrics = namingResult.metrics;
        score = Math.max(0, 10 - (violations.length * 0.5));
        
        // Adjust score based on quality metrics
        score *= metrics.averageDescriptiveness;
        score *= metrics.consistencyScore;
        score = Math.round(Math.max(0, Math.min(10, score)));
      } else {
        // Fallback to basic naming assessment if file doesn't exist
        score = this.assessBasicNaming(analysis, violations);
      }
    } catch (error) {
      // Fallback to basic naming assessment if naming analyzer fails
      score = this.assessBasicNaming(analysis, violations);
    }

    return {
      principle: CleanCodePrinciple.NAMING,
      score,
      maxScore,
      violations
    };
  }

  private assessBasicNaming(analysis: FileAnalysis, violations: Violation[]): number {
    let score = 10;

    // Check function names
    for (const func of analysis.functions) {
      if (func.name.length <= 2) {
        violations.push({
          id: `short-name-${func.location.line}`,
          principle: CleanCodePrinciple.NAMING,
          severity: Severity.HIGH,
          location: func.location,
          description: `Function name "${func.name}" is too short`,
          suggestion: `Use a more descriptive name for function "${func.name}"`
        });
        score -= 2;
      }
      
      // Check for single letter names
      if (func.name.length === 1) {
        violations.push({
          id: `single-letter-function-${func.location.line}`,
          principle: CleanCodePrinciple.NAMING,
          severity: Severity.HIGH,
          location: func.location,
          description: `Single letter function name "${func.name}" should be avoided`,
          suggestion: `Use a descriptive name that explains the purpose of "${func.name}"`
        });
        score -= 2;
      }
    }

    // Check class names
    for (const cls of analysis.classes) {
      if (cls.name.length <= 2) {
        violations.push({
          id: `short-class-name-${cls.location.line}`,
          principle: CleanCodePrinciple.NAMING,
          severity: Severity.HIGH,
          location: cls.location,
          description: `Class name "${cls.name}" is too short`,
          suggestion: `Use a more descriptive name for class "${cls.name}"`
        });
        score -= 2;
      }
      
      // Check for single letter names
      if (cls.name.length === 1) {
        violations.push({
          id: `single-letter-class-${cls.location.line}`,
          principle: CleanCodePrinciple.NAMING,
          severity: Severity.HIGH,
          location: cls.location,
          description: `Single letter class name "${cls.name}" should be avoided`,
          suggestion: `Use a descriptive name that explains the purpose of "${cls.name}"`
        });
        score -= 2;
      }
    }

    return Math.max(0, Math.min(10, Math.round(score)));
  }

  private assessFunctionPrinciple(analysis: FileAnalysis): PrincipleScore {
    const violations: Violation[] = [];
    let score = 10;
    const maxScore = 10;

    for (const func of analysis.functions) {
      // Check function size
      if (func.complexity.lineCount > this.MAX_FUNCTION_LINES) {
        violations.push({
          id: `long-function-${func.location.line}`,
          principle: CleanCodePrinciple.FUNCTIONS,
          severity: Severity.MEDIUM,
          location: func.location,
          description: `Function "${func.name}" is too long (${func.complexity.lineCount} lines)`,
          suggestion: `Break down function "${func.name}" into smaller functions (max ${this.MAX_FUNCTION_LINES} lines)`
        });
        score -= 1;
      }

      // Check parameter count
      if (func.parameters.length > this.MAX_FUNCTION_PARAMETERS) {
        violations.push({
          id: `many-parameters-${func.location.line}`,
          principle: CleanCodePrinciple.FUNCTIONS,
          severity: Severity.MEDIUM,
          location: func.location,
          description: `Function "${func.name}" has too many parameters (${func.parameters.length})`,
          suggestion: `Reduce parameters in function "${func.name}" (max ${this.MAX_FUNCTION_PARAMETERS}), consider using an options object`
        });
        score -= 1;
      }

      // Check cyclomatic complexity
      if (func.complexity.cyclomaticComplexity > this.MAX_CYCLOMATIC_COMPLEXITY) {
        violations.push({
          id: `high-complexity-${func.location.line}`,
          principle: CleanCodePrinciple.FUNCTIONS,
          severity: Severity.HIGH,
          location: func.location,
          description: `Function "${func.name}" has high cyclomatic complexity (${func.complexity.cyclomaticComplexity})`,
          suggestion: `Simplify function "${func.name}" by reducing decision points (max ${this.MAX_CYCLOMATIC_COMPLEXITY})`
        });
        score -= 2;
      }

      // Check cognitive complexity
      if (func.complexity.cognitiveComplexity > this.MAX_COGNITIVE_COMPLEXITY) {
        violations.push({
          id: `high-cognitive-complexity-${func.location.line}`,
          principle: CleanCodePrinciple.FUNCTIONS,
          severity: Severity.HIGH,
          location: func.location,
          description: `Function "${func.name}" has high cognitive complexity (${func.complexity.cognitiveComplexity})`,
          suggestion: `Reduce cognitive load in function "${func.name}" by simplifying nested logic (max ${this.MAX_COGNITIVE_COMPLEXITY})`
        });
        score -= 2;
      }

      // Check nesting depth
      if (func.complexity.nestingDepth > this.MAX_NESTING_DEPTH) {
        violations.push({
          id: `deep-nesting-${func.location.line}`,
          principle: CleanCodePrinciple.FUNCTIONS,
          severity: Severity.MEDIUM,
          location: func.location,
          description: `Function "${func.name}" has deep nesting (${func.complexity.nestingDepth} levels)`,
          suggestion: `Reduce nesting in function "${func.name}" using early returns or guard clauses (max ${this.MAX_NESTING_DEPTH} levels)`
        });
        score -= 1;
      }
    }

    return {
      principle: CleanCodePrinciple.FUNCTIONS,
      score: Math.max(0, Math.min(maxScore, score)),
      maxScore,
      violations
    };
  }

  private assessClassPrinciple(analysis: FileAnalysis): PrincipleScore {
    const violations: Violation[] = [];
    let score = 10;
    const maxScore = 10;

    for (const cls of analysis.classes) {
      // Check class size (number of methods)
      if (cls.methods.length > this.MAX_CLASS_METHODS) {
        violations.push({
          id: `large-class-methods-${cls.location.line}`,
          principle: CleanCodePrinciple.CLASSES,
          severity: Severity.MEDIUM,
          location: cls.location,
          description: `Class "${cls.name}" has too many methods (${cls.methods.length})`,
          suggestion: `Split class "${cls.name}" into smaller classes with single responsibilities (max ${this.MAX_CLASS_METHODS} methods)`
        });
        score -= 1.5;
      }

      // Check class size (number of properties)
      if (cls.properties.length > this.MAX_CLASS_PROPERTIES) {
        violations.push({
          id: `large-class-properties-${cls.location.line}`,
          principle: CleanCodePrinciple.CLASSES,
          severity: Severity.MEDIUM,
          location: cls.location,
          description: `Class "${cls.name}" has too many properties (${cls.properties.length})`,
          suggestion: `Reduce properties in class "${cls.name}" by grouping related data (max ${this.MAX_CLASS_PROPERTIES} properties)`
        });
        score -= 1.5;
      }

      // Check cohesion (simplified: methods should use class properties)
      const cohesionScore = this.calculateClassCohesion(cls);
      if (cohesionScore < 0.3) {
        violations.push({
          id: `low-cohesion-${cls.location.line}`,
          principle: CleanCodePrinciple.CLASSES,
          severity: Severity.HIGH,
          location: cls.location,
          description: `Class "${cls.name}" has low cohesion`,
          suggestion: `Improve cohesion in class "${cls.name}" by ensuring methods work with class properties`
        });
        score -= 2;
      }

      // Check for potential God class (too many responsibilities)
      if (cls.methods.length > this.MAX_CLASS_METHODS && cls.properties.length > this.MAX_CLASS_PROPERTIES) {
        violations.push({
          id: `god-class-${cls.location.line}`,
          principle: CleanCodePrinciple.CLASSES,
          severity: Severity.CRITICAL,
          location: cls.location,
          description: `Class "${cls.name}" appears to be a God class with too many responsibilities`,
          suggestion: `Break down class "${cls.name}" into multiple classes, each with a single responsibility`
        });
        score -= 3;
      }
    }

    return {
      principle: CleanCodePrinciple.CLASSES,
      score: Math.max(0, Math.min(maxScore, score)),
      maxScore,
      violations
    };
  }

  private calculateClassCohesion(cls: any): number {
    if (cls.properties.length === 0 || cls.methods.length === 0) {
      return 1; // Perfect cohesion for empty classes
    }

    // Simplified cohesion calculation
    // In a real implementation, this would analyze method bodies to see property usage
    // For now, we'll use a heuristic based on naming patterns
    let cohesiveConnections = 0;
    let totalPossibleConnections = cls.methods.length * cls.properties.length;

    for (const method of cls.methods) {
      for (const property of cls.properties) {
        // Simple heuristic: if method name contains property name or vice versa
        if (method.name.toLowerCase().includes(property.toLowerCase()) ||
            property.toLowerCase().includes(method.name.toLowerCase())) {
          cohesiveConnections++;
        }
      }
    }

    return totalPossibleConnections > 0 ? cohesiveConnections / totalPossibleConnections : 1;
  }

  private assessCommentPrinciple(analysis: FileAnalysis): PrincipleScore {
    const violations: Violation[] = [];
    let score = 10;
    const maxScore = 10;

    try {
      if (!require('fs').existsSync(analysis.filePath)) {
        // If file doesn't exist, give a neutral score
        return {
          principle: CleanCodePrinciple.COMMENTS,
          score: 7,
          maxScore,
          violations
        };
      }
      
      const sourceCode = require('fs').readFileSync(analysis.filePath, 'utf-8');
      const comments = this.extractComments(sourceCode);

      for (const comment of comments) {
        // Check for unnecessary comments (obvious statements)
        if (this.isObviousComment(comment.text)) {
          violations.push({
            id: `obvious-comment-${comment.line}`,
            principle: CleanCodePrinciple.COMMENTS,
            severity: Severity.LOW,
            location: {
              filePath: analysis.filePath,
              line: comment.line,
              column: comment.column
            },
            description: `Comment is obvious and unnecessary: "${comment.text.trim()}"`,
            suggestion: `Remove obvious comment or make it more meaningful`
          });
          score -= 0.5;
        }

        // Check for TODO/FIXME comments (technical debt indicators)
        if (this.isTechnicalDebtComment(comment.text)) {
          violations.push({
            id: `technical-debt-comment-${comment.line}`,
            principle: CleanCodePrinciple.COMMENTS,
            severity: Severity.MEDIUM,
            location: {
              filePath: analysis.filePath,
              line: comment.line,
              column: comment.column
            },
            description: `Technical debt comment found: "${comment.text.trim()}"`,
            suggestion: `Address the technical debt or create a proper issue to track it`
          });
          score -= 1;
        }

        // Check for commented-out code
        if (this.isCommentedOutCode(comment.text)) {
          violations.push({
            id: `commented-code-${comment.line}`,
            principle: CleanCodePrinciple.COMMENTS,
            severity: Severity.MEDIUM,
            location: {
              filePath: analysis.filePath,
              line: comment.line,
              column: comment.column
            },
            description: `Commented-out code found`,
            suggestion: `Remove commented-out code or use version control instead`
          });
          score -= 1;
        }
      }
    } catch (error) {
      // If we can't read the file, give a neutral score
      score = 7;
    }

    return {
      principle: CleanCodePrinciple.COMMENTS,
      score: Math.max(0, Math.min(maxScore, score)),
      maxScore,
      violations
    };
  }

  private extractComments(sourceCode: string): Array<{text: string, line: number, column: number}> {
    const comments: Array<{text: string, line: number, column: number}> = [];
    const lines = sourceCode.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Single line comments
      const singleLineMatch = line.match(/\/\/(.*)$/);
      if (singleLineMatch) {
        comments.push({
          text: singleLineMatch[1],
          line: i + 1,
          column: line.indexOf('//') + 1
        });
      }

      // Multi-line comments (simplified - doesn't handle all edge cases)
      const multiLineStart = line.indexOf('/*');
      if (multiLineStart !== -1) {
        const multiLineEnd = line.indexOf('*/', multiLineStart);
        if (multiLineEnd !== -1) {
          // Single line /* */ comment
          const commentText = line.substring(multiLineStart + 2, multiLineEnd);
          comments.push({
            text: commentText,
            line: i + 1,
            column: multiLineStart + 1
          });
        }
      }
    }

    return comments;
  }

  private isObviousComment(commentText: string): boolean {
    const text = commentText.toLowerCase().trim();
    
    // Common obvious comment patterns
    const obviousPatterns = [
      /^(this|the)\s+(method|function)\s+(adds?|returns?|gets?|sets?)/,
      /^(return|returns?)\s+(the|a)\s+/,
      /^(add|adds?)\s+(two|a|the)\s+/,
      /^(get|gets?|set|sets?)\s+(the|a)\s+/,
      /^(increment|decrement)s?\s+(the|a)\s+/,
      /^(check|checks?)\s+(if|whether)\s+/
    ];

    return obviousPatterns.some(pattern => pattern.test(text));
  }

  private isTechnicalDebtComment(commentText: string): boolean {
    const text = commentText.toLowerCase().trim();
    return text.startsWith('todo') || text.startsWith('fixme') || 
           text.startsWith('hack') || text.startsWith('note:');
  }

  private isCommentedOutCode(commentText: string): boolean {
    const text = commentText.trim();
    
    // Look for code patterns in comments
    const codePatterns = [
      /^\s*(const|let|var)\s+\w+/,
      /^\s*(function|class|interface)\s+\w+/,
      /^\s*(if|for|while|switch)\s*\(/,
      /^\s*\w+\s*\([^)]*\)\s*[{;]/,
      /^\s*\w+\.\w+/,
      /^\s*return\s+/
    ];

    return codePatterns.some(pattern => pattern.test(text));
  }

  private assessErrorHandlingPrinciple(analysis: FileAnalysis): PrincipleScore {
    const violations: Violation[] = [];
    let score = 10;
    const maxScore = 10;

    try {
      if (!require('fs').existsSync(analysis.filePath)) {
        // If file doesn't exist, give a neutral score
        return {
          principle: CleanCodePrinciple.ERROR_HANDLING,
          score: 7,
          maxScore,
          violations
        };
      }
      
      const sourceCode = require('fs').readFileSync(analysis.filePath, 'utf-8');
      
      // Check for proper error handling patterns
      const hasThrowStatements = /throw\s+/.test(sourceCode);
      const hasTryCatchBlocks = /try\s*{[\s\S]*?}\s*catch/.test(sourceCode);
      const hasErrorTypes = /Error\s*\(/.test(sourceCode);

      // Check for functions that might need error handling
      for (const func of analysis.functions) {
        const isAsync = func.isAsync;
        const hasComplexLogic = func.complexity.cyclomaticComplexity > 3;

        if ((isAsync || hasComplexLogic) && !hasTryCatchBlocks && !hasThrowStatements) {
          violations.push({
            id: `missing-error-handling-${func.location.line}`,
            principle: CleanCodePrinciple.ERROR_HANDLING,
            severity: Severity.MEDIUM,
            location: func.location,
            description: `Function "${func.name}" may need error handling`,
            suggestion: `Consider adding proper error handling to function "${func.name}"`
          });
          score -= 1;
        }
      }

      // Check for generic error messages
      const genericErrorPattern = /Error\s*\(\s*["'](error|failed|invalid)["']\s*\)/gi;
      const genericErrors = sourceCode.match(genericErrorPattern);
      if (genericErrors && genericErrors.length > 0) {
        violations.push({
          id: `generic-error-messages`,
          principle: CleanCodePrinciple.ERROR_HANDLING,
          severity: Severity.LOW,
          location: {
            filePath: analysis.filePath,
            line: 1,
            column: 1
          },
          description: `Found ${genericErrors.length} generic error message(s)`,
          suggestion: `Use more specific and descriptive error messages`
        });
        score -= genericErrors.length * 0.5;
      }

    } catch (error) {
      // If we can't analyze error handling, give a neutral score
      score = 7;
    }

    return {
      principle: CleanCodePrinciple.ERROR_HANDLING,
      score: Math.max(0, Math.min(maxScore, score)),
      maxScore,
      violations
    };
  }
}