/**
 * Progress Tracker - Baseline establishment and historical tracking
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  Baseline, 
  BaselineMetrics, 
  FileBaselineMetrics, 
  BaselineComparison, 
  FileComparison,
  TrendReport,
  Trend,
  TrendDataPoint,
  DateRange,
  CleanCodePrinciple
} from '../types';
import { BatchAnalysis, FileAnalysis } from './file-parser';
import { QualityReport, CleanCodeAssessor } from './quality-assessor';

export interface ProgressTracker {
  recordBaseline(analysis: BatchAnalysis, projectName?: string): Promise<Baseline>;
  compareBaselines(baselineId: string, comparisonId: string): Promise<BaselineComparison>;
  calculateTrends(startDate: Date, endDate: Date): Promise<TrendReport>;
  getBaselineHistory(): Promise<Baseline[]>;
  getLatestBaseline(): Promise<Baseline | null>;
}

/**
 * Progress Tracker implementation for baseline establishment and historical analysis
 */
export class CleanCodeProgressTracker implements ProgressTracker {
  private readonly storageDir: string;
  private readonly baselinesDir: string;
  private readonly qualityAssessor: CleanCodeAssessor;

  constructor(storageDir: string = './progress-data') {
    this.storageDir = storageDir;
    this.baselinesDir = path.join(storageDir, 'baselines');
    this.qualityAssessor = new CleanCodeAssessor();
    
    // Ensure storage directories exist
    this.ensureDirectories();
  }

  async recordBaseline(analysis: BatchAnalysis, projectName: string = 'test-project'): Promise<Baseline> {
    const id = this.generateBaselineId();
    const timestamp = new Date();
    
    // Calculate quality reports for all files
    const qualityReports: QualityReport[] = [];
    for (const fileAnalysis of analysis.files) {
      const qualityReport = this.qualityAssessor.assessFile(fileAnalysis);
      qualityReports.push(qualityReport);
    }
    
    // Calculate overall metrics
    const overallMetrics = this.calculateOverallMetrics(analysis, qualityReports);
    
    // Create file-level metrics
    const fileMetrics = this.createFileMetrics(analysis.files, qualityReports);
    
    const baseline: Baseline = {
      id,
      timestamp,
      projectName,
      totalFiles: analysis.totalFiles,
      overallMetrics,
      fileMetrics
    };
    
    // Save baseline to storage
    await this.saveBaseline(baseline);
    
    return baseline;
  }

  async compareBaselines(baselineId: string, comparisonId: string): Promise<BaselineComparison> {
    const baseline = await this.loadBaseline(baselineId);
    const comparison = await this.loadBaseline(comparisonId);
    
    if (!baseline) {
      throw new Error(`Baseline not found: ${baselineId}`);
    }
    
    if (!comparison) {
      throw new Error(`Baseline not found: ${comparisonId}`);
    }
    
    // Calculate overall improvements
    const overallImprovement = this.calculateOverallImprovement(baseline, comparison);
    const complexityImprovement = this.calculateComplexityImprovement(baseline, comparison);
    const qualityImprovement = this.calculateQualityImprovement(baseline, comparison);
    
    // Calculate file-level comparisons
    const fileComparisons = this.calculateFileComparisons(baseline, comparison);
    
    return {
      baselineId,
      comparisonId,
      overallImprovement,
      complexityImprovement,
      qualityImprovement,
      fileComparisons
    };
  }

  async calculateTrends(startDate: Date, endDate: Date): Promise<TrendReport> {
    const baselines = await this.getBaselinesInRange(startDate, endDate);
    
    if (baselines.length < 2) {
      // Not enough data for trend analysis
      return {
        timeRange: { start: startDate, end: endDate },
        complexityTrend: { direction: 'stable', rate: 0, confidence: 0 },
        qualityTrend: { direction: 'stable', rate: 0, confidence: 0 },
        dataPoints: baselines.map(b => ({
          timestamp: b.timestamp,
          complexity: b.overallMetrics.averageComplexity,
          quality: b.overallMetrics.qualityScore,
          violations: b.overallMetrics.totalViolations
        }))
      };
    }
    
    // Create data points
    const dataPoints: TrendDataPoint[] = baselines.map(baseline => ({
      timestamp: baseline.timestamp,
      complexity: baseline.overallMetrics.averageComplexity,
      quality: baseline.overallMetrics.qualityScore,
      violations: baseline.overallMetrics.totalViolations
    }));
    
    // Calculate trends
    const complexityTrend = this.calculateComplexityTrend(dataPoints.map(dp => dp.complexity));
    const qualityTrend = this.calculateTrend(dataPoints.map(dp => dp.quality));
    
    return {
      timeRange: { start: startDate, end: endDate },
      complexityTrend,
      qualityTrend,
      dataPoints
    };
  }

  async getBaselineHistory(): Promise<Baseline[]> {
    if (!fs.existsSync(this.baselinesDir)) {
      return [];
    }
    
    const files = fs.readdirSync(this.baselinesDir)
      .filter(file => file.endsWith('.json'))
      .sort(); // Sort by filename (which includes timestamp)
    
    const baselines: Baseline[] = [];
    
    for (const file of files) {
      try {
        const baseline = await this.loadBaseline(path.basename(file, '.json'));
        if (baseline) {
          baselines.push(baseline);
        }
      } catch (error) {
        // Skip corrupted files
        console.warn(`Failed to load baseline ${file}:`, error);
      }
    }
    
    // Sort by timestamp
    return baselines.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getLatestBaseline(): Promise<Baseline | null> {
    const history = await this.getBaselineHistory();
    return history.length > 0 ? history[history.length - 1] : null;
  }

  private generateBaselineId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `baseline-${timestamp}-${random}`;
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.baselinesDir)) {
      fs.mkdirSync(this.baselinesDir, { recursive: true });
    }
  }

  private calculateOverallMetrics(analysis: BatchAnalysis, qualityReports: QualityReport[]): BaselineMetrics {
    if (analysis.files.length === 0) {
      return {
        averageComplexity: 0,
        totalViolations: 0,
        qualityScore: 0,
        principleScores: new Map()
      };
    }
    
    // Calculate average complexity
    const totalComplexity = analysis.files.reduce((sum, file) => 
      sum + file.complexity.cyclomaticComplexity + file.complexity.cognitiveComplexity, 0
    );
    const averageComplexity = totalComplexity / (analysis.files.length * 2); // Divide by 2 for two complexity metrics
    
    // Calculate total violations
    const totalViolations = qualityReports.reduce((sum, report) => sum + report.violations.length, 0);
    
    // Calculate overall quality score
    const totalQualityScore = qualityReports.reduce((sum, report) => sum + report.overallScore, 0);
    const qualityScore = totalQualityScore / qualityReports.length;
    
    // Calculate principle scores
    const principleScores = new Map<CleanCodePrinciple, number>();
    const principleCounts = new Map<CleanCodePrinciple, number>();
    
    for (const report of qualityReports) {
      for (const [principle, score] of report.principleScores) {
        const normalizedScore = score.maxScore > 0 ? score.score / score.maxScore : 0;
        principleScores.set(principle, (principleScores.get(principle) || 0) + normalizedScore);
        principleCounts.set(principle, (principleCounts.get(principle) || 0) + 1);
      }
    }
    
    // Average the principle scores
    for (const [principle, totalScore] of principleScores) {
      const count = principleCounts.get(principle) || 1;
      principleScores.set(principle, totalScore / count);
    }
    
    return {
      averageComplexity,
      totalViolations,
      qualityScore,
      principleScores
    };
  }

  private createFileMetrics(files: FileAnalysis[], qualityReports: QualityReport[]): FileBaselineMetrics[] {
    return files.map((file, index) => {
      const qualityReport = qualityReports[index];
      
      return {
        filePath: file.filePath,
        complexity: file.complexity,
        qualityScore: qualityReport.overallScore,
        violationCount: qualityReport.violations.length
      };
    });
  }

  private async saveBaseline(baseline: Baseline): Promise<void> {
    const filePath = path.join(this.baselinesDir, `${baseline.id}.json`);
    
    // Convert Map to object for JSON serialization
    const serializable = {
      ...baseline,
      timestamp: baseline.timestamp.toISOString(),
      overallMetrics: {
        ...baseline.overallMetrics,
        principleScores: Object.fromEntries(baseline.overallMetrics.principleScores)
      }
    };
    
    fs.writeFileSync(filePath, JSON.stringify(serializable, null, 2));
  }

  private async loadBaseline(id: string): Promise<Baseline | null> {
    const filePath = path.join(this.baselinesDir, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // Convert back from serialized format
      return {
        ...data,
        timestamp: new Date(data.timestamp),
        overallMetrics: {
          ...data.overallMetrics,
          principleScores: new Map(Object.entries(data.overallMetrics.principleScores))
        }
      };
    } catch (error) {
      console.error(`Failed to load baseline ${id}:`, error);
      return null;
    }
  }

  private calculateOverallImprovement(baseline: Baseline, comparison: Baseline): number {
    const baselineScore = baseline.overallMetrics.qualityScore;
    const comparisonScore = comparison.overallMetrics.qualityScore;
    
    if (baselineScore === 0) {
      return comparisonScore > 0 ? 100 : 0;
    }
    
    return ((comparisonScore - baselineScore) / baselineScore) * 100;
  }

  private calculateComplexityImprovement(baseline: Baseline, comparison: Baseline): number {
    const baselineComplexity = baseline.overallMetrics.averageComplexity;
    const comparisonComplexity = comparison.overallMetrics.averageComplexity;
    
    if (baselineComplexity === 0) {
      return comparisonComplexity === 0 ? 0 : -100;
    }
    
    // For complexity, a decrease is an improvement, so we invert the calculation
    return ((baselineComplexity - comparisonComplexity) / baselineComplexity) * 100;
  }

  private calculateQualityImprovement(baseline: Baseline, comparison: Baseline): number {
    const baselineQuality = baseline.overallMetrics.qualityScore;
    const comparisonQuality = comparison.overallMetrics.qualityScore;
    
    if (baselineQuality === 0) {
      return comparisonQuality > 0 ? 100 : 0;
    }
    
    return ((comparisonQuality - baselineQuality) / baselineQuality) * 100;
  }

  private calculateFileComparisons(baseline: Baseline, comparison: Baseline): FileComparison[] {
    const comparisons: FileComparison[] = [];
    
    // Create a map of comparison files for quick lookup
    const comparisonFiles = new Map(
      comparison.fileMetrics.map(file => [file.filePath, file])
    );
    
    for (const baselineFile of baseline.fileMetrics) {
      const comparisonFile = comparisonFiles.get(baselineFile.filePath);
      
      if (comparisonFile) {
        const complexityChange = this.calculateComplexityChange(baselineFile, comparisonFile);
        const qualityChange = this.calculateQualityChange(baselineFile, comparisonFile);
        const violationChange = comparisonFile.violationCount - baselineFile.violationCount;
        
        comparisons.push({
          filePath: baselineFile.filePath,
          complexityChange,
          qualityChange,
          violationChange
        });
      }
    }
    
    return comparisons;
  }

  private calculateComplexityChange(baseline: FileBaselineMetrics, comparison: FileBaselineMetrics): number {
    const baselineComplexity = baseline.complexity.cyclomaticComplexity + baseline.complexity.cognitiveComplexity;
    const comparisonComplexity = comparison.complexity.cyclomaticComplexity + comparison.complexity.cognitiveComplexity;
    
    if (baselineComplexity === 0) {
      return comparisonComplexity === 0 ? 0 : -100;
    }
    
    // For file-level complexity change, we keep the raw percentage change
    // Negative values indicate complexity decreased (improvement)
    return ((comparisonComplexity - baselineComplexity) / baselineComplexity) * 100;
  }

  private calculateQualityChange(baseline: FileBaselineMetrics, comparison: FileBaselineMetrics): number {
    if (baseline.qualityScore === 0) {
      return comparison.qualityScore > 0 ? 100 : 0;
    }
    
    return ((comparison.qualityScore - baseline.qualityScore) / baseline.qualityScore) * 100;
  }

  private async getBaselinesInRange(startDate: Date, endDate: Date): Promise<Baseline[]> {
    const allBaselines = await this.getBaselineHistory();
    
    return allBaselines.filter(baseline => 
      baseline.timestamp >= startDate && baseline.timestamp <= endDate
    );
  }

  private calculateTrend(values: number[]): Trend {
    if (values.length < 2) {
      return { direction: 'stable', rate: 0, confidence: 0 };
    }
    
    // Simple linear regression to calculate trend
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate correlation coefficient for confidence
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denomX = Math.sqrt(x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0));
    const denomY = Math.sqrt(y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0));
    
    const correlation = denomX * denomY === 0 ? 0 : numerator / (denomX * denomY);
    const confidence = Math.abs(correlation);
    
    // Determine direction based on slope
    let direction: 'improving' | 'declining' | 'stable';
    const threshold = 0.001; // Minimum slope to consider as trend (reduced for more sensitivity)
    
    if (Math.abs(slope) < threshold) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }
    
    return {
      direction,
      rate: Math.abs(slope),
      confidence
    };
  }

  private calculateComplexityTrend(values: number[]): Trend {
    if (values.length < 2) {
      return { direction: 'stable', rate: 0, confidence: 0 };
    }
    
    // For complexity, decreasing values are improving
    const trend = this.calculateTrend(values);
    
    // Invert the direction for complexity (lower is better)
    let direction: 'improving' | 'declining' | 'stable';
    if (trend.direction === 'stable') {
      direction = 'stable';
    } else if (trend.direction === 'improving') {
      direction = 'declining'; // Higher complexity is worse
    } else {
      direction = 'improving'; // Lower complexity is better
    }
    
    return {
      direction,
      rate: trend.rate,
      confidence: trend.confidence
    };
  }
}