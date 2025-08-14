/**
 * Naming Analyzer - Analyzes naming conventions and quality
 */

import * as ts from 'typescript';
import { CodeLocation, CleanCodePrinciple, Severity, Violation } from '../types';

export interface NamingViolation extends Violation {
  nameType: NameType;
  actualName: string;
  suggestedName?: string;
}

export enum NameType {
  VARIABLE = 'variable',
  FUNCTION = 'function',
  CLASS = 'class',
  INTERFACE = 'interface',
  ENUM = 'enum',
  PROPERTY = 'property',
  METHOD = 'method',
  PARAMETER = 'parameter'
}

export interface NamingMetrics {
  totalNames: number;
  violationCount: number;
  averageDescriptiveness: number;
  consistencyScore: number;
  searchabilityScore: number;
  abbreviationCount: number;
}

export interface NamingAnalysisResult {
  violations: NamingViolation[];
  metrics: NamingMetrics;
  suggestions: string[];
}

/**
 * Naming convention patterns and rules
 */
export class NamingConventions {
  // Common abbreviations that should be avoided
  private static readonly COMMON_ABBREVIATIONS = new Set([
    'btn', 'txt', 'str', 'num', 'arr', 'obj', 'elem', 'el', 'idx', 'i', 'j', 'k',
    'tmp', 'temp', 'val', 'var', 'fn', 'func', 'cls', 'mgr', 'svc', 'ctrl',
    'cfg', 'config', 'info', 'data', 'res', 'req', 'resp', 'err', 'ex'
  ]);

  // Single letter names that are acceptable in specific contexts (like loop counters)
  private static readonly ACCEPTABLE_SINGLE_LETTERS = new Set(['i', 'j', 'k']);

  // Common meaningless words
  private static readonly MEANINGLESS_WORDS = new Set([
    'data', 'info', 'item', 'object', 'thing', 'stuff', 'value', 'variable',
    'element', 'component', 'part', 'piece', 'handler', 'manager', 'service'
  ]);

  // Reserved words and common patterns
  private static readonly RESERVED_PATTERNS = new Set([
    'test', 'spec', 'mock', 'stub', 'fake', 'dummy'
  ]);

  static isAbbreviation(name: string): boolean {
    return this.COMMON_ABBREVIATIONS.has(name.toLowerCase());
  }

  static isSingleLetter(name: string): boolean {
    return name.length === 1;
  }

  static isAcceptableSingleLetter(name: string): boolean {
    return this.ACCEPTABLE_SINGLE_LETTERS.has(name.toLowerCase());
  }

  static isMeaningless(name: string): boolean {
    return this.MEANINGLESS_WORDS.has(name.toLowerCase());
  }

  static isReservedPattern(name: string): boolean {
    return this.RESERVED_PATTERNS.has(name.toLowerCase());
  }

  static followsCamelCase(name: string): boolean {
    return /^[a-z][a-zA-Z0-9]*$/.test(name);
  }

  static followsPascalCase(name: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  }

  static followsConstantCase(name: string): boolean {
    return /^[A-Z][A-Z0-9_]*$/.test(name);
  }

  static hasConsistentCasing(names: string[], expectedPattern: RegExp): boolean {
    return names.every(name => expectedPattern.test(name));
  }
}

/**
 * Main naming analyzer class
 */
export class NamingAnalyzer {
  private sourceFile: ts.SourceFile;
  private violations: NamingViolation[] = [];
  private nameOccurrences: Map<string, number> = new Map();
  private nameTypes: Map<string, NameType> = new Map();

  constructor(sourceFile: ts.SourceFile) {
    this.sourceFile = sourceFile;
  }

  /**
   * Analyze naming conventions in the source file
   */
  analyze(): NamingAnalysisResult {
    this.violations = [];
    this.nameOccurrences.clear();
    this.nameTypes.clear();

    this.analyzeNode(this.sourceFile);

    const metrics = this.calculateMetrics();
    const suggestions = this.generateSuggestions();

    return {
      violations: this.violations,
      metrics,
      suggestions
    };
  }

  private analyzeNode(node: ts.Node): void {
    // Analyze different types of declarations
    if (ts.isVariableDeclaration(node)) {
      this.analyzeVariableName(node);
    } else if (ts.isFunctionDeclaration(node)) {
      this.analyzeFunctionName(node);
    } else if (ts.isClassDeclaration(node)) {
      this.analyzeClassName(node);
    } else if (ts.isInterfaceDeclaration(node)) {
      this.analyzeInterfaceName(node);
    } else if (ts.isEnumDeclaration(node)) {
      this.analyzeEnumName(node);
    } else if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
      this.analyzePropertyName(node);
    } else if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) {
      this.analyzeMethodName(node);
    } else if (ts.isParameter(node)) {
      this.analyzeParameterName(node);
    }

    // Recursively analyze child nodes
    ts.forEachChild(node, child => this.analyzeNode(child));
  }

  private analyzeVariableName(node: ts.VariableDeclaration): void {
    if (!ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const location = this.getNodeLocation(node);
    
    this.recordNameOccurrence(name, NameType.VARIABLE);
    this.checkNamingConventions(name, NameType.VARIABLE, location);
  }

  private analyzeFunctionName(node: ts.FunctionDeclaration): void {
    if (!node.name || !ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const location = this.getNodeLocation(node);
    
    this.recordNameOccurrence(name, NameType.FUNCTION);
    this.checkNamingConventions(name, NameType.FUNCTION, location);
  }

  private analyzeClassName(node: ts.ClassDeclaration): void {
    if (!node.name || !ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const location = this.getNodeLocation(node);
    
    this.recordNameOccurrence(name, NameType.CLASS);
    this.checkNamingConventions(name, NameType.CLASS, location);
  }

  private analyzeInterfaceName(node: ts.InterfaceDeclaration): void {
    if (!node.name || !ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const location = this.getNodeLocation(node);
    
    this.recordNameOccurrence(name, NameType.INTERFACE);
    this.checkNamingConventions(name, NameType.INTERFACE, location);
  }

  private analyzeEnumName(node: ts.EnumDeclaration): void {
    if (!node.name || !ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const location = this.getNodeLocation(node);
    
    this.recordNameOccurrence(name, NameType.ENUM);
    this.checkNamingConventions(name, NameType.ENUM, location);
  }

  private analyzePropertyName(node: ts.PropertyDeclaration | ts.PropertySignature): void {
    if (!ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const location = this.getNodeLocation(node);
    
    this.recordNameOccurrence(name, NameType.PROPERTY);
    this.checkNamingConventions(name, NameType.PROPERTY, location);
  }

  private analyzeMethodName(node: ts.MethodDeclaration | ts.MethodSignature): void {
    if (!ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const location = this.getNodeLocation(node);
    
    this.recordNameOccurrence(name, NameType.METHOD);
    this.checkNamingConventions(name, NameType.METHOD, location);
  }

  private analyzeParameterName(node: ts.ParameterDeclaration): void {
    if (!ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const location = this.getNodeLocation(node);
    
    this.recordNameOccurrence(name, NameType.PARAMETER);
    this.checkNamingConventions(name, NameType.PARAMETER, location);
  }

  private recordNameOccurrence(name: string, type: NameType): void {
    this.nameOccurrences.set(name, (this.nameOccurrences.get(name) || 0) + 1);
    this.nameTypes.set(name, type);
  }

  private checkNamingConventions(name: string, type: NameType, location: CodeLocation): void {
    // Check for abbreviations
    if (NamingConventions.isAbbreviation(name)) {
      this.addViolation({
        id: `abbreviation-${location.line}-${location.column}`,
        principle: CleanCodePrinciple.NAMING,
        severity: Severity.MEDIUM,
        location,
        description: `Avoid abbreviations in names: "${name}"`,
        suggestion: `Use a more descriptive name instead of the abbreviation "${name}"`,
        nameType: type,
        actualName: name,
        suggestedName: this.suggestFullName(name)
      });
    }

    // Check for single letter names (except in acceptable contexts)
    if (NamingConventions.isSingleLetter(name) && !NamingConventions.isAcceptableSingleLetter(name)) {
      this.addViolation({
        id: `single-letter-${location.line}-${location.column}`,
        principle: CleanCodePrinciple.NAMING,
        severity: Severity.HIGH,
        location,
        description: `Single letter variable names should be avoided: "${name}"`,
        suggestion: `Use a descriptive name that explains the purpose of "${name}"`,
        nameType: type,
        actualName: name
      });
    }

    // Check for meaningless names
    if (NamingConventions.isMeaningless(name)) {
      this.addViolation({
        id: `meaningless-${location.line}-${location.column}`,
        principle: CleanCodePrinciple.NAMING,
        severity: Severity.MEDIUM,
        location,
        description: `Name is too generic and meaningless: "${name}"`,
        suggestion: `Use a more specific name that describes what "${name}" represents`,
        nameType: type,
        actualName: name
      });
    }

    // Check casing conventions
    this.checkCasingConventions(name, type, location);

    // Check descriptiveness
    this.checkDescriptiveness(name, type, location);

    // Check searchability
    this.checkSearchability(name, type, location);
  }

  private checkCasingConventions(name: string, type: NameType, location: CodeLocation): void {
    let expectedPattern: RegExp;
    let conventionName: string;

    switch (type) {
      case NameType.CLASS:
      case NameType.INTERFACE:
      case NameType.ENUM:
        expectedPattern = /^[A-Z][a-zA-Z0-9]*$/;
        conventionName = 'PascalCase';
        break;
      case NameType.VARIABLE:
      case NameType.FUNCTION:
      case NameType.METHOD:
      case NameType.PROPERTY:
      case NameType.PARAMETER:
        expectedPattern = /^[a-z][a-zA-Z0-9]*$/;
        conventionName = 'camelCase';
        break;
      default:
        return;
    }

    if (!expectedPattern.test(name)) {
      this.addViolation({
        id: `casing-${location.line}-${location.column}`,
        principle: CleanCodePrinciple.NAMING,
        severity: Severity.LOW,
        location,
        description: `Name "${name}" should follow ${conventionName} convention`,
        suggestion: `Rename "${name}" to follow ${conventionName} convention`,
        nameType: type,
        actualName: name,
        suggestedName: this.convertToCasing(name, conventionName)
      });
    }
  }

  private checkDescriptiveness(name: string, type: NameType, location: CodeLocation): void {
    const descriptiveness = this.calculateDescriptiveness(name);
    
    if (descriptiveness < 0.3) {
      this.addViolation({
        id: `descriptiveness-${location.line}-${location.column}`,
        principle: CleanCodePrinciple.NAMING,
        severity: Severity.MEDIUM,
        location,
        description: `Name "${name}" is not descriptive enough`,
        suggestion: `Use a more descriptive name that clearly indicates the purpose of "${name}"`,
        nameType: type,
        actualName: name
      });
    }
  }

  private checkSearchability(name: string, type: NameType, location: CodeLocation): void {
    const searchability = this.calculateSearchability(name);
    
    if (searchability < 0.4) {
      this.addViolation({
        id: `searchability-${location.line}-${location.column}`,
        principle: CleanCodePrinciple.NAMING,
        severity: Severity.LOW,
        location,
        description: `Name "${name}" has poor searchability`,
        suggestion: `Use a more unique and searchable name instead of "${name}"`,
        nameType: type,
        actualName: name
      });
    }
  }

  private calculateDescriptiveness(name: string): number {
    let score = 0;

    // Length contributes to descriptiveness (but with diminishing returns)
    const lengthScore = Math.min(name.length / 15, 1) * 0.3;
    score += lengthScore;

    // Presence of vowels indicates pronounceability
    const vowelCount = (name.match(/[aeiou]/gi) || []).length;
    const vowelScore = Math.min(vowelCount / name.length, 0.5) * 0.2;
    score += vowelScore;

    // Camel case indicates compound words (more descriptive)
    const camelCaseScore = /[a-z][A-Z]/.test(name) ? 0.2 : 0;
    score += camelCaseScore;

    // Avoid abbreviations and single letters
    if (NamingConventions.isAbbreviation(name) || NamingConventions.isSingleLetter(name)) {
      score -= 0.3;
    }

    // Avoid meaningless words
    if (NamingConventions.isMeaningless(name)) {
      score -= 0.2;
    }

    // Domain-specific terms get bonus points
    if (this.containsDomainTerms(name)) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateSearchability(name: string): number {
    let score = 0;

    // Longer names are generally more searchable
    const lengthScore = Math.min(name.length / 20, 1) * 0.4;
    score += lengthScore;

    // Unique names are more searchable
    const frequency = this.nameOccurrences.get(name) || 1;
    const uniquenessScore = Math.max(0, 1 - (frequency - 1) * 0.1) * 0.3;
    score += uniquenessScore;

    // Names with specific patterns are more searchable
    if (/[A-Z]/.test(name)) score += 0.1; // Contains uppercase
    if (/\d/.test(name)) score += 0.1; // Contains numbers
    if (name.length > 3) score += 0.1; // Longer than 3 characters

    return Math.max(0, Math.min(1, score));
  }

  private containsDomainTerms(name: string): boolean {
    const domainTerms = ['user', 'product', 'order', 'cart', 'payment', 'auth', 'api', 'service', 'component'];
    return domainTerms.some(term => name.toLowerCase().includes(term));
  }

  private suggestFullName(abbreviation: string): string {
    const expansions: Record<string, string> = {
      'btn': 'button',
      'txt': 'text',
      'str': 'string',
      'num': 'number',
      'arr': 'array',
      'obj': 'object',
      'elem': 'element',
      'el': 'element',
      'idx': 'index',
      'tmp': 'temporary',
      'temp': 'temporary',
      'val': 'value',
      'var': 'variable',
      'fn': 'function',
      'func': 'function',
      'cls': 'class',
      'mgr': 'manager',
      'svc': 'service',
      'ctrl': 'controller',
      'cfg': 'configuration',
      'config': 'configuration',
      'info': 'information',
      'res': 'result',
      'req': 'request',
      'resp': 'response',
      'err': 'error',
      'ex': 'exception'
    };

    return expansions[abbreviation.toLowerCase()] || abbreviation;
  }

  private convertToCasing(name: string, convention: string): string {
    if (convention === 'camelCase') {
      return name.charAt(0).toLowerCase() + name.slice(1);
    } else if (convention === 'PascalCase') {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return name;
  }

  private calculateMetrics(): NamingMetrics {
    const totalNames = this.nameOccurrences.size;
    const violationCount = this.violations.length;
    
    // Calculate average descriptiveness
    const names = Array.from(this.nameOccurrences.keys());
    const totalDescriptiveness = names.reduce((sum, name) => sum + this.calculateDescriptiveness(name), 0);
    const averageDescriptiveness = totalNames > 0 ? totalDescriptiveness / totalNames : 0;

    // Calculate consistency score (how many names follow expected conventions)
    const consistentNames = names.filter(name => {
      const type = this.nameTypes.get(name);
      if (!type) return false;
      
      switch (type) {
        case NameType.CLASS:
        case NameType.INTERFACE:
        case NameType.ENUM:
          return NamingConventions.followsPascalCase(name);
        default:
          return NamingConventions.followsCamelCase(name);
      }
    });
    const consistencyScore = totalNames > 0 ? consistentNames.length / totalNames : 0;

    // Calculate searchability score
    const totalSearchability = names.reduce((sum, name) => sum + this.calculateSearchability(name), 0);
    const searchabilityScore = totalNames > 0 ? totalSearchability / totalNames : 0;

    // Count abbreviations
    const abbreviationCount = names.filter(name => NamingConventions.isAbbreviation(name)).length;

    return {
      totalNames,
      violationCount,
      averageDescriptiveness,
      consistencyScore,
      searchabilityScore,
      abbreviationCount
    };
  }

  private generateSuggestions(): string[] {
    const suggestions: string[] = [];

    if (this.violations.length === 0) {
      suggestions.push('Great job! No naming violations found.');
      return suggestions;
    }

    // Group violations by type
    const violationsByType = new Map<string, number>();
    this.violations.forEach(violation => {
      const key = violation.description.split(':')[0];
      violationsByType.set(key, (violationsByType.get(key) || 0) + 1);
    });

    // Generate suggestions based on most common violations
    const sortedViolations = Array.from(violationsByType.entries())
      .sort((a, b) => b[1] - a[1]);

    sortedViolations.forEach(([type, count]) => {
      if (type.includes('abbreviation')) {
        suggestions.push(`Consider expanding ${count} abbreviated name(s) to improve readability`);
      } else if (type.includes('Single letter')) {
        suggestions.push(`Replace ${count} single-letter variable(s) with descriptive names`);
      } else if (type.includes('meaningless')) {
        suggestions.push(`Make ${count} generic name(s) more specific to their purpose`);
      } else if (type.includes('casing')) {
        suggestions.push(`Fix ${count} naming convention violation(s) for consistency`);
      }
    });

    // Add general suggestions
    const metrics = this.calculateMetrics();
    if (metrics.averageDescriptiveness < 0.5) {
      suggestions.push('Focus on making names more descriptive and self-documenting');
    }
    if (metrics.consistencyScore < 0.8) {
      suggestions.push('Improve naming consistency across the codebase');
    }
    if (metrics.searchabilityScore < 0.6) {
      suggestions.push('Use more unique and searchable names to improve code navigation');
    }

    return suggestions;
  }

  private addViolation(violation: NamingViolation): void {
    this.violations.push(violation);
  }

  private getNodeLocation(node: ts.Node): CodeLocation {
    const start = this.sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = this.sourceFile.getLineAndCharacterOfPosition(node.getEnd());

    return {
      filePath: this.sourceFile.fileName,
      line: start.line + 1,
      column: start.character + 1,
      endLine: end.line + 1,
      endColumn: end.character + 1
    };
  }
}