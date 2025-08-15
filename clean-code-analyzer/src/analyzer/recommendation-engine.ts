/**
 * Recommendation Engine - Generates actionable improvement suggestions
 */

import { 
  Recommendation, 
  Violation, 
  EffortLevel, 
  ImpactLevel, 
  RefactoringType, 
  CleanCodePrinciple 
} from '../types';
import { FileAnalysis } from './file-parser';

export interface EffortEstimate {
  timeHours: number;
  complexity: EffortLevel;
  riskLevel: ImpactLevel;
  prerequisites: string[];
}

export interface PrioritizedPlan {
  recommendations: Recommendation[];
  totalEffort: EffortEstimate;
  phases: RecommendationPhase[];
}

export interface RecommendationPhase {
  name: string;
  recommendations: Recommendation[];
  estimatedEffort: EffortEstimate;
  dependencies: string[];
}

export interface EffortEstimationContext {
  fileAnalysis?: FileAnalysis;
  codebaseMetrics?: CodebaseMetrics;
  testCoverage?: TestCoverageInfo;
  usageFrequency?: UsageFrequencyInfo;
  dependencyGraph?: DependencyGraph;
}

export interface CodebaseMetrics {
  totalFiles: number;
  totalLines: number;
  averageComplexity: number;
  hotspotFiles: string[];
}

export interface TestCoverageInfo {
  overallCoverage: number;
  fileCoverage: Map<string, number>;
  functionCoverage: Map<string, number>;
}

export interface UsageFrequencyInfo {
  functionCallCounts: Map<string, number>;
  classUsageCounts: Map<string, number>;
  fileAccessCounts: Map<string, number>;
}

export interface DependencyGraph {
  fileDependencies: Map<string, string[]>;
  functionDependencies: Map<string, string[]>;
  classDependencies: Map<string, string[]>;
}

export interface RecommendationEngine {
  generateRecommendations(violations: Violation[]): Recommendation[];
  prioritizeRecommendations(recommendations: Recommendation[]): PrioritizedPlan;
  estimateEffort(recommendation: Recommendation): EffortEstimate;
}

/**
 * Clean Code Recommendation Engine Implementation
 * Generates specific, actionable refactoring recommendations based on violations
 */
export class CleanCodeRecommendationEngine implements RecommendationEngine {
  private recommendationCounter = 0;

  /**
   * Generate recommendations based on detected violations
   */
  generateRecommendations(violations: Violation[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const violation of violations) {
      const recommendation = this.createRecommendationFromViolation(violation);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  /**
   * Prioritize recommendations into a structured plan
   */
  prioritizeRecommendations(recommendations: Recommendation[]): PrioritizedPlan {
    // Sort recommendations by impact and effort
    const sortedRecommendations = [...recommendations].sort((a, b) => {
      // First by impact (high impact first)
      const impactOrder = { [ImpactLevel.HIGH]: 3, [ImpactLevel.MEDIUM]: 2, [ImpactLevel.LOW]: 1 };
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;

      // Then by effort (low effort first)
      const effortOrder = { [EffortLevel.SMALL]: 1, [EffortLevel.MEDIUM]: 2, [EffortLevel.LARGE]: 3 };
      return effortOrder[a.effort] - effortOrder[b.effort];
    });

    // Group into phases
    const phases = this.groupIntoPhases(sortedRecommendations);

    // Calculate total effort
    const totalEffort = this.calculateTotalEffort(recommendations);

    return {
      recommendations: sortedRecommendations,
      totalEffort,
      phases
    };
  }

  /**
   * Estimate effort for a recommendation based on complexity, impact, and risk factors
   */
  estimateEffort(recommendation: Recommendation, context?: EffortEstimationContext): EffortEstimate {
    const baseEffort = this.calculateBaseEffort(recommendation);
    const complexityMultiplier = this.calculateComplexityMultiplier(recommendation, context);
    const impactMultiplier = this.calculateImpactMultiplier(recommendation, context);
    const riskMultiplier = this.calculateRiskMultiplier(recommendation, context);
    
    // Calculate final time estimate
    const adjustedTimeHours = Math.round(baseEffort * complexityMultiplier * impactMultiplier * riskMultiplier);
    
    // Determine overall complexity and risk levels
    const complexity = this.determineEffortComplexity(adjustedTimeHours, complexityMultiplier);
    const riskLevel = this.determineRiskLevel(recommendation, context, riskMultiplier);
    
    // Gather prerequisites based on the recommendation and context
    const prerequisites = this.gatherRecommendationPrerequisites(recommendation, context);
    
    return {
      timeHours: Math.max(1, adjustedTimeHours), // Minimum 1 hour
      complexity,
      riskLevel,
      prerequisites
    };
  }

  /**
   * Create a recommendation from a violation
   */
  private createRecommendationFromViolation(violation: Violation): Recommendation | null {
    const recommendationId = `rec-${++this.recommendationCounter}`;

    switch (violation.principle) {
      case CleanCodePrinciple.NAMING:
        return this.createNamingRecommendation(recommendationId, violation);
      
      case CleanCodePrinciple.FUNCTIONS:
        return this.createFunctionRecommendation(recommendationId, violation);
      
      case CleanCodePrinciple.CLASSES:
        return this.createClassRecommendation(recommendationId, violation);
      
      case CleanCodePrinciple.COMMENTS:
        return this.createCommentRecommendation(recommendationId, violation);
      
      case CleanCodePrinciple.ERROR_HANDLING:
        return this.createErrorHandlingRecommendation(recommendationId, violation);
      
      default:
        return null;
    }
  }

  /**
   * Create naming-related recommendations
   */
  private createNamingRecommendation(id: string, violation: Violation): Recommendation {
    if (violation.description.includes('too short')) {
      return {
        id,
        type: RefactoringType.RENAME,
        description: `Rename function to use a more descriptive name`,
        beforeCode: this.extractFunctionFromViolation(violation, 'shortName'),
        afterCode: this.generateDescriptiveNameExample(violation),
        principle: CleanCodePrinciple.NAMING,
        effort: EffortLevel.SMALL,
        impact: ImpactLevel.MEDIUM,
        dependencies: []
      };
    }

    if (violation.description.includes('single letter')) {
      return {
        id,
        type: RefactoringType.RENAME,
        description: `Replace single-letter variable with descriptive name`,
        beforeCode: this.extractVariableFromViolation(violation),
        afterCode: this.generateDescriptiveVariableExample(violation),
        principle: CleanCodePrinciple.NAMING,
        effort: EffortLevel.SMALL,
        impact: ImpactLevel.HIGH,
        dependencies: []
      };
    }

    // Default naming recommendation
    return {
      id,
      type: RefactoringType.RENAME,
      description: `Improve naming to be more descriptive and meaningful`,
      beforeCode: `// Current unclear naming`,
      afterCode: `// Use descriptive, searchable names`,
      principle: CleanCodePrinciple.NAMING,
      effort: EffortLevel.SMALL,
      impact: ImpactLevel.MEDIUM,
      dependencies: []
    };
  }

  /**
   * Create function-related recommendations
   */
  private createFunctionRecommendation(id: string, violation: Violation): Recommendation {
    if (violation.description.includes('too long')) {
      return {
        id,
        type: RefactoringType.EXTRACT_METHOD,
        description: `Break down large function into smaller, focused methods`,
        beforeCode: this.generateLongFunctionExample(violation),
        afterCode: this.generateExtractedMethodsExample(violation),
        principle: CleanCodePrinciple.FUNCTIONS,
        effort: EffortLevel.MEDIUM,
        impact: ImpactLevel.HIGH,
        dependencies: []
      };
    }

    if (violation.description.includes('cyclomatic complexity')) {
      return {
        id,
        type: RefactoringType.EXTRACT_METHOD,
        description: `Reduce complexity by extracting methods and simplifying logic`,
        beforeCode: this.generateComplexFunctionExample(violation),
        afterCode: this.generateSimplifiedFunctionExample(violation),
        principle: CleanCodePrinciple.FUNCTIONS,
        effort: EffortLevel.LARGE,
        impact: ImpactLevel.HIGH,
        dependencies: []
      };
    }

    if (violation.description.includes('too many parameters')) {
      return {
        id,
        type: RefactoringType.REDUCE_PARAMETERS,
        description: `Reduce parameter count using options object or function splitting`,
        beforeCode: this.generateManyParametersExample(violation),
        afterCode: this.generateOptionsObjectExample(violation),
        principle: CleanCodePrinciple.FUNCTIONS,
        effort: EffortLevel.MEDIUM,
        impact: ImpactLevel.MEDIUM,
        dependencies: []
      };
    }

    // Default function recommendation
    return {
      id,
      type: RefactoringType.EXTRACT_METHOD,
      description: `Improve function design and structure`,
      beforeCode: `// Current function structure`,
      afterCode: `// Improved function structure`,
      principle: CleanCodePrinciple.FUNCTIONS,
      effort: EffortLevel.MEDIUM,
      impact: ImpactLevel.MEDIUM,
      dependencies: []
    };
  }

  /**
   * Create class-related recommendations
   */
  private createClassRecommendation(id: string, violation: Violation): Recommendation {
    if (violation.description.includes('too large')) {
      return {
        id,
        type: RefactoringType.SPLIT_CLASS,
        description: `Split large class into smaller classes with single responsibilities`,
        beforeCode: this.generateLargeClassExample(violation),
        afterCode: this.generateSplitClassExample(violation),
        principle: CleanCodePrinciple.CLASSES,
        effort: EffortLevel.LARGE,
        impact: ImpactLevel.HIGH,
        dependencies: []
      };
    }

    // Default class recommendation
    return {
      id,
      type: RefactoringType.SPLIT_CLASS,
      description: `Improve class design and cohesion`,
      beforeCode: `// Current class structure`,
      afterCode: `// Improved class structure`,
      principle: CleanCodePrinciple.CLASSES,
      effort: EffortLevel.MEDIUM,
      impact: ImpactLevel.MEDIUM,
      dependencies: []
    };
  }

  /**
   * Create comment-related recommendations
   */
  private createCommentRecommendation(id: string, violation: Violation): Recommendation {
    return {
      id,
      type: RefactoringType.REMOVE_DEAD_CODE,
      description: `Remove unnecessary comments and improve code self-documentation`,
      beforeCode: `// TODO: This function does something
function doSomething() {
  // Increment counter
  counter++;
}`,
      afterCode: `function incrementCounter() {
  counter++;
}`,
      principle: CleanCodePrinciple.COMMENTS,
      effort: EffortLevel.SMALL,
      impact: ImpactLevel.LOW,
      dependencies: []
    };
  }

  /**
   * Create error handling recommendations
   */
  private createErrorHandlingRecommendation(id: string, violation: Violation): Recommendation {
    return {
      id,
      type: RefactoringType.IMPROVE_ERROR_HANDLING,
      description: `Improve error handling consistency and robustness`,
      beforeCode: `function processData(data) {
  // No error handling
  return data.process();
}`,
      afterCode: `function processData(data: Data): ProcessedData {
  if (!data) {
    throw new Error('Data is required');
  }
  
  try {
    return data.process();
  } catch (error) {
    throw new ProcessingError('Failed to process data', error);
  }
}`,
      principle: CleanCodePrinciple.ERROR_HANDLING,
      effort: EffortLevel.MEDIUM,
      impact: ImpactLevel.HIGH,
      dependencies: []
    };
  }

  /**
   * Group recommendations into implementation phases
   */
  private groupIntoPhases(recommendations: Recommendation[]): RecommendationPhase[] {
    const quickWins = recommendations.filter(r => 
      r.effort === EffortLevel.SMALL && r.impact !== ImpactLevel.LOW
    );
    
    const structuralImprovements = recommendations.filter(r => 
      r.effort === EffortLevel.MEDIUM || 
      (r.effort === EffortLevel.SMALL && r.impact === ImpactLevel.LOW)
    );
    
    const majorRefactoring = recommendations.filter(r => 
      r.effort === EffortLevel.LARGE
    );

    const phases: RecommendationPhase[] = [];

    if (quickWins.length > 0) {
      phases.push({
        name: 'Phase 1: Quick Wins',
        recommendations: quickWins,
        estimatedEffort: this.calculateTotalEffort(quickWins),
        dependencies: []
      });
    }

    if (structuralImprovements.length > 0) {
      phases.push({
        name: 'Phase 2: Structural Improvements',
        recommendations: structuralImprovements,
        estimatedEffort: this.calculateTotalEffort(structuralImprovements),
        dependencies: quickWins.length > 0 ? ['Phase 1: Quick Wins'] : []
      });
    }

    if (majorRefactoring.length > 0) {
      phases.push({
        name: 'Phase 3: Major Refactoring',
        recommendations: majorRefactoring,
        estimatedEffort: this.calculateTotalEffort(majorRefactoring),
        dependencies: phases.length > 0 ? [phases[phases.length - 1].name] : []
      });
    }

    return phases;
  }

  /**
   * Calculate total effort for a set of recommendations
   */
  private calculateTotalEffort(recommendations: Recommendation[], context?: EffortEstimationContext): EffortEstimate {
    if (recommendations.length === 0) {
      return {
        timeHours: 0,
        complexity: EffortLevel.SMALL,
        riskLevel: ImpactLevel.LOW,
        prerequisites: []
      };
    }

    // Calculate individual efforts and sum them
    const individualEfforts = recommendations.map(rec => this.estimateEffort(rec, context));
    const totalHours = individualEfforts.reduce((sum, effort) => sum + effort.timeHours, 0);

    // Determine overall complexity and risk
    const complexity = this.determineOverallComplexity(recommendations);
    const riskLevel = this.determineOverallRisk(recommendations);

    // Gather all prerequisites
    const allPrerequisites = new Set<string>();
    individualEfforts.forEach(effort => {
      effort.prerequisites.forEach(prereq => allPrerequisites.add(prereq));
    });

    // Add coordination overhead for multiple recommendations
    const coordinationOverhead = recommendations.length > 1 ? Math.ceil(recommendations.length * 0.5) : 0;

    return {
      timeHours: totalHours + coordinationOverhead,
      complexity,
      riskLevel,
      prerequisites: Array.from(allPrerequisites)
    };
  }

  /**
   * Determine overall complexity level
   */
  private determineOverallComplexity(recommendations: Recommendation[]): EffortLevel {
    const hasLarge = recommendations.some(r => r.effort === EffortLevel.LARGE);
    const mediumCount = recommendations.filter(r => r.effort === EffortLevel.MEDIUM).length;

    if (hasLarge || mediumCount > 5) return EffortLevel.LARGE;
    if (mediumCount >= 1) return EffortLevel.MEDIUM;
    return EffortLevel.SMALL;
  }

  /**
   * Determine overall risk level
   */
  private determineOverallRisk(recommendations: Recommendation[]): ImpactLevel {
    const hasHigh = recommendations.some(r => r.impact === ImpactLevel.HIGH);
    const mediumCount = recommendations.filter(r => r.impact === ImpactLevel.MEDIUM).length;

    if (hasHigh || mediumCount > 5) return ImpactLevel.HIGH;
    if (mediumCount > 2) return ImpactLevel.MEDIUM;
    return ImpactLevel.LOW;
  }

  /**
   * Gather prerequisites from all recommendations
   */
  private gatherPrerequisites(recommendations: Recommendation[]): string[] {
    const prerequisites = new Set<string>();
    
    for (const rec of recommendations) {
      rec.dependencies.forEach(dep => prerequisites.add(dep));
    }

    // Add common prerequisites based on recommendation types
    const hasComplexRefactoring = recommendations.some(r => 
      r.type === RefactoringType.SPLIT_CLASS || 
      r.type === RefactoringType.EXTRACT_METHOD
    );

    if (hasComplexRefactoring) {
      prerequisites.add('Comprehensive test coverage');
      prerequisites.add('Code review approval');
    }

    return Array.from(prerequisites);
  }

  // Helper methods for generating code examples

  private extractFunctionFromViolation(violation: Violation, placeholder: string): string {
    return `function ${placeholder}() {
  // Function implementation
  return result;
}`;
  }

  private generateDescriptiveNameExample(violation: Violation): string {
    return `function calculateUserAccountBalance() {
  // Function implementation
  return result;
}`;
  }

  private extractVariableFromViolation(violation: Violation): string {
    return `for (let i = 0; i < items.length; i++) {
  const x = items[i];
  processItem(x);
}`;
  }

  private generateDescriptiveVariableExample(violation: Violation): string {
    return `for (let index = 0; index < items.length; index++) {
  const currentItem = items[index];
  processItem(currentItem);
}`;
  }

  private generateLongFunctionExample(violation: Violation): string {
    return `function processUserData(userData) {
  // 25+ lines of mixed responsibilities
  // Validation logic
  // Data transformation
  // Database operations
  // Email notifications
  // Logging
  return result;
}`;
  }

  private generateExtractedMethodsExample(violation: Violation): string {
    return `function processUserData(userData) {
  const validatedData = validateUserData(userData);
  const transformedData = transformUserData(validatedData);
  const savedData = saveUserData(transformedData);
  sendNotificationEmail(savedData);
  logUserDataProcessing(savedData);
  return savedData;
}

function validateUserData(userData) { /* ... */ }
function transformUserData(data) { /* ... */ }
function saveUserData(data) { /* ... */ }`;
  }

  private generateComplexFunctionExample(violation: Violation): string {
    return `function complexCalculation(a, b, c, type) {
  if (type === 'A') {
    if (a > 0) {
      if (b > 0) {
        return a * b + c;
      } else {
        return a - c;
      }
    } else {
      return c;
    }
  } else if (type === 'B') {
    // More nested conditions...
  }
}`;
  }

  private generateSimplifiedFunctionExample(violation: Violation): string {
    return `function complexCalculation(a, b, c, type) {
  const calculator = getCalculatorForType(type);
  return calculator.calculate(a, b, c);
}

function getCalculatorForType(type) {
  const calculators = {
    'A': new TypeACalculator(),
    'B': new TypeBCalculator()
  };
  return calculators[type] || new DefaultCalculator();
}`;
  }

  private generateManyParametersExample(violation: Violation): string {
    return `function createUser(name, email, age, address, phone, preferences, settings) {
  // Function implementation
}`;
  }

  private generateOptionsObjectExample(violation: Violation): string {
    return `interface CreateUserOptions {
  name: string;
  email: string;
  age: number;
  address: string;
  phone: string;
  preferences: UserPreferences;
  settings: UserSettings;
}

function createUser(options: CreateUserOptions) {
  // Function implementation
}`;
  }

  private generateLargeClassExample(violation: Violation): string {
    return `class UserManager {
  // 15+ methods handling:
  // User CRUD operations
  // Authentication
  // Email notifications
  // File uploads
  // Reporting
  // Caching
}`;
  }

  private generateSplitClassExample(violation: Violation): string {
    return `class UserRepository {
  // User CRUD operations
}

class UserAuthenticator {
  // Authentication logic
}

class UserNotificationService {
  // Email notifications
}

class UserManager {
  constructor(
    private userRepo: UserRepository,
    private authenticator: UserAuthenticator,
    private notificationService: UserNotificationService
  ) {}
}`;
  }

  // Effort Estimation Helper Methods

  /**
   * Calculate base effort hours for different refactoring types
   */
  private calculateBaseEffort(recommendation: Recommendation): number {
    const baseEffortHours: Record<RefactoringType, number> = {
      [RefactoringType.RENAME]: 1,
      [RefactoringType.EXTRACT_METHOD]: 4,
      [RefactoringType.REDUCE_PARAMETERS]: 3,
      [RefactoringType.SPLIT_CLASS]: 12,
      [RefactoringType.REMOVE_DEAD_CODE]: 1,
      [RefactoringType.IMPROVE_ERROR_HANDLING]: 6,
      [RefactoringType.ADD_TESTS]: 8
    };

    return baseEffortHours[recommendation.type] || 4;
  }

  /**
   * Calculate complexity multiplier based on code metrics
   */
  private calculateComplexityMultiplier(recommendation: Recommendation, context?: EffortEstimationContext): number {
    let multiplier = 1.0;

    if (!context?.fileAnalysis) {
      return multiplier;
    }

    const analysis = context.fileAnalysis;

    // Factor in file complexity
    if (analysis.complexity.cyclomaticComplexity > 15) {
      multiplier *= 1.5;
    } else if (analysis.complexity.cyclomaticComplexity > 10) {
      multiplier *= 1.2;
    }

    // Factor in cognitive complexity
    if (analysis.complexity.cognitiveComplexity > 20) {
      multiplier *= 1.4;
    } else if (analysis.complexity.cognitiveComplexity > 15) {
      multiplier *= 1.2;
    }

    // Factor in file size
    if (analysis.lineCount > 500) {
      multiplier *= 1.6;
    } else if (analysis.lineCount > 200) {
      multiplier *= 1.3;
    }

    // Factor in number of functions/classes
    const totalElements = analysis.functions.length + analysis.classes.length;
    if (totalElements > 20) {
      multiplier *= 1.4;
    } else if (totalElements > 10) {
      multiplier *= 1.2;
    }

    // Factor in nesting depth
    if (analysis.complexity.nestingDepth > 5) {
      multiplier *= 1.3;
    } else if (analysis.complexity.nestingDepth > 3) {
      multiplier *= 1.1;
    }

    return Math.min(multiplier, 3.0); // Cap at 3x multiplier
  }

  /**
   * Calculate impact multiplier based on usage frequency and codebase metrics
   */
  private calculateImpactMultiplier(recommendation: Recommendation, context?: EffortEstimationContext): number {
    let multiplier = 1.0;

    // Base multiplier on recommendation impact level
    switch (recommendation.impact) {
      case ImpactLevel.HIGH:
        multiplier = 1.5;
        break;
      case ImpactLevel.MEDIUM:
        multiplier = 1.2;
        break;
      case ImpactLevel.LOW:
        multiplier = 1.0;
        break;
    }

    if (!context) {
      return multiplier;
    }

    // Factor in usage frequency
    if (context.usageFrequency && context.fileAnalysis) {
      const filePath = context.fileAnalysis.filePath;
      const fileAccessCount = context.usageFrequency.fileAccessCounts.get(filePath) || 0;
      
      // High usage files require more careful refactoring
      if (fileAccessCount > 100) {
        multiplier *= 1.4;
      } else if (fileAccessCount > 50) {
        multiplier *= 1.2;
      }

      // Check function usage for function-related refactoring
      if (recommendation.type === RefactoringType.EXTRACT_METHOD || 
          recommendation.type === RefactoringType.RENAME) {
        const avgFunctionUsage = Array.from(context.usageFrequency.functionCallCounts.values())
          .reduce((sum, count) => sum + count, 0) / context.usageFrequency.functionCallCounts.size || 0;
        
        if (avgFunctionUsage > 50) {
          multiplier *= 1.3;
        } else if (avgFunctionUsage > 20) {
          multiplier *= 1.1;
        }
      }
    }

    // Factor in codebase size
    if (context.codebaseMetrics) {
      const metrics = context.codebaseMetrics;
      
      // Larger codebases require more coordination
      if (metrics.totalFiles > 100) {
        multiplier *= 1.3;
      } else if (metrics.totalFiles > 50) {
        multiplier *= 1.1;
      }

      // Check if file is a hotspot
      if (context.fileAnalysis && metrics.hotspotFiles.includes(context.fileAnalysis.filePath)) {
        multiplier *= 1.5;
      }
    }

    return Math.min(multiplier, 2.5); // Cap at 2.5x multiplier
  }

  /**
   * Calculate risk multiplier based on test coverage and dependencies
   */
  private calculateRiskMultiplier(recommendation: Recommendation, context?: EffortEstimationContext): number {
    let multiplier = 1.0;

    if (!context) {
      return multiplier;
    }

    // Factor in test coverage
    if (context.testCoverage && context.fileAnalysis) {
      const filePath = context.fileAnalysis.filePath;
      const fileCoverage = context.testCoverage.fileCoverage.get(filePath) || 0;
      
      // Low test coverage increases risk and effort
      if (fileCoverage < 0.3) {
        multiplier *= 2.0; // High risk
      } else if (fileCoverage < 0.6) {
        multiplier *= 1.5; // Medium risk
      } else if (fileCoverage < 0.8) {
        multiplier *= 1.2; // Low risk
      }
      // Good coverage (>80%) doesn't increase multiplier
    } else {
      // No test coverage info assumes medium risk
      multiplier *= 1.3;
    }

    // Factor in dependencies
    if (context.dependencyGraph && context.fileAnalysis) {
      const filePath = context.fileAnalysis.filePath;
      const dependencies = context.dependencyGraph.fileDependencies.get(filePath) || [];
      
      // More dependencies increase coordination effort
      if (dependencies.length > 10) {
        multiplier *= 1.4;
      } else if (dependencies.length > 5) {
        multiplier *= 1.2;
      }

      // Check for circular dependencies (high risk)
      const hasCircularDeps = this.hasCircularDependencies(filePath, context.dependencyGraph);
      if (hasCircularDeps) {
        multiplier *= 1.6;
      }
    }

    // Factor in refactoring type risk
    const riskFactors: Record<RefactoringType, number> = {
      [RefactoringType.RENAME]: 1.0, // Low risk
      [RefactoringType.REMOVE_DEAD_CODE]: 1.1, // Low risk
      [RefactoringType.REDUCE_PARAMETERS]: 1.3, // Medium risk
      [RefactoringType.EXTRACT_METHOD]: 1.4, // Medium risk
      [RefactoringType.IMPROVE_ERROR_HANDLING]: 1.5, // Medium-high risk
      [RefactoringType.SPLIT_CLASS]: 2.0, // High risk
      [RefactoringType.ADD_TESTS]: 1.2 // Low-medium risk
    };

    multiplier *= riskFactors[recommendation.type] || 1.0;

    return Math.min(multiplier, 4.0); // Cap at 4x multiplier
  }

  /**
   * Determine effort complexity level based on adjusted time and multipliers
   */
  private determineEffortComplexity(timeHours: number, complexityMultiplier: number): EffortLevel {
    if (timeHours > 16 || complexityMultiplier > 2.0) {
      return EffortLevel.LARGE;
    } else if (timeHours > 6 || complexityMultiplier > 1.5) {
      return EffortLevel.MEDIUM;
    } else {
      return EffortLevel.SMALL;
    }
  }

  /**
   * Determine risk level based on recommendation and context
   */
  private determineRiskLevel(recommendation: Recommendation, context?: EffortEstimationContext, riskMultiplier?: number): ImpactLevel {
    // Start with recommendation's impact level
    let riskLevel = recommendation.impact;

    // Adjust based on risk multiplier
    if (riskMultiplier && riskMultiplier > 2.5) {
      riskLevel = ImpactLevel.HIGH;
    } else if (riskMultiplier && riskMultiplier > 1.8) {
      riskLevel = riskLevel === ImpactLevel.LOW ? ImpactLevel.MEDIUM : ImpactLevel.HIGH;
    }

    // Factor in test coverage
    if (context?.testCoverage && context?.fileAnalysis) {
      const filePath = context.fileAnalysis.filePath;
      const coverage = context.testCoverage.fileCoverage.get(filePath) || 0;
      
      if (coverage < 0.3) {
        riskLevel = ImpactLevel.HIGH;
      } else if (coverage < 0.6 && riskLevel === ImpactLevel.LOW) {
        riskLevel = ImpactLevel.MEDIUM;
      }
    }

    // Factor in dependencies
    if (context?.dependencyGraph && context?.fileAnalysis) {
      const filePath = context.fileAnalysis.filePath;
      const dependencies = context.dependencyGraph.fileDependencies.get(filePath) || [];
      
      if (dependencies.length > 10) {
        riskLevel = riskLevel === ImpactLevel.LOW ? ImpactLevel.MEDIUM : ImpactLevel.HIGH;
      }
    }

    return riskLevel;
  }

  /**
   * Gather prerequisites for a recommendation based on context
   */
  private gatherRecommendationPrerequisites(recommendation: Recommendation, context?: EffortEstimationContext): string[] {
    const prerequisites = new Set<string>();

    // Add existing dependencies
    recommendation.dependencies.forEach(dep => prerequisites.add(dep));

    // Add prerequisites based on refactoring type
    switch (recommendation.type) {
      case RefactoringType.SPLIT_CLASS:
      case RefactoringType.EXTRACT_METHOD:
        prerequisites.add('Comprehensive test coverage');
        prerequisites.add('Code review approval');
        prerequisites.add('Backup of current implementation');
        break;
      
      case RefactoringType.RENAME:
        prerequisites.add('Search and replace validation');
        prerequisites.add('IDE refactoring tool verification');
        break;
      
      case RefactoringType.REDUCE_PARAMETERS:
        prerequisites.add('Caller analysis');
        prerequisites.add('Backward compatibility assessment');
        break;
      
      case RefactoringType.IMPROVE_ERROR_HANDLING:
        prerequisites.add('Error handling strategy review');
        prerequisites.add('Exception hierarchy design');
        break;
    }

    // Add prerequisites based on context
    if (context?.testCoverage && context?.fileAnalysis) {
      const filePath = context.fileAnalysis.filePath;
      const coverage = context.testCoverage.fileCoverage.get(filePath) || 0;
      
      if (coverage < 0.5) {
        prerequisites.add('Increase test coverage to at least 50%');
      }
      
      if (coverage < 0.3) {
        prerequisites.add('Create comprehensive test suite');
      }
    }

    // Add prerequisites for high-dependency files
    if (context?.dependencyGraph && context?.fileAnalysis) {
      const filePath = context.fileAnalysis.filePath;
      const dependencies = context.dependencyGraph.fileDependencies.get(filePath) || [];
      
      if (dependencies.length > 5) {
        prerequisites.add('Dependency impact analysis');
      }
      
      if (dependencies.length > 10) {
        prerequisites.add('Staged rollout plan');
        prerequisites.add('Rollback strategy');
      }
    }

    // Add prerequisites for high-usage files
    if (context?.usageFrequency && context?.fileAnalysis) {
      const filePath = context.fileAnalysis.filePath;
      const accessCount = context.usageFrequency.fileAccessCounts.get(filePath) || 0;
      
      if (accessCount > 50) {
        prerequisites.add('Performance impact assessment');
      }
      
      if (accessCount > 100) {
        prerequisites.add('Load testing validation');
        prerequisites.add('Monitoring and alerting setup');
      }
    }

    // Add prerequisites for large codebases
    if (context?.codebaseMetrics) {
      if (context.codebaseMetrics.totalFiles > 100) {
        prerequisites.add('Cross-team coordination');
      }
      
      if (context.fileAnalysis && context.codebaseMetrics.hotspotFiles.includes(context.fileAnalysis.filePath)) {
        prerequisites.add('Hotspot file special handling');
        prerequisites.add('Extended testing period');
      }
    }

    return Array.from(prerequisites);
  }

  /**
   * Check for circular dependencies in the dependency graph
   */
  private hasCircularDependencies(filePath: string, dependencyGraph: DependencyGraph): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (currentFile: string): boolean => {
      if (recursionStack.has(currentFile)) {
        return true; // Cycle detected
      }
      
      if (visited.has(currentFile)) {
        return false; // Already processed
      }

      visited.add(currentFile);
      recursionStack.add(currentFile);

      const dependencies = dependencyGraph.fileDependencies.get(currentFile) || [];
      for (const dependency of dependencies) {
        if (hasCycle(dependency)) {
          return true;
        }
      }

      recursionStack.delete(currentFile);
      return false;
    };

    return hasCycle(filePath);
  }
}