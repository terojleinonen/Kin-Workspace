/**
 * Tests for Recommendation Engine
 */

import { 
  CleanCodeRecommendationEngine, 
  EffortEstimate, 
  PrioritizedPlan 
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

      // Small (2h) + Medium (8h) = 10h
      expect(plan.totalEffort.timeHours).toBe(10);
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
    it('should throw error as not implemented yet', () => {
      const recommendation: Recommendation = {
        id: 'r1',
        type: RefactoringType.RENAME,
        description: 'Test recommendation',
        beforeCode: '',
        afterCode: '',
        principle: CleanCodePrinciple.NAMING,
        effort: EffortLevel.SMALL,
        impact: ImpactLevel.MEDIUM,
        dependencies: []
      };

      expect(() => engine.estimateEffort(recommendation)).toThrow('Not implemented yet - will be implemented in task 5.2');
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