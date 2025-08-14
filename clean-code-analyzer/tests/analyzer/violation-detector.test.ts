/**
 * Tests for Violation Detection System
 */

import * as ts from 'typescript';
import { 
  ViolationDetector, 
  ViolationRule, 
  ViolationInstance,
  ViolationReport 
} from '../../src/analyzer/violation-detector';
import { 
  CleanCodePrinciple, 
  Severity, 
  CodeLocation 
} from '../../src/types';
import { FileAnalysis, FunctionInfo, ClassInfo } from '../../src/analyzer/file-parser';

describe('ViolationDetector', () => {
  let detector: ViolationDetector;

  beforeEach(() => {
    detector = new ViolationDetector();
  });

  describe('Basic Violation Detection', () => {
    it('should detect short function names', () => {
      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'a',
            location: { filePath: 'test.ts', line: 1, column: 1 },
            parameters: [],
            complexity: {
              cyclomaticComplexity: 1,
              cognitiveComplexity: 1,
              nestingDepth: 1,
              lineCount: 5,
              parameterCount: 0
            },
            isAsync: false,
            isExported: false
          }
        ],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          nestingDepth: 1,
          lineCount: 10,
          parameterCount: 0
        },
        lineCount: 10
      };

      const report = detector.detectViolations(analysis);

      expect(report.totalViolations).toBe(1);
      expect(report.classifications[0].violation.principle).toBe(CleanCodePrinciple.NAMING);
      expect(report.classifications[0].violation.description).toContain('Function name "a" is too short');
    });

    it('should detect functions that are too long', () => {
      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'longFunction',
            location: { filePath: 'test.ts', line: 1, column: 1 },
            parameters: [],
            complexity: {
              cyclomaticComplexity: 5,
              cognitiveComplexity: 5,
              nestingDepth: 2,
              lineCount: 25, // Exceeds MAX_LINES (20)
              parameterCount: 0
            },
            isAsync: false,
            isExported: false
          }
        ],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 5,
          cognitiveComplexity: 5,
          nestingDepth: 2,
          lineCount: 30,
          parameterCount: 0
        },
        lineCount: 30
      };

      const report = detector.detectViolations(analysis);

      expect(report.totalViolations).toBe(1);
      expect(report.classifications[0].violation.principle).toBe(CleanCodePrinciple.FUNCTIONS);
      expect(report.classifications[0].violation.description).toContain('too long (25 lines');
    });

    it('should detect high cyclomatic complexity', () => {
      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'complexFunction',
            location: { filePath: 'test.ts', line: 1, column: 1 },
            parameters: [],
            complexity: {
              cyclomaticComplexity: 15, // Exceeds MAX_COMPLEXITY (10)
              cognitiveComplexity: 15,
              nestingDepth: 3,
              lineCount: 10,
              parameterCount: 0
            },
            isAsync: false,
            isExported: false
          }
        ],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 15,
          cognitiveComplexity: 15,
          nestingDepth: 3,
          lineCount: 15,
          parameterCount: 0
        },
        lineCount: 15
      };

      const report = detector.detectViolations(analysis);

      expect(report.totalViolations).toBe(1);
      expect(report.classifications[0].violation.principle).toBe(CleanCodePrinciple.FUNCTIONS);
      expect(report.classifications[0].violation.severity).toBe(Severity.HIGH);
      expect(report.classifications[0].violation.description).toContain('high cyclomatic complexity');
    });

    it('should detect too many parameters', () => {
      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'manyParamsFunction',
            location: { filePath: 'test.ts', line: 1, column: 1 },
            parameters: ['param1', 'param2', 'param3', 'param4', 'param5'],
            complexity: {
              cyclomaticComplexity: 2,
              cognitiveComplexity: 2,
              nestingDepth: 1,
              lineCount: 5,
              parameterCount: 5
            },
            isAsync: false,
            isExported: false
          }
        ],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 2,
          cognitiveComplexity: 2,
          nestingDepth: 1,
          lineCount: 10,
          parameterCount: 5
        },
        lineCount: 10
      };

      const report = detector.detectViolations(analysis);

      expect(report.totalViolations).toBe(1);
      expect(report.classifications[0].violation.principle).toBe(CleanCodePrinciple.FUNCTIONS);
      expect(report.classifications[0].violation.description).toContain('too many parameters (5');
    });

    it('should detect large classes', () => {
      // Create mock function infos for the class methods
      const mockMethods: FunctionInfo[] = Array.from({ length: 12 }, (_, i) => ({
        name: `method${i + 1}`,
        location: { filePath: 'test.ts', line: i + 2, column: 1 },
        parameters: [],
        complexity: {
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          nestingDepth: 1,
          lineCount: 3,
          parameterCount: 0
        },
        isAsync: false,
        isExported: false
      }));

      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [],
        classes: [
          {
            name: 'LargeClass',
            location: { filePath: 'test.ts', line: 1, column: 1 },
            methods: mockMethods, // Exceeds MAX_METHODS (10)
            properties: Array.from({ length: 6 }, (_, i) => `property${i + 1}`),
            isExported: false
          }
        ],
        imports: [],
        complexity: {
          cyclomaticComplexity: 5,
          cognitiveComplexity: 5,
          nestingDepth: 2,
          lineCount: 50,
          parameterCount: 0
        },
        lineCount: 50
      };

      const report = detector.detectViolations(analysis);

      expect(report.totalViolations).toBe(1);
      expect(report.classifications[0].violation.principle).toBe(CleanCodePrinciple.CLASSES);
      expect(report.classifications[0].violation.description).toContain('too large');
    });
  });

  describe('Severity Calculation', () => {
    it('should adjust severity based on impact and frequency', () => {
      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'b', // Short name
            location: { filePath: 'test.ts', line: 1, column: 1 },
            parameters: [],
            complexity: {
              cyclomaticComplexity: 8, // High complexity increases impact
              cognitiveComplexity: 8,
              nestingDepth: 2,
              lineCount: 5,
              parameterCount: 0
            },
            isAsync: false,
            isExported: true // Exported increases impact and frequency
          }
        ],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 8,
          cognitiveComplexity: 8,
          nestingDepth: 2,
          lineCount: 10,
          parameterCount: 0
        },
        lineCount: 10
      };

      const report = detector.detectViolations(analysis);

      expect(report.totalViolations).toBe(1);
      const classification = report.classifications[0];
      
      // Should have higher impact and frequency scores due to export and complexity
      expect(classification.impactScore).toBeGreaterThan(5);
      expect(classification.frequencyScore).toBeGreaterThan(5);
      
      // Reasoning should explain the severity adjustment
      expect(classification.reasoning).toContain('impact');
      expect(classification.reasoning).toContain('frequency');
    });

    it('should handle critical severity escalation', () => {
      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'criticalFunction',
            location: { filePath: 'test.ts', line: 1, column: 1 },
            parameters: [],
            complexity: {
              cyclomaticComplexity: 20, // Very high complexity
              cognitiveComplexity: 20,
              nestingDepth: 5,
              lineCount: 5,
              parameterCount: 0
            },
            isAsync: true, // Async increases frequency
            isExported: true // Exported increases impact and frequency
          }
        ],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 20,
          cognitiveComplexity: 20,
          nestingDepth: 5,
          lineCount: 10,
          parameterCount: 0
        },
        lineCount: 10
      };

      const report = detector.detectViolations(analysis);

      expect(report.totalViolations).toBe(1);
      const classification = report.classifications[0];
      
      // Should escalate to critical due to high impact and frequency
      expect(classification.finalSeverity).toBe(Severity.CRITICAL);
    });
  });

  describe('AST-based Detection', () => {
    it('should detect single letter variables using AST', () => {
      const sourceCode = `
        function test() {
          const x = 5; // Should be flagged
          const userName = 'john'; // Should not be flagged
          const a = getData(); // Should be flagged
        }
      `;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.ES2020,
        true
      );

      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          nestingDepth: 1,
          lineCount: 6,
          parameterCount: 0
        },
        lineCount: 6
      };

      const report = detector.detectViolations(analysis, sourceFile);

      // Should detect 'x' and 'a' as single letter variables
      const singleLetterViolations = report.classifications.filter(
        c => c.violation.description.includes('single letter naming')
      );
      
      expect(singleLetterViolations.length).toBe(2);
      expect(singleLetterViolations.some(v => v.violation.description.includes('"x"'))).toBe(true);
      expect(singleLetterViolations.some(v => v.violation.description.includes('"a"'))).toBe(true);
    });

    it('should provide precise location tracking', () => {
      const sourceCode = `function test() {
  const x = 5;
}`;

      const sourceFile = ts.createSourceFile(
        'test.ts',
        sourceCode,
        ts.ScriptTarget.ES2020,
        true
      );

      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          nestingDepth: 1,
          lineCount: 3,
          parameterCount: 0
        },
        lineCount: 3
      };

      const report = detector.detectViolations(analysis, sourceFile);

      const violation = report.classifications.find(
        c => c.violation.description.includes('single letter naming')
      );

      expect(violation).toBeDefined();
      expect(violation!.violation.location.line).toBe(2); // Second line
      expect(violation!.violation.location.column).toBeGreaterThan(0);
      expect(violation!.violation.location.endLine).toBeDefined();
      expect(violation!.violation.location.endColumn).toBeDefined();
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive violation report', () => {
      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'a', // Short name - NAMING violation
            location: { filePath: 'test.ts', line: 1, column: 1 },
            parameters: ['param1', 'param2', 'param3', 'param4'], // Too many parameters - FUNCTIONS violation
            complexity: {
              cyclomaticComplexity: 12, // High complexity - FUNCTIONS violation
              cognitiveComplexity: 12,
              nestingDepth: 3,
              lineCount: 25, // Too long - FUNCTIONS violation
              parameterCount: 4
            },
            isAsync: false,
            isExported: false
          }
        ],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 12,
          cognitiveComplexity: 12,
          nestingDepth: 3,
          lineCount: 30,
          parameterCount: 4
        },
        lineCount: 30
      };

      const report = detector.detectViolations(analysis);

      expect(report.filePath).toBe('test.ts');
      expect(report.totalViolations).toBe(4); // Short name, too many params, high complexity, too long
      
      // Check violations by principle
      expect(report.violationsByPrinciple.get(CleanCodePrinciple.NAMING)).toBe(1);
      expect(report.violationsByPrinciple.get(CleanCodePrinciple.FUNCTIONS)).toBe(3);
      
      // Check violations by severity
      const severityCounts = report.violationsBySeverity;
      expect(severityCounts.get(Severity.HIGH)).toBeGreaterThan(0);
      expect(severityCounts.get(Severity.MEDIUM)).toBeGreaterThan(0);
      
      // Quality score should be reduced due to violations
      expect(report.qualityScore).toBeLessThan(100);
      expect(report.qualityScore).toBeGreaterThanOrEqual(0);
    });

    it('should calculate quality score correctly', () => {
      // Test with no violations
      const cleanAnalysis: FileAnalysis = {
        filePath: 'clean.ts',
        functions: [
          {
            name: 'calculateTotal',
            location: { filePath: 'clean.ts', line: 1, column: 1 },
            parameters: ['items'],
            complexity: {
              cyclomaticComplexity: 3,
              cognitiveComplexity: 3,
              nestingDepth: 1,
              lineCount: 10,
              parameterCount: 1
            },
            isAsync: false,
            isExported: false
          }
        ],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 3,
          cognitiveComplexity: 3,
          nestingDepth: 1,
          lineCount: 15,
          parameterCount: 1
        },
        lineCount: 15
      };

      const cleanReport = detector.detectViolations(cleanAnalysis);
      expect(cleanReport.qualityScore).toBe(100); // Perfect score with no violations
    });
  });

  describe('Custom Rules', () => {
    it('should allow adding custom violation rules', () => {
      const customRule: ViolationRule = {
        id: 'custom-test-rule',
        principle: CleanCodePrinciple.NAMING,
        name: 'Custom Test Rule',
        description: 'Test custom rule',
        baseSeverity: Severity.LOW,
        impactWeight: 0.1,
        frequencyWeight: 0.1,
        check: (analysis: FileAnalysis) => {
          const instances: ViolationInstance[] = [];
          
          for (const func of analysis.functions) {
            if (func.name.includes('test')) {
              instances.push({
                ruleId: 'custom-test-rule',
                location: func.location,
                message: `Function name contains 'test': ${func.name}`,
                suggestion: 'Consider a more descriptive name',
                impactScore: 2,
                frequencyScore: 3
              });
            }
          }
          
          return instances;
        }
      };

      detector.addRule(customRule);

      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'testFunction',
            location: { filePath: 'test.ts', line: 1, column: 1 },
            parameters: [],
            complexity: {
              cyclomaticComplexity: 1,
              cognitiveComplexity: 1,
              nestingDepth: 1,
              lineCount: 5,
              parameterCount: 0
            },
            isAsync: false,
            isExported: false
          }
        ],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          nestingDepth: 1,
          lineCount: 10,
          parameterCount: 0
        },
        lineCount: 10
      };

      const report = detector.detectViolations(analysis);

      const customViolation = report.classifications.find(
        c => c.violation.description.includes("contains 'test'")
      );

      expect(customViolation).toBeDefined();
      expect(customViolation!.violation.severity).toBe(Severity.LOW);
    });

    it('should allow removing rules', () => {
      const initialRuleCount = detector.getRules().length;
      
      detector.removeRule('short-function-name');
      
      expect(detector.getRules().length).toBe(initialRuleCount - 1);
      expect(detector.getRules().find(r => r.id === 'short-function-name')).toBeUndefined();
    });

    it('should return all registered rules', () => {
      const rules = detector.getRules();
      
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every(rule => rule.id && rule.principle && rule.check)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle rule execution errors gracefully', () => {
      const faultyRule: ViolationRule = {
        id: 'faulty-rule',
        principle: CleanCodePrinciple.NAMING,
        name: 'Faulty Rule',
        description: 'Rule that throws errors',
        baseSeverity: Severity.LOW,
        impactWeight: 0.1,
        frequencyWeight: 0.1,
        check: () => {
          throw new Error('Rule execution failed');
        }
      };

      detector.addRule(faultyRule);

      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          nestingDepth: 1,
          lineCount: 10,
          parameterCount: 0
        },
        lineCount: 10
      };

      // Should not throw, should handle error gracefully
      expect(() => detector.detectViolations(analysis)).not.toThrow();
    });

    it('should handle missing source file gracefully', () => {
      const analysis: FileAnalysis = {
        filePath: 'test.ts',
        functions: [],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          nestingDepth: 1,
          lineCount: 10,
          parameterCount: 0
        },
        lineCount: 10
      };

      // Should not throw when sourceFile is undefined
      expect(() => detector.detectViolations(analysis)).not.toThrow();
      
      const report = detector.detectViolations(analysis);
      expect(report).toBeDefined();
      expect(report.filePath).toBe('test.ts');
    });
  });
});