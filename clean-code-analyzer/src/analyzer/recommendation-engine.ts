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
   * Estimate effort for a recommendation (placeholder for task 5.2)
   */
  estimateEffort(_recommendation: Recommendation): EffortEstimate {
    // This will be implemented in task 5.2
    throw new Error('Not implemented yet - will be implemented in task 5.2');
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
  private calculateTotalEffort(recommendations: Recommendation[]): EffortEstimate {
    const effortHours = {
      [EffortLevel.SMALL]: 2,
      [EffortLevel.MEDIUM]: 8,
      [EffortLevel.LARGE]: 24
    };

    const totalHours = recommendations.reduce((total, rec) => {
      return total + effortHours[rec.effort];
    }, 0);

    const complexity = this.determineOverallComplexity(recommendations);
    const riskLevel = this.determineOverallRisk(recommendations);

    return {
      timeHours: totalHours,
      complexity,
      riskLevel,
      prerequisites: this.gatherPrerequisites(recommendations)
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
}