/**
 * Core type definitions for the Clean Code Analyzer
 */

// Clean Code Principles
export enum CleanCodePrinciple {
  NAMING = 'naming',
  FUNCTIONS = 'functions',
  CLASSES = 'classes',
  COMMENTS = 'comments',
  ERROR_HANDLING = 'error_handling',
  SOLID_PRINCIPLES = 'solid_principles'
}

// Severity levels for violations
export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Effort levels for recommendations
export enum EffortLevel {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

// Impact levels for changes
export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Refactoring types
export enum RefactoringType {
  EXTRACT_METHOD = 'extract_method',
  RENAME = 'rename',
  REDUCE_PARAMETERS = 'reduce_parameters',
  SPLIT_CLASS = 'split_class',
  REMOVE_DEAD_CODE = 'remove_dead_code',
  IMPROVE_ERROR_HANDLING = 'improve_error_handling',
  ADD_TESTS = 'add_tests'
}

// Core interfaces
export interface CodeLocation {
  filePath: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestingDepth: number;
  lineCount: number;
  parameterCount: number;
}

export interface QualityMetrics {
  complexity: ComplexityMetrics;
  maintainability: number;
  testability: number;
  readability: number;
}

export interface Violation {
  id: string;
  principle: CleanCodePrinciple;
  severity: Severity;
  location: CodeLocation;
  description: string;
  suggestion: string;
}

export interface Recommendation {
  id: string;
  type: RefactoringType;
  description: string;
  beforeCode: string;
  afterCode: string;
  principle: CleanCodePrinciple;
  effort: EffortLevel;
  impact: ImpactLevel;
  dependencies: string[];
}

// Progress tracking interfaces
export interface DateRange {
  start: Date;
  end: Date;
}

export interface Baseline {
  id: string;
  timestamp: Date;
  projectName: string;
  totalFiles: number;
  overallMetrics: BaselineMetrics;
  fileMetrics: FileBaselineMetrics[];
}

export interface BaselineMetrics {
  averageComplexity: number;
  totalViolations: number;
  qualityScore: number;
  principleScores: Map<CleanCodePrinciple, number>;
}

export interface FileBaselineMetrics {
  filePath: string;
  complexity: ComplexityMetrics;
  qualityScore: number;
  violationCount: number;
}

export interface BaselineComparison {
  baselineId: string;
  comparisonId: string;
  overallImprovement: number;
  complexityImprovement: number;
  qualityImprovement: number;
  fileComparisons: FileComparison[];
}

export interface FileComparison {
  filePath: string;
  complexityChange: number;
  qualityChange: number;
  violationChange: number;
}

export interface TrendReport {
  timeRange: DateRange;
  complexityTrend: Trend;
  qualityTrend: Trend;
  dataPoints: TrendDataPoint[];
}

export interface Trend {
  direction: 'improving' | 'declining' | 'stable';
  rate: number;
  confidence: number;
}

export interface TrendDataPoint {
  timestamp: Date;
  complexity: number;
  quality: number;
  violations: number;
}