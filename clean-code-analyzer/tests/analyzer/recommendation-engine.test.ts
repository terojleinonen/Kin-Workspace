/**
 * Tests for Recommendation Engine
 */

import { 
  CleanCodeRecommendationEngine, 
  EffortEstimate, 
  PrioritizedPlan,
  EffortEstimationContext 
} from '../../src/analyzer/recommendation-engine';
import { 
  Violation, 
  Recommendation, 
  CleanCodePrinciple, 
  Severity, 
  EffortLevel, 
  ImpactLevel, 
  RefactoringType 
} from '../../src/types';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}

expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

describe('CleanCodeRecommendationEngine', () => {
  let engine: CleanCodeRecommendationEngine;

  beforeEach(() => {
    engine = new CleanCodeRecommendationEngine();
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for naming violations', () => {
      const violations: Violation[] = [
        {
          id: 'v1',
          principle: CleanCodePrinciple.NAMING,
          severity: Severity.MEDIUM,
          location: { filePath: 'test.ts', line: 1, column: 1 },
          description: 'Function name "fn" is too short (2 characters)',
          suggestion: 'Use a more descriptive name'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe(RefactoringType.RENAME);
      expect(recommendations[0].principle).toBe(CleanCodePrinciple.NAMING);
      expect(recommendations[0].effort).toBe(EffortLevel.SMALL);
      expect(recommendations[0].impact).toBe(ImpactLevel.MEDIUM);
    });

    it('should generate recommendations for single letter variables', () => {
      const violations: Violation[] = [
        {
          id: 'v2',
          principle: CleanCodePrinciple.NAMING,
          severity: Severity.HIGH,
          location: { filePath: 'test.ts', line: 5, column: 10 },
          description: 'Variable "x" uses single letter naming',
          suggestion: 'Use a descriptive name instead of "x"'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe(RefactoringType.RENAME);
      expect(recommendations[0].impact).toBe(ImpactLevel.HIGH);
      expect(recommendations[0].beforeCode).toContain('const x = items[i]');
      expect(recommendations[0].afterCode).toContain('const currentItem = items[index]');
    });

    it('should generate recommendations for long functions', () => {
      const violations: Violation[] = [
        {
          id: 'v3',
          principle: CleanCodePrinciple.FUNCTIONS,
          severity: Severity.MEDIUM,
          location: { filePath: 'test.ts', line: 10, column: 1 },
          description: 'Function "processData" is too long (25 lines, max 20)',
          suggestion: 'Break down "processData" into smaller, focused functions'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe(RefactoringType.EXTRACT_METHOD);
      expect(recommendations[0].principle).toBe(CleanCodePrinciple.FUNCTIONS);
      expect(recommendations[0].effort).toBe(EffortLevel.MEDIUM);
      expect(recommendations[0].impact).toBe(ImpactLevel.HIGH);
    });

    it('should generate recommendations for high complexity functions', () => {
      const violations: Violation[] = [
        {
          id: 'v4',
          principle: CleanCodePrinciple.FUNCTIONS,
          severity: Severity.HIGH,
          location: { filePath: 'test.ts', line: 15, column: 1 },
          description: 'Function "calculate" has high cyclomatic complexity (15, max 10)',
          suggestion: 'Simplify "calculate" by reducing decision points'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe(RefactoringType.EXTRACT_METHOD);
      expect(recommendations[0].effort).toBe(EffortLevel.LARGE);
      expect(recommendations[0].impact).toBe(ImpactLevel.HIGH);
    });

    it('should generate recommendations for functions with too many parameters', () => {
      const violations: Violation[] = [
        {
          id: 'v5',
          principle: CleanCodePrinciple.FUNCTIONS,
          severity: Severity.MEDIUM,
          location: { filePath: 'test.ts', line: 20, column: 1 },
          description: 'Function "createUser" has too many parameters (7, max 3)',
          suggestion: 'Reduce parameters by using an options object'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe(RefactoringType.REDUCE_PARAMETERS);
      expect(recommendations[0].effort).toBe(EffortLevel.MEDIUM);
      expect(recommendations[0].impact).toBe(ImpactLevel.MEDIUM);
      expect(recommendations[0].afterCode).toContain('CreateUserOptions');
    });

    it('should generate recommendations for large classes', () => {
      const violations: Violation[] = [
        {
          id: 'v6',
          principle: CleanCodePrinciple.CLASSES,
          severity: Severity.MEDIUM,
          location: { filePath: 'test.ts', line: 25, column: 1 },
          description: 'Class "UserManager" is too large: 15 methods (max 10)',
          suggestion: 'Split "UserManager" into smaller classes'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe(RefactoringType.SPLIT_CLASS);
      expect(recommendations[0].principle).toBe(CleanCodePrinciple.CLASSES);
      expect(recommendations[0].effort).toBe(EffortLevel.LARGE);
      expect(recommendations[0].impact).toBe(ImpactLevel.HIGH);
    });

    it('should generate recommendations for comment violations', () => {
      const violations: Violation[] = [
        {
          id: 'v7',
          principle: CleanCodePrinciple.COMMENTS,
          severity: Severity.LOW,
          location: { filePath: 'test.ts', line: 30, column: 1 },
          description: 'Unnecessary comment detected',
          suggestion: 'Remove redundant comment'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe(RefactoringType.REMOVE_DEAD_CODE);
      expect(recommendations[0].principle).toBe(CleanCodePrinciple.COMMENTS);
      expect(recommendations[0].effort).toBe(EffortLevel.SMALL);
    });

    it('should generate recommendations for error handling violations', () => {
      const violations: Violation[] = [
        {
          id: 'v8',
          principle: CleanCodePrinciple.ERROR_HANDLING,
          severity: Severity.HIGH,
          location: { filePath: 'test.ts', line: 35, column: 1 },
          description: 'Missing error handling',
          suggestion: 'Add proper error handling'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe(RefactoringType.IMPROVE_ERROR_HANDLING);
      expect(recommendations[0].principle).toBe(CleanCodePrinciple.ERROR_HANDLING);
      expect(recommendations[0].effort).toBe(EffortLevel.MEDIUM);
      expect(recommendations[0].impact).toBe(ImpactLevel.HIGH);
    });

    it('should handle empty violations array', () => {
      const recommendations = engine.generateRecommendations([]);
      expect(recommendations).toHaveLength(0);
    });

    it('should handle unknown violation principles', () => {
      const violations: Violation[] = [
        {
          id: 'v9',
          principle: 'unknown' as CleanCodePrinciple,
          severity: Severity.LOW,
          location: { filePath: 'test.ts', line: 1, column: 1 },
          description: 'Unknown violation',
          suggestion: 'Fix unknown issue'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);
      expect(recommendations).toHaveLength(0);
    });
  });

  describe('prioritizeRecommendations', () => {
    it('should prioritize recommendations by impact and effort', () => {
      const recommendations: Recommendation[] = [
        {
          id: 'r1',
          type: RefactoringType.RENAME,
          description: 'Low impact, small effort',
          beforeCode: '',
          afterCode: '',
          principle: CleanCodePrinciple.NAMING,
          effort: EffortLevel.SMALL,
          impact: ImpactLevel.LOW,
          dependencies: []
        },
        {
          id: 'r2',
          type: RefactoringType.EXTRACT_METHOD,
          description: 'High impact, large effort',
          beforeCode: '',
          afterCode: '',
          principle: CleanCodePrinciple.FUNCTIONS,
          effort: EffortLevel.LARGE,
          impact: ImpactLevel.HIGH,
          dependencies: []
        },
        {
          id: 'r3',
          type: RefactoringType.RENAME,
          description: 'High impact, small effort',
          beforeCode: '',
          afterCode: '',
          principle: CleanCodePrinciple.NAMING,
          effort: EffortLevel.SMALL,
          impact: ImpactLevel.HIGH,
          dependencies: []
        }
      ];

      const plan = engine.prioritizeRecommendations(recommendations);

      // High impact should come first, then low effort within same impact
      expect(plan.recommendations[0].id).toBe('r3'); // High impact, small effort
      expect(plan.recommendations[1].id).toBe('r2'); // High impact, large effort
      expect(plan.recommendations[2].id).toBe('r1'); // Low impact, small effort
    });

    it('should group recommendations into phases', () => {
      const recommendations: Recommendation[] = [
        {
          id: 'r1',
          type: RefactoringType.RENAME,
          description: 'Quick win',
          beforeCode: '',
          afterCode: '',
          principle: CleanCodePrinciple.NAMING,
          effort: EffortLevel.SMALL,
          impact: ImpactLevel.HIGH,
          dependencies: []
        },
        {
          id: 'r2',
          type: RefactoringType.EXTRACT_METHOD,
          description: 'Structural improvement',
          beforeCode: '',
          afterCode: '',
          principle: CleanCodePrinciple.FUNCTIONS,
          effort: EffortLevel.MEDIUM,
          impact: ImpactLevel.MEDIUM,
          dependencies: []
        },
        {
          id: 'r3',
          type: RefactoringType.SPLIT_CLASS,
          description: 'Major refactoring',
          beforeCode: '',
          afterCode: '',
          principle: CleanCodePrinciple.CLASSES,
          effort: EffortLevel.LARGE,
          impact: ImpactLevel.HIGH,
          dependencies: []
        }
      ];

      const plan = engine.prioritizeRecommendations(recommendations);

      expect(plan.phases).toHaveLength(3);
      expect(plan.phases[0].name).toBe('Phase 1: Quick Wins');
      expect(plan.phases[0].recommendations).toHaveLength(1);
      expect(plan.phases[0].recommendations[0].id).toBe('r1');

      expect(plan.phases[1].name).toBe('Phase 2: Structural Improvements');
      expect(plan.phases[1].recommendations).toHaveLength(1);
      expect(plan.phases[1].recommendations[0].id).toBe('r2');

      expect(plan.phases[2].name).toBe('Phase 3: Major Refactoring');
      expect(plan.phases[2].recommendations).toHaveLength(1);
      expect(plan.phases[2].recommendations[0].id).toBe('r3');
    });

    it('should calculate total effort correctly', () => {
      const recommendations: Recommendation[] = [
        {
          id: 'r1',
          type: RefactoringType.RENAME,
          description: 'Small effort',
          beforeCode: '',
          afterCode: '',
          principle: CleanCodePrinciple.NAMING,
          effort: EffortLevel.SMALL,
          impact: ImpactLevel.MEDIUM,
          dependencies: []
        },
        {
          id: 'r2',
          type: RefactoringType.EXTRACT_METHOD,
          description: 'Medium effort',
          beforeCode: '',
          afterCode: '',
          principle: CleanCodePrinciple.FUNCTIONS,
          effort: EffortLevel.MEDIUM,
          impact: ImpactLevel.HIGH,
          dependencies: []
        }
      ];

      const plan = engine.prioritizeRecommendations(recommendations);

      // With new effort estimation: Rename (1h * multipliers) + Extract Method (4h * multipliers) + coordination overhead
      expect(plan.totalEffort.timeHours).toBeGreaterThanOrEqual(5); // At least base efforts
      expect(plan.totalEffort.timeHours).toBeLessThanOrEqual(20); // Reasonable upper bound
      expect(plan.totalEffort.complexity).toBe(EffortLevel.MEDIUM);
    });

    it('should set phase dependencies correctly', () => {
      const recommendations: Recommendation[] = [
        {
          id: 'r1',
          type: RefactoringType.RENAME,
          description: 'Quick win',
          beforeCode: '',
          afterCode: '',
          principle: CleanCodePrinciple.NAMING,
          effort: EffortLevel.SMALL,
          impact: ImpactLevel.HIGH,
          dependencies: []
        },
        {
          id: 'r2',
          type: RefactoringType.SPLIT_CLASS,
          description: 'Major refactoring',
          beforeCode: '',
          afterCode: '',
          principle: CleanCodePrinciple.CLASSES,
          effort: EffortLevel.LARGE,
          impact: ImpactLevel.HIGH,
          dependencies: []
        }
      ];

      const plan = engine.prioritizeRecommendations(recommendations);

      expect(plan.phases).toHaveLength(2);
      expect(plan.phases[0].dependencies).toHaveLength(0);
      expect(plan.phases[1].dependencies).toContain('Phase 1: Quick Wins');
    });

    it('should handle empty recommendations array', () => {
      const plan = engine.prioritizeRecommendations([]);

      expect(plan.recommendations).toHaveLength(0);
      expect(plan.phases).toHaveLength(0);
      expect(plan.totalEffort.timeHours).toBe(0);
    });

    it('should add prerequisites for complex refactoring', () => {
      const recommendations: Recommendation[] = [
        {
          id: 'r1',
          type: RefactoringType.SPLIT_CLASS,
          description: 'Split class',
          beforeCode: '',
          afterCode: '',
          principle: CleanCodePrinciple.CLASSES,
          effort: EffortLevel.LARGE,
          impact: ImpactLevel.HIGH,
          dependencies: []
        }
      ];

      const plan = engine.prioritizeRecommendations(recommendations);

      expect(plan.totalEffort.prerequisites).toContain('Comprehensive test coverage');
      expect(plan.totalEffort.prerequisites).toContain('Code review approval');
    });
  });

  describe('estimateEffort', () => {
    it('should calculate base effort for rename refactoring', () => {
      const recommendation: Recommendation = {
        id: 'r1',
        type: RefactoringType.RENAME,
        description: 'Rename variable',
        beforeCode: '',
        afterCode: '',
        principle: CleanCodePrinciple.NAMING,
        effort: EffortLevel.SMALL,
        impact: ImpactLevel.MEDIUM,
        dependencies: []
      };

      const estimate = engine.estimateEffort(recommendation);

      expect(estimate.timeHours).toBeGreaterThanOrEqual(1);
      expect(estimate.complexity).toBe(EffortLevel.SMALL);
      expect(estimate.riskLevel).toBe(ImpactLevel.MEDIUM);
      expect(estimate.prerequisites).toContain('Search and replace validation');
    });

    it('should calculate base effort for extract method refactoring', () => {
      const recommendation: Recommendation = {
        id: 'r2',
        type: RefactoringType.EXTRACT_METHOD,
        description: 'Extract method',
        beforeCode: '',
        afterCode: '',
        principle: CleanCodePrinciple.FUNCTIONS,
        effort: EffortLevel.MEDIUM,
        impact: ImpactLevel.HIGH,
        dependencies: []
      };

      const estimate = engine.estimateEffort(recommendation);

      expect(estimate.timeHours).toBeGreaterThanOrEqual(4);
      expect(estimate.complexity).toBeOneOf([EffortLevel.SMALL, EffortLevel.MEDIUM]);
      expect(estimate.riskLevel).toBe(ImpactLevel.HIGH);
      expect(estimate.prerequisites).toContain('Comprehensive test coverage');
    });

    it('should calculate base effort for split class refactoring', () => {
      const recommendation: Recommendation = {
        id: 'r3',
        type: RefactoringType.SPLIT_CLASS,
        description: 'Split large class',
        beforeCode: '',
        afterCode: '',
        principle: CleanCodePrinciple.CLASSES,
        effort: EffortLevel.LARGE,
        impact: ImpactLevel.HIGH,
        dependencies: []
      };

      const estimate = engine.estimateEffort(recommendation);

      expect(estimate.timeHours).toBeGreaterThanOrEqual(12);
      expect(estimate.complexity).toBeOneOf([EffortLevel.MEDIUM, EffortLevel.LARGE]);
      expect(estimate.riskLevel).toBe(ImpactLevel.HIGH);
      expect(estimate.prerequisites).toContain('Comprehensive test coverage');
      expect(estimate.prerequisites).toContain('Code review approval');
    });

    it('should apply complexity multiplier based on file analysis', () => {
      const recommendation: Recommendation = {
        id: 'r4',
        type: RefactoringType.EXTRACT_METHOD,
        description: 'Extract method from complex file',
        beforeCode: '',
        afterCode: '',
        principle: CleanCodePrinciple.FUNCTIONS,
        effort: EffortLevel.MEDIUM,
        impact: ImpactLevel.HIGH,
        dependencies: []
      };

      const context = {
        fileAnalysis: {
          filePath: 'complex-file.ts',
          functions: Array(15).fill(null).map((_, i) => ({
            name: `func${i}`,
            location: { filePath: 'complex-file.ts', line: i + 1, column: 1 },
            parameters: ['param1', 'param2'],
            complexity: {
              cyclomaticComplexity: 8,
              cognitiveComplexity: 12,
              nestingDepth: 3,
              lineCount: 25,
              parameterCount: 2
            },
            isAsync: false,
            isExported: false
          })),
          classes: [],
          imports: [],
          complexity: {
            cyclomaticComplexity: 20, // High complexity
            cognitiveComplexity: 25,  // High cognitive complexity
            nestingDepth: 6,          // Deep nesting
            lineCount: 600,           // Large file
            parameterCount: 3
          },
          lineCount: 600
        }
      };

      const estimate = engine.estimateEffort(recommendation, context);
      const baseEstimate = engine.estimateEffort(recommendation);

      expect(estimate.timeHours).toBeGreaterThan(baseEstimate.timeHours);
      expect(estimate.complexity).toBeOneOf([EffortLevel.MEDIUM, EffortLevel.LARGE]);
    });

    it('should apply impact multiplier based on usage frequency', () => {
      const recommendation: Recommendation = {
        id: 'r5',
        type: RefactoringType.RENAME,
        description: 'Rename in high-usage file',
        beforeCode: '',
        afterCode: '',
        principle: CleanCodePrinciple.NAMING,
        effort: EffortLevel.SMALL,
        impact: ImpactLevel.HIGH,
        dependencies: []
      };

      const context = {
        fileAnalysis: {
          filePath: 'high-usage-file.ts',
          functions: [],
          classes: [],
          imports: [],
          complexity: {
            cyclomaticComplexity: 5,
            cognitiveComplexity: 8,
            nestingDepth: 2,
            lineCount: 100,
            parameterCount: 2
          },
          lineCount: 100
        },
        usageFrequency: {
          functionCallCounts: new Map([['testFunc', 150]]),
          classUsageCounts: new Map([['TestClass', 80]]),
          fileAccessCounts: new Map([['high-usage-file.ts', 200]]) // High usage
        },
        codebaseMetrics: {
          totalFiles: 150, // Large codebase
          totalLines: 50000,
          averageComplexity: 8,
          hotspotFiles: ['high-usage-file.ts'] // This file is a hotspot
        }
      };

      const estimate = engine.estimateEffort(recommendation, context);
      const baseEstimate = engine.estimateEffort(recommendation);

      expect(estimate.timeHours).toBeGreaterThan(baseEstimate.timeHours);
      expect(estimate.prerequisites).toContain('Performance impact assessment');
    });

    it('should apply risk multiplier based on test coverage', () => {
      const recommendation: Recommendation = {
        id: 'r6',
        type: RefactoringType.SPLIT_CLASS,
        description: 'Split class with low test coverage',
        beforeCode: '',
        afterCode: '',
        principle: CleanCodePrinciple.CLASSES,
        effort: EffortLevel.LARGE,
        impact: ImpactLevel.HIGH,
        dependencies: []
      };

      const context = {
        fileAnalysis: {
          filePath: 'low-coverage-file.ts',
          functions: [],
          classes: [],
          imports: [],
          complexity: {
            cyclomaticComplexity: 10,
            cognitiveComplexity: 15,
            nestingDepth: 3,
            lineCount: 200,
            parameterCount: 3
          },
          lineCount: 200
        },
        testCoverage: {
          overallCoverage: 0.4,
          fileCoverage: new Map([['low-coverage-file.ts', 0.2]]), // Low coverage
          functionCoverage: new Map()
        },
        dependencyGraph: {
          fileDependencies: new Map([['low-coverage-file.ts', Array(12).fill('dep')]]), // Many dependencies
          functionDependencies: new Map(),
          classDependencies: new Map()
        }
      };

      const estimate = engine.estimateEffort(recommendation, context);
      const baseEstimate = engine.estimateEffort(recommendation);

      expect(estimate.timeHours).toBeGreaterThan(baseEstimate.timeHours);
      expect(estimate.riskLevel).toBe(ImpactLevel.HIGH);
      expect(estimate.prerequisites).toContain('Create comprehensive test suite');
      expect(estimate.prerequisites).toContain('Dependency impact analysis');
    });

    it('should handle missing context gracefully', () => {
      const recommendation: Recommendation = {
        id: 'r7',
        type: RefactoringType.IMPROVE_ERROR_HANDLING,
        description: 'Improve error handling',
        beforeCode: '',
        afterCode: '',
        principle: CleanCodePrinciple.ERROR_HANDLING,
        effort: EffortLevel.MEDIUM,
        impact: ImpactLevel.MEDIUM,
        dependencies: ['existing-dependency']
      };

      const estimate = engine.estimateEffort(recommendation);

      expect(estimate.timeHours).toBeGreaterThanOrEqual(1);
      expect(estimate.complexity).toBeOneOf([EffortLevel.SMALL, EffortLevel.MEDIUM, EffortLevel.LARGE]);
      expect(estimate.riskLevel).toBeOneOf([ImpactLevel.LOW, ImpactLevel.MEDIUM, ImpactLevel.HIGH]);
      expect(estimate.prerequisites).toContain('existing-dependency');
      expect(estimate.prerequisites).toContain('Error handling strategy review');
    });

    it('should cap multipliers at reasonable limits', () => {
      const recommendation: Recommendation = {
        id: 'r8',
        type: RefactoringType.EXTRACT_METHOD,
        description: 'Extract from extremely complex file',
        beforeCode: '',
        afterCode: '',
        principle: CleanCodePrinciple.FUNCTIONS,
        effort: EffortLevel.MEDIUM,
        impact: ImpactLevel.HIGH,
        dependencies: []
      };

      const context = {
        fileAnalysis: {
          filePath: 'extreme-file.ts',
          functions: Array(50).fill(null).map((_, i) => ({ 
            name: `func${i}`, 
            location: { filePath: 'extreme-file.ts', line: i + 1, column: 1 },
            parameters: Array(10).fill('param'),
            complexity: {
              cyclomaticComplexity: 50,
              cognitiveComplexity: 100,
              nestingDepth: 10,
              lineCount: 100,
              parameterCount: 10
            },
            isAsync: false,
            isExported: false
          })),
          classes: [],
          imports: [],
          complexity: {
            cyclomaticComplexity: 100, // Extremely high
            cognitiveComplexity: 200,  // Extremely high
            nestingDepth: 15,          // Extremely deep
            lineCount: 2000,           // Extremely large
            parameterCount: 10
          },
          lineCount: 2000
        },
        usageFrequency: {
          functionCallCounts: new Map([['testFunc', 1000]]),
          classUsageCounts: new Map(),
          fileAccessCounts: new Map([['extreme-file.ts', 1000]])
        },
        testCoverage: {
          overallCoverage: 0.1,
          fileCoverage: new Map([['extreme-file.ts', 0.05]]), // Extremely low
          functionCoverage: new Map()
        },
        dependencyGraph: {
          fileDependencies: new Map([['extreme-file.ts', Array(50).fill('dep')]]), // Many deps
          functionDependencies: new Map(),
          classDependencies: new Map()
        },
        codebaseMetrics: {
          totalFiles: 1000, // Huge codebase
          totalLines: 500000,
          averageComplexity: 20,
          hotspotFiles: ['extreme-file.ts']
        }
      };

      const estimate = engine.estimateEffort(recommendation, context);

      // Should be capped at reasonable limits
      expect(estimate.timeHours).toBeLessThan(200); // Reasonable upper bound
      expect(estimate.complexity).toBe(EffortLevel.LARGE);
      expect(estimate.riskLevel).toBe(ImpactLevel.HIGH);
    });

    it('should detect circular dependencies and increase risk', () => {
      const recommendation: Recommendation = {
        id: 'r9',
        type: RefactoringType.SPLIT_CLASS,
        description: 'Split class with circular dependencies',
        beforeCode: '',
        afterCode: '',
        principle: CleanCodePrinciple.CLASSES,
        effort: EffortLevel.LARGE,
        impact: ImpactLevel.MEDIUM,
        dependencies: []
      };

      const context = {
        fileAnalysis: {
          filePath: 'circular-file.ts',
          functions: [],
          classes: [],
          imports: [],
          complexity: {
            cyclomaticComplexity: 8,
            cognitiveComplexity: 12,
            nestingDepth: 3,
            lineCount: 150,
            parameterCount: 2
          },
          lineCount: 150
        },
        dependencyGraph: {
          fileDependencies: new Map([
            ['circular-file.ts', ['dep1.ts', 'dep2.ts']],
            ['dep1.ts', ['dep2.ts']],
            ['dep2.ts', ['circular-file.ts']] // Creates circular dependency
          ]),
          functionDependencies: new Map(),
          classDependencies: new Map()
        },
        testCoverage: {
          overallCoverage: 0.8,
          fileCoverage: new Map([['circular-file.ts', 0.8]]),
          functionCoverage: new Map()
        }
      };

      const estimate = engine.estimateEffort(recommendation, context);
      const baseEstimate = engine.estimateEffort(recommendation);

      expect(estimate.timeHours).toBeGreaterThan(baseEstimate.timeHours);
      expect(estimate.riskLevel).toBeOneOf([ImpactLevel.MEDIUM, ImpactLevel.HIGH]);
    });

    it('should provide different estimates for different refactoring types', () => {
      const baseRecommendation = {
        id: 'base',
        description: 'Base recommendation',
        beforeCode: '',
        afterCode: '',
        principle: CleanCodePrinciple.FUNCTIONS,
        effort: EffortLevel.MEDIUM,
        impact: ImpactLevel.MEDIUM,
        dependencies: []
      };

      const renameEstimate = engine.estimateEffort({
        ...baseRecommendation,
        type: RefactoringType.RENAME
      });

      const extractMethodEstimate = engine.estimateEffort({
        ...baseRecommendation,
        type: RefactoringType.EXTRACT_METHOD
      });

      const splitClassEstimate = engine.estimateEffort({
        ...baseRecommendation,
        type: RefactoringType.SPLIT_CLASS
      });

      expect(renameEstimate.timeHours).toBeLessThan(extractMethodEstimate.timeHours);
      expect(extractMethodEstimate.timeHours).toBeLessThan(splitClassEstimate.timeHours);
    });
  });

  describe('code examples', () => {
    it('should generate meaningful before/after code examples for naming issues', () => {
      const violations: Violation[] = [
        {
          id: 'v1',
          principle: CleanCodePrinciple.NAMING,
          severity: Severity.HIGH,
          location: { filePath: 'test.ts', line: 1, column: 1 },
          description: 'Variable "x" uses single letter naming',
          suggestion: 'Use descriptive name'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);
      const rec = recommendations[0];

      expect(rec.beforeCode).toContain('const x = items[i]');
      expect(rec.afterCode).toContain('const currentItem = items[index]');
    });

    it('should generate meaningful before/after code examples for parameter reduction', () => {
      const violations: Violation[] = [
        {
          id: 'v1',
          principle: CleanCodePrinciple.FUNCTIONS,
          severity: Severity.MEDIUM,
          location: { filePath: 'test.ts', line: 1, column: 1 },
          description: 'Function "createUser" has too many parameters (7, max 3)',
          suggestion: 'Use options object'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);
      const rec = recommendations[0];

      expect(rec.beforeCode).toContain('function createUser(name, email, age, address, phone, preferences, settings)');
      expect(rec.afterCode).toContain('interface CreateUserOptions');
      expect(rec.afterCode).toContain('function createUser(options: CreateUserOptions)');
    });

    it('should generate meaningful before/after code examples for class splitting', () => {
      const violations: Violation[] = [
        {
          id: 'v1',
          principle: CleanCodePrinciple.CLASSES,
          severity: Severity.MEDIUM,
          location: { filePath: 'test.ts', line: 1, column: 1 },
          description: 'Class "UserManager" is too large: 15 methods (max 10)',
          suggestion: 'Split class'
        }
      ];

      const recommendations = engine.generateRecommendations(violations);
      const rec = recommendations[0];

      expect(rec.beforeCode).toContain('class UserManager');
      expect(rec.afterCode).toContain('class UserRepository');
      expect(rec.afterCode).toContain('class UserAuthenticator');
      expect(rec.afterCode).toContain('class UserNotificationService');
    });
  });
});