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

// Improvement tracking interfaces
export interface ImprovementMetrics {
  id: string;
  timestamp: Date;
  baselineId: string;
  comparisonId: string;
  timeInvested: number; // hours
  qualityImprovement: number; // percentage
  complexityReduction: number; // percentage
  violationsFixed: number;
  filesImproved: number;
  contributor?: string;
}

export interface ROICalculation {
  improvementId: string;
  timeInvested: number; // hours
  qualityGain: number; // percentage
  complexityReduction: number; // percentage
  estimatedMaintenanceTimeSaved: number; // hours
  roi: number; // return on investment ratio
  paybackPeriod: number; // months
}

export interface TeamPerformanceMetrics {
  teamId: string;
  period: DateRange;
  contributors: ContributorMetrics[];
  teamAverageQuality: number;
  teamAverageComplexity: number;
  totalImprovements: number;
  totalTimeInvested: number;
  teamROI: number;
}

export interface ContributorMetrics {
  contributorId: string;
  name: string;
  improvementsCount: number;
  averageQualityImprovement: number;
  averageComplexityReduction: number;
  totalTimeInvested: number;
  individualROI: number;
  filesImproved: number;
}

export interface ProgressVisualizationData {
  timeSeriesData: TimeSeriesPoint[];
  improvementHeatmap: ImprovementHeatmapData[];
  roiTrends: ROITrendData[];
  teamComparison: TeamComparisonData[];
}

export interface TimeSeriesPoint {
  timestamp: Date;
  qualityScore: number;
  complexityScore: number;
  violationCount: number;
  improvementCount: number;
}

export interface ImprovementHeatmapData {
  filePath: string;
  improvementCount: number;
  qualityGain: number;
  lastImprovement: Date;
  contributor: string;
}

export interface ROITrendData {
  period: string;
  averageROI: number;
  totalTimeInvested: number;
  totalQualityGain: number;
  improvementCount: number;
}

export interface TeamComparisonData {
  contributorId: string;
  name: string;
  qualityScore: number;
  improvementRate: number;
  roi: number;
}

// Batch processing types
export interface BatchAnalysisResult {
  totalFiles: number;
  processedFiles: number;
  failedFiles: string[];
  analysisResults: FileAnalysisResult[];
  summary: AnalysisSummary;
}

export interface FileAnalysisResult {
  filePath: string;
  success: boolean;
  error?: string;
  metrics?: any;
  violations?: any[];
  recommendations?: any[];
  functions?: FunctionInfo[];
}

export interface FunctionInfo {
  name: string;
  complexity: ComplexityMetrics;
  lineCount: number;
  parameterCount: number;
}

export interface AnalysisSummary {
  totalViolations: number;
  violationsBySeverity: Record<string, number>;
  violationsByPrinciple: Record<string, number>;
  averageScore: number;
  filesWithIssues: number;
}

export interface QualityReport {
  filePath: string;
  overallScore: number;
  principleScores: Map<CleanCodePrinciple, number>;
  violations: Violation[];
  strengths: string[];
  functions?: FunctionInfo[];
}