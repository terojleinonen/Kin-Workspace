/**
 * Violation Detection System
 * Implements violation classification engine with severity assignment
 */

import * as ts from 'typescript';
import { 
  Violation, 
  CleanCodePrinciple, 
  Severity, 
  CodeLocation 
} from '../types';
import { FileAnalysis, FunctionInfo, ClassInfo } from './file-parser';

export interface ViolationRule {
  id: string;
  principle: CleanCodePrinciple;
  name: string;
  description: string;
  check: (analysis: FileAnalysis, sourceFile?: ts.SourceFile) => ViolationInstance[];
  baseSeverity: Severity;
  impactWeight: number;
  frequencyWeight: number;
}

export interface ViolationInstance {
  ruleId: string;
  location: CodeLocation;
  message: string;
  suggestion: string;
  context?: any;
  impactScore: number;
  frequencyScore: number;
}

export interface ViolationClassification {
  violation: Violation;
  impactScore: number;
  frequencyScore: number;
  finalSeverity: Severity;
  reasoning: string;
}

export interface ViolationReport {
  filePath: string;
  totalViolations: number;
  violationsByPrinciple: Map<CleanCodePrinciple, number>;
  violationsBySeverity: Map<Severity, number>;
  classifications: ViolationClassification[];
  qualityScore: number;
}

/**
 * Violation Detection Engine
 * Detects, classifies, and scores code violations
 */
export class ViolationDetector {
  private rules: ViolationRule[] = [];
  private readonly SEVERITY_WEIGHTS = {
    [Severity.CRITICAL]: 4,
    [Severity.HIGH]: 3,
    [Severity.MEDIUM]: 2,
    [Severity.LOW]: 1
  };

  constructor() {
    this.initializeRules();
  }

  /**
   * Detect violations in a file analysis
   */
  detectViolations(analysis: FileAnalysis, sourceFile?: ts.SourceFile): ViolationReport {
    const allInstances: ViolationInstance[] = [];

    // Run all rules against the analysis
    for (const rule of this.rules) {
      try {
        const instances = rule.check(analysis, sourceFile);
        allInstances.push(...instances.map(instance => ({
          ...instance,
          ruleId: rule.id
        })));
      } catch (error) {
        console.warn(`Rule ${rule.id} failed to execute:`, error);
      }
    }

    // Classify and score violations
    const classifications = this.classifyViolations(allInstances, analysis);

    // Generate report
    return this.generateReport(analysis.filePath, classifications);
  }

  /**
   * Classify violations with severity assignment based on impact and frequency
   */
  private classifyViolations(instances: ViolationInstance[], analysis: FileAnalysis): ViolationClassification[] {
    const classifications: ViolationClassification[] = [];

    for (const instance of instances) {
      const rule = this.rules.find(r => r.id === instance.ruleId);
      if (!rule) continue;

      // Calculate final severity based on impact and frequency
      const finalSeverity = this.calculateSeverity(
        rule.baseSeverity,
        instance.impactScore,
        instance.frequencyScore,
        rule.impactWeight,
        rule.frequencyWeight
      );

      // Create violation
      const violation: Violation = {
        id: `${rule.id}-${instance.location.line}-${instance.location.column}`,
        principle: rule.principle,
        severity: finalSeverity,
        location: instance.location,
        description: instance.message,
        suggestion: instance.suggestion
      };

      // Create classification with reasoning
      const reasoning = this.generateReasoningText(
        rule.baseSeverity,
        finalSeverity,
        instance.impactScore,
        instance.frequencyScore
      );

      classifications.push({
        violation,
        impactScore: instance.impactScore,
        frequencyScore: instance.frequencyScore,
        finalSeverity,
        reasoning
      });
    }

    return classifications;
  }

  /**
   * Calculate final severity based on base severity, impact, and frequency
   */
  private calculateSeverity(
    baseSeverity: Severity,
    impactScore: number,
    frequencyScore: number,
    impactWeight: number,
    frequencyWeight: number
  ): Severity {
    const baseWeight = this.SEVERITY_WEIGHTS[baseSeverity];
    
    // Normalize scores to 0-1 range
    const normalizedImpact = Math.min(1, Math.max(0, impactScore / 10));
    const normalizedFrequency = Math.min(1, Math.max(0, frequencyScore / 10));
    
    // Calculate weighted score
    const weightedScore = baseWeight + 
      (normalizedImpact * impactWeight) + 
      (normalizedFrequency * frequencyWeight);
    
    // Map back to severity levels
    if (weightedScore >= 3.5) return Severity.CRITICAL;
    if (weightedScore >= 2.5) return Severity.HIGH;
    if (weightedScore >= 1.5) return Severity.MEDIUM;
    return Severity.LOW;
  }

  /**
   * Generate reasoning text for severity assignment
   */
  private generateReasoningText(
    baseSeverity: Severity,
    finalSeverity: Severity,
    impactScore: number,
    frequencyScore: number
  ): string {
    const parts: string[] = [`Base severity: ${baseSeverity}`];
    
    if (impactScore > 5) {
      parts.push(`high impact (${impactScore}/10)`);
    } else if (impactScore > 2) {
      parts.push(`moderate impact (${impactScore}/10)`);
    } else {
      parts.push(`low impact (${impactScore}/10)`);
    }
    
    if (frequencyScore > 5) {
      parts.push(`high frequency (${frequencyScore}/10)`);
    } else if (frequencyScore > 2) {
      parts.push(`moderate frequency (${frequencyScore}/10)`);
    } else {
      parts.push(`low frequency (${frequencyScore}/10)`);
    }
    
    if (baseSeverity !== finalSeverity) {
      parts.push(`adjusted to ${finalSeverity}`);
    }
    
    return parts.join(', ');
  }

  /**
   * Generate violation report
   */
  private generateReport(filePath: string, classifications: ViolationClassification[]): ViolationReport {
    const violationsByPrinciple = new Map<CleanCodePrinciple, number>();
    const violationsBySeverity = new Map<Severity, number>();
    
    for (const classification of classifications) {
      const principle = classification.violation.principle;
      const severity = classification.violation.severity;
      
      violationsByPrinciple.set(principle, (violationsByPrinciple.get(principle) || 0) + 1);
      violationsBySeverity.set(severity, (violationsBySeverity.get(severity) || 0) + 1);
    }
    
    // Calculate quality score (0-100, where 100 is perfect)
    const totalViolations = classifications.length;
    const severityPenalty = classifications.reduce((penalty, c) => {
      return penalty + this.SEVERITY_WEIGHTS[c.violation.severity];
    }, 0);
    
    const qualityScore = Math.max(0, 100 - (severityPenalty * 2));
    
    return {
      filePath,
      totalViolations,
      violationsByPrinciple,
      violationsBySeverity,
      classifications,
      qualityScore
    };
  }

  /**
   * Initialize violation detection rules
   */
  private initializeRules(): void {
    this.rules = [
      // Naming violations
      {
        id: 'short-function-name',
        principle: CleanCodePrinciple.NAMING,
        name: 'Short Function Name',
        description: 'Function names should be descriptive and meaningful',
        baseSeverity: Severity.MEDIUM,
        impactWeight: 0.3,
        frequencyWeight: 0.2,
        check: (analysis: FileAnalysis) => {
          const instances: ViolationInstance[] = [];
          
          for (const func of analysis.functions) {
            if (func.name.length <= 2 && func.name !== 'id') {
              const impactScore = this.calculateNamingImpact(func);
              const frequencyScore = this.calculateFunctionFrequency(func, analysis);
              
              instances.push({
                ruleId: 'short-function-name',
                location: func.location,
                message: `Function name "${func.name}" is too short (${func.name.length} characters)`,
                suggestion: `Use a more descriptive name that explains what "${func.name}" does`,
                context: { functionName: func.name, length: func.name.length },
                impactScore,
                frequencyScore
              });
            }
          }
          
          return instances;
        }
      },
      
      {
        id: 'single-letter-variable',
        principle: CleanCodePrinciple.NAMING,
        name: 'Single Letter Variable',
        description: 'Variables should have meaningful names, not single letters',
        baseSeverity: Severity.HIGH,
        impactWeight: 0.4,
        frequencyWeight: 0.3,
        check: (analysis: FileAnalysis, sourceFile?: ts.SourceFile) => {
          const instances: ViolationInstance[] = [];
          
          if (sourceFile) {
            this.visitNode(sourceFile, (node: ts.Node) => {
              if (ts.isVariableDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
                const name = node.name.text;
                if (name.length === 1 && !['i', 'j', 'k'].includes(name)) {
                  const location = this.getNodeLocation(node, sourceFile, analysis.filePath);
                  const impactScore = this.calculateVariableImpact(node, sourceFile);
                  const frequencyScore = 8; // Single letter variables are always frequent issues
                  
                  instances.push({
                    ruleId: 'single-letter-variable',
                    location,
                    message: `Variable "${name}" uses single letter naming`,
                    suggestion: `Use a descriptive name instead of "${name}"`,
                    context: { variableName: name },
                    impactScore,
                    frequencyScore
                  });
                }
              }
            });
          }
          
          return instances;
        }
      },
      
      // Function complexity violations
      {
        id: 'function-too-long',
        principle: CleanCodePrinciple.FUNCTIONS,
        name: 'Function Too Long',
        description: 'Functions should be small and focused',
        baseSeverity: Severity.MEDIUM,
        impactWeight: 0.4,
        frequencyWeight: 0.2,
        check: (analysis: FileAnalysis) => {
          const instances: ViolationInstance[] = [];
          const MAX_LINES = 20;
          
          for (const func of analysis.functions) {
            if (func.complexity.lineCount > MAX_LINES) {
              const impactScore = this.calculateComplexityImpact(func);
              const frequencyScore = this.calculateFunctionFrequency(func, analysis);
              
              instances.push({
                ruleId: 'function-too-long',
                location: func.location,
                message: `Function "${func.name}" is too long (${func.complexity.lineCount} lines, max ${MAX_LINES})`,
                suggestion: `Break down "${func.name}" into smaller, focused functions`,
                context: { functionName: func.name, lineCount: func.complexity.lineCount, maxLines: MAX_LINES },
                impactScore,
                frequencyScore
              });
            }
          }
          
          return instances;
        }
      },
      
      {
        id: 'high-cyclomatic-complexity',
        principle: CleanCodePrinciple.FUNCTIONS,
        name: 'High Cyclomatic Complexity',
        description: 'Functions should have low cyclomatic complexity',
        baseSeverity: Severity.HIGH,
        impactWeight: 0.5,
        frequencyWeight: 0.3,
        check: (analysis: FileAnalysis) => {
          const instances: ViolationInstance[] = [];
          const MAX_COMPLEXITY = 10;
          
          for (const func of analysis.functions) {
            if (func.complexity.cyclomaticComplexity > MAX_COMPLEXITY) {
              const impactScore = this.calculateComplexityImpact(func);
              const frequencyScore = this.calculateFunctionFrequency(func, analysis);
              
              instances.push({
                ruleId: 'high-cyclomatic-complexity',
                location: func.location,
                message: `Function "${func.name}" has high cyclomatic complexity (${func.complexity.cyclomaticComplexity}, max ${MAX_COMPLEXITY})`,
                suggestion: `Simplify "${func.name}" by reducing decision points and extracting methods`,
                context: { functionName: func.name, complexity: func.complexity.cyclomaticComplexity, maxComplexity: MAX_COMPLEXITY },
                impactScore,
                frequencyScore
              });
            }
          }
          
          return instances;
        }
      },
      
      {
        id: 'too-many-parameters',
        principle: CleanCodePrinciple.FUNCTIONS,
        name: 'Too Many Parameters',
        description: 'Functions should have a reasonable number of parameters',
        baseSeverity: Severity.MEDIUM,
        impactWeight: 0.3,
        frequencyWeight: 0.4,
        check: (analysis: FileAnalysis) => {
          const instances: ViolationInstance[] = [];
          const MAX_PARAMETERS = 3;
          
          for (const func of analysis.functions) {
            if (func.parameters.length > MAX_PARAMETERS) {
              const impactScore = this.calculateParameterImpact(func);
              const frequencyScore = this.calculateFunctionFrequency(func, analysis);
              
              instances.push({
                ruleId: 'too-many-parameters',
                location: func.location,
                message: `Function "${func.name}" has too many parameters (${func.parameters.length}, max ${MAX_PARAMETERS})`,
                suggestion: `Reduce parameters in "${func.name}" by using an options object or splitting the function`,
                context: { functionName: func.name, parameterCount: func.parameters.length, maxParameters: MAX_PARAMETERS },
                impactScore,
                frequencyScore
              });
            }
          }
          
          return instances;
        }
      },
      
      // Class design violations
      {
        id: 'large-class',
        principle: CleanCodePrinciple.CLASSES,
        name: 'Large Class',
        description: 'Classes should follow single responsibility principle',
        baseSeverity: Severity.MEDIUM,
        impactWeight: 0.4,
        frequencyWeight: 0.2,
        check: (analysis: FileAnalysis) => {
          const instances: ViolationInstance[] = [];
          const MAX_METHODS = 10;
          const MAX_PROPERTIES = 8;
          
          for (const cls of analysis.classes) {
            if (cls.methods.length > MAX_METHODS || cls.properties.length > MAX_PROPERTIES) {
              const impactScore = this.calculateClassImpact(cls);
              const frequencyScore = this.calculateClassFrequency(cls, analysis);
              
              const issues = [];
              if (cls.methods.length > MAX_METHODS) {
                issues.push(`${cls.methods.length} methods (max ${MAX_METHODS})`);
              }
              if (cls.properties.length > MAX_PROPERTIES) {
                issues.push(`${cls.properties.length} properties (max ${MAX_PROPERTIES})`);
              }
              
              instances.push({
                ruleId: 'large-class',
                location: cls.location,
                message: `Class "${cls.name}" is too large: ${issues.join(', ')}`,
                suggestion: `Split "${cls.name}" into smaller classes with single responsibilities`,
                context: { className: cls.name, methodCount: cls.methods.length, propertyCount: cls.properties.length },
                impactScore,
                frequencyScore
              });
            }
          }
          
          return instances;
        }
      }
    ];
  }

  /**
   * Calculate impact score for naming violations
   */
  private calculateNamingImpact(func: FunctionInfo): number {
    let impact = 5; // Base impact
    
    // Higher impact for public functions
    if (func.isExported) impact += 2;
    
    // Higher impact for complex functions
    if (func.complexity.cyclomaticComplexity > 5) impact += 1;
    
    // Higher impact for functions with many parameters
    if (func.parameters.length > 2) impact += 1;
    
    return Math.min(10, impact);
  }

  /**
   * Calculate frequency score for functions
   */
  private calculateFunctionFrequency(func: FunctionInfo, analysis: FileAnalysis): number {
    let frequency = 3; // Base frequency
    
    // Higher frequency for exported functions (likely used elsewhere)
    if (func.isExported) frequency += 3;
    
    // Higher frequency for async functions (often part of API)
    if (func.isAsync) frequency += 2;
    
    // Higher frequency in files with many functions
    if (analysis.functions.length > 10) frequency += 1;
    
    return Math.min(10, frequency);
  }

  /**
   * Calculate impact score for complexity violations
   */
  private calculateComplexityImpact(func: FunctionInfo): number {
    let impact = 6; // Base impact for complexity issues
    
    // Higher impact for exported functions
    if (func.isExported) impact += 2;
    
    // Higher impact based on complexity level
    const complexityRatio = func.complexity.cyclomaticComplexity / 10;
    impact += Math.min(2, complexityRatio);
    
    return Math.min(10, impact);
  }

  /**
   * Calculate impact score for parameter violations
   */
  private calculateParameterImpact(func: FunctionInfo): number {
    let impact = 4; // Base impact
    
    // Higher impact for exported functions
    if (func.isExported) impact += 2;
    
    // Higher impact based on parameter count
    const parameterRatio = func.parameters.length / 5;
    impact += Math.min(3, parameterRatio);
    
    return Math.min(10, impact);
  }

  /**
   * Calculate impact score for variable violations
   */
  private calculateVariableImpact(node: ts.VariableDeclaration, sourceFile: ts.SourceFile): number {
    let impact = 6; // Base impact for naming issues
    
    // Higher impact for exported variables
    const parent = node.parent?.parent;
    if (parent && ts.isVariableStatement(parent) && 
        parent.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      impact += 2;
    }
    
    return Math.min(10, impact);
  }

  /**
   * Calculate impact score for class violations
   */
  private calculateClassImpact(cls: ClassInfo): number {
    let impact = 5; // Base impact
    
    // Higher impact for exported classes
    if (cls.isExported) impact += 3;
    
    // Higher impact based on size
    const sizeScore = (cls.methods.length + cls.properties.length) / 20;
    impact += Math.min(2, sizeScore);
    
    return Math.min(10, impact);
  }

  /**
   * Calculate frequency score for classes
   */
  private calculateClassFrequency(cls: ClassInfo, analysis: FileAnalysis): number {
    let frequency = 4; // Base frequency
    
    // Higher frequency for exported classes
    if (cls.isExported) frequency += 3;
    
    // Higher frequency in files with few classes (more focused)
    if (analysis.classes.length <= 2) frequency += 2;
    
    return Math.min(10, frequency);
  }

  /**
   * Get precise location from AST node
   */
  private getNodeLocation(node: ts.Node, sourceFile: ts.SourceFile, filePath: string): CodeLocation {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    return {
      filePath,
      line: start.line + 1,
      column: start.character + 1,
      endLine: end.line + 1,
      endColumn: end.character + 1
    };
  }

  /**
   * Visit AST nodes recursively
   */
  private visitNode(node: ts.Node, callback: (node: ts.Node) => void): void {
    callback(node);
    ts.forEachChild(node, child => this.visitNode(child, callback));
  }

  /**
   * Add a custom violation rule
   */
  addRule(rule: ViolationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove a violation rule by ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Get all registered rules
   */
  getRules(): ViolationRule[] {
    return [...this.rules];
  }
}