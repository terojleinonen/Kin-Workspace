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
  CleanCodePrinciple,
  ImprovementMetrics,
  ROICalculation,
  TeamPerformanceMetrics,
  ContributorMetrics,
  ProgressVisualizationData,
  TimeSeriesPoint,
  ImprovementHeatmapData,
  ROITrendData,
  TeamComparisonData
} from '../types';
import { BatchAnalysis, FileAnalysis } from './file-parser';
import { QualityReport, CleanCodeAssessor } from './quality-assessor';

export interface ProgressTracker {
  recordBaseline(analysis: BatchAnalysis, projectName?: string): Promise<Baseline>;
  compareBaselines(baselineId: string, comparisonId: string): Promise<BaselineComparison>;
  calculateTrends(startDate: Date, endDate: Date): Promise<TrendReport>;
  getBaselineHistory(): Promise<Baseline[]>;
  getLatestBaseline(): Promise<Baseline | null>;
  trackImprovement(baselineId: string, comparisonId: string, timeInvested: number, contributor?: string): Promise<ImprovementMetrics>;
  calculateROI(improvementId: string): Promise<ROICalculation>;
  getTeamPerformance(teamId: string, period: DateRange): Promise<TeamPerformanceMetrics>;
  getProgressVisualizationData(period: DateRange): Promise<ProgressVisualizationData>;
}

/**
 * Progress Tracker implementation for baseline establishment and historical analysis
 */
export class CleanCodeProgressTracker implements ProgressTracker {
  private readonly storageDir: string;
  private readonly baselinesDir: string;
  private readonly improvementsDir: string;
  private readonly teamDataDir: string;
  private readonly qualityAssessor: CleanCodeAssessor;

  constructor(storageDir: string = './progress-data') {
    this.storageDir = storageDir;
    this.baselinesDir = path.join(storageDir, 'baselines');
    this.improvementsDir = path.join(storageDir, 'improvements');
    this.teamDataDir = path.join(storageDir, 'team-data');
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

  async trackImprovement(baselineId: string, comparisonId: string, timeInvested: number, contributor?: string): Promise<ImprovementMetrics> {
    const comparison = await this.compareBaselines(baselineId, comparisonId);
    const baseline = await this.loadBaseline(baselineId);
    const comparisonBaseline = await this.loadBaseline(comparisonId);
    
    if (!baseline || !comparisonBaseline) {
      throw new Error('Baseline not found for improvement tracking');
    }
    
    const id = this.generateImprovementId();
    const timestamp = new Date();
    
    // Calculate files improved (files with positive quality change)
    const filesImproved = comparison.fileComparisons.filter(fc => fc.qualityChange > 0).length;
    
    // Calculate violations fixed (negative violation change means violations were fixed)
    const violationsFixed = comparison.fileComparisons.reduce((sum, fc) => 
      sum + Math.max(0, -fc.violationChange), 0
    );
    
    const improvement: ImprovementMetrics = {
      id,
      timestamp,
      baselineId,
      comparisonId,
      timeInvested,
      qualityImprovement: comparison.qualityImprovement,
      complexityReduction: comparison.complexityImprovement,
      violationsFixed,
      filesImproved,
      contributor
    };
    
    // Save improvement record
    await this.saveImprovement(improvement);
    
    return improvement;
  }

  async calculateROI(improvementId: string): Promise<ROICalculation> {
    const improvement = await this.loadImprovement(improvementId);
    if (!improvement) {
      throw new Error(`Improvement not found: ${improvementId}`);
    }
    
    // ROI calculation based on quality gains and time invested
    // Assumptions for maintenance time savings:
    // - 1% quality improvement = 0.5 hours saved per month per file
    // - 1% complexity reduction = 0.3 hours saved per month per file
    const qualityTimeSavings = (improvement.qualityImprovement / 100) * improvement.filesImproved * 0.5;
    const complexityTimeSavings = (improvement.complexityReduction / 100) * improvement.filesImproved * 0.3;
    const estimatedMaintenanceTimeSaved = (qualityTimeSavings + complexityTimeSavings) * 12; // Annual savings
    
    // ROI = (Gain - Investment) / Investment
    const roi = improvement.timeInvested > 0 ? 
      (estimatedMaintenanceTimeSaved - improvement.timeInvested) / improvement.timeInvested : 0;
    
    // Payback period in months
    const monthlyTimeSavings = (qualityTimeSavings + complexityTimeSavings);
    const paybackPeriod = monthlyTimeSavings > 0 ? improvement.timeInvested / monthlyTimeSavings : 0;
    
    const roiCalculation: ROICalculation = {
      improvementId,
      timeInvested: improvement.timeInvested,
      qualityGain: improvement.qualityImprovement,
      complexityReduction: improvement.complexityReduction,
      estimatedMaintenanceTimeSaved,
      roi,
      paybackPeriod
    };
    
    return roiCalculation;
  }

  async getTeamPerformance(teamId: string, period: DateRange): Promise<TeamPerformanceMetrics> {
    const improvements = await this.getImprovementsInPeriod(period);
    const baselines = await this.getBaselinesInRange(period.start, period.end);
    
    // Group improvements by contributor
    const contributorMap = new Map<string, ImprovementMetrics[]>();
    
    for (const improvement of improvements) {
      if (improvement.contributor) {
        const existing = contributorMap.get(improvement.contributor) || [];
        existing.push(improvement);
        contributorMap.set(improvement.contributor, existing);
      }
    }
    
    // Calculate contributor metrics
    const contributors: ContributorMetrics[] = [];
    
    for (const [contributorId, contributorImprovements] of contributorMap) {
      const improvementsCount = contributorImprovements.length;
      const averageQualityImprovement = contributorImprovements.reduce((sum, imp) => 
        sum + imp.qualityImprovement, 0) / improvementsCount;
      const averageComplexityReduction = contributorImprovements.reduce((sum, imp) => 
        sum + imp.complexityReduction, 0) / improvementsCount;
      const totalTimeInvested = contributorImprovements.reduce((sum, imp) => 
        sum + imp.timeInvested, 0);
      const filesImproved = contributorImprovements.reduce((sum, imp) => 
        sum + imp.filesImproved, 0);
      
      // Calculate individual ROI
      const totalQualityGain = contributorImprovements.reduce((sum, imp) => 
        sum + (imp.qualityImprovement / 100) * imp.filesImproved * 0.5, 0);
      const totalComplexityGain = contributorImprovements.reduce((sum, imp) => 
        sum + (imp.complexityReduction / 100) * imp.filesImproved * 0.3, 0);
      const estimatedAnnualSavings = (totalQualityGain + totalComplexityGain) * 12;
      const individualROI = totalTimeInvested > 0 ? 
        (estimatedAnnualSavings - totalTimeInvested) / totalTimeInvested : 0;
      
      contributors.push({
        contributorId,
        name: contributorId, // In a real system, this would be looked up from user data
        improvementsCount,
        averageQualityImprovement,
        averageComplexityReduction,
        totalTimeInvested,
        individualROI,
        filesImproved
      });
    }
    
    // Calculate team averages
    const teamAverageQuality = baselines.length > 0 ? 
      baselines.reduce((sum, b) => sum + b.overallMetrics.qualityScore, 0) / baselines.length : 0;
    const teamAverageComplexity = baselines.length > 0 ? 
      baselines.reduce((sum, b) => sum + b.overallMetrics.averageComplexity, 0) / baselines.length : 0;
    
    const totalImprovements = improvements.length;
    const totalTimeInvested = improvements.reduce((sum, imp) => sum + imp.timeInvested, 0);
    
    // Calculate team ROI
    const teamQualityGain = improvements.reduce((sum, imp) => 
      sum + (imp.qualityImprovement / 100) * imp.filesImproved * 0.5, 0);
    const teamComplexityGain = improvements.reduce((sum, imp) => 
      sum + (imp.complexityReduction / 100) * imp.filesImproved * 0.3, 0);
    const teamEstimatedAnnualSavings = (teamQualityGain + teamComplexityGain) * 12;
    const teamROI = totalTimeInvested > 0 ? 
      (teamEstimatedAnnualSavings - totalTimeInvested) / totalTimeInvested : 0;
    
    return {
      teamId,
      period,
      contributors,
      teamAverageQuality,
      teamAverageComplexity,
      totalImprovements,
      totalTimeInvested,
      teamROI
    };
  }

  async getProgressVisualizationData(period: DateRange): Promise<ProgressVisualizationData> {
    const baselines = await this.getBaselinesInRange(period.start, period.end);
    const improvements = await this.getImprovementsInPeriod(period);
    
    // Create time series data
    const timeSeriesData: TimeSeriesPoint[] = baselines.map(baseline => ({
      timestamp: baseline.timestamp,
      qualityScore: baseline.overallMetrics.qualityScore,
      complexityScore: baseline.overallMetrics.averageComplexity,
      violationCount: baseline.overallMetrics.totalViolations,
      improvementCount: improvements.filter(imp => 
        imp.timestamp.getTime() <= baseline.timestamp.getTime()).length
    }));
    
    // Create improvement heatmap data
    const fileImprovementMap = new Map<string, { count: number; totalGain: number; lastImprovement: Date; contributor: string }>();
    
    for (const improvement of improvements) {
      const comparison = await this.compareBaselines(improvement.baselineId, improvement.comparisonId);
      
      for (const fileComparison of comparison.fileComparisons) {
        if (fileComparison.qualityChange > 0) {
          const existing = fileImprovementMap.get(fileComparison.filePath) || 
            { count: 0, totalGain: 0, lastImprovement: new Date(0), contributor: '' };
          
          existing.count++;
          existing.totalGain += fileComparison.qualityChange;
          if (improvement.timestamp > existing.lastImprovement) {
            existing.lastImprovement = improvement.timestamp;
            existing.contributor = improvement.contributor || 'Unknown';
          }
          
          fileImprovementMap.set(fileComparison.filePath, existing);
        }
      }
    }
    
    const improvementHeatmap: ImprovementHeatmapData[] = Array.from(fileImprovementMap.entries())
      .map(([filePath, data]) => ({
        filePath,
        improvementCount: data.count,
        qualityGain: data.totalGain,
        lastImprovement: data.lastImprovement,
        contributor: data.contributor
      }));
    
    // Create ROI trends (monthly aggregation)
    const roiTrends: ROITrendData[] = [];
    const monthlyData = new Map<string, { improvements: ImprovementMetrics[]; rois: ROICalculation[] }>();
    
    for (const improvement of improvements) {
      const monthKey = `${improvement.timestamp.getFullYear()}-${improvement.timestamp.getMonth() + 1}`;
      const existing = monthlyData.get(monthKey) || { improvements: [], rois: [] };
      existing.improvements.push(improvement);
      monthlyData.set(monthKey, existing);
    }
    
    for (const [period, data] of monthlyData) {
      const totalTimeInvested = data.improvements.reduce((sum, imp) => sum + imp.timeInvested, 0);
      const totalQualityGain = data.improvements.reduce((sum, imp) => sum + imp.qualityImprovement, 0);
      const improvementCount = data.improvements.length;
      
      // Calculate average ROI for the period
      let totalROI = 0;
      for (const improvement of data.improvements) {
        try {
          const roi = await this.calculateROI(improvement.id);
          totalROI += roi.roi;
        } catch (error) {
          // Skip if ROI calculation fails
        }
      }
      const averageROI = improvementCount > 0 ? totalROI / improvementCount : 0;
      
      roiTrends.push({
        period,
        averageROI,
        totalTimeInvested,
        totalQualityGain,
        improvementCount
      });
    }
    
    // Create team comparison data
    const contributorMap = new Map<string, ImprovementMetrics[]>();
    for (const improvement of improvements) {
      if (improvement.contributor) {
        const existing = contributorMap.get(improvement.contributor) || [];
        existing.push(improvement);
        contributorMap.set(improvement.contributor, existing);
      }
    }
    
    const teamComparison: TeamComparisonData[] = [];
    for (const [contributorId, contributorImprovements] of contributorMap) {
      const qualityScore = contributorImprovements.reduce((sum, imp) => 
        sum + imp.qualityImprovement, 0) / contributorImprovements.length;
      const improvementRate = contributorImprovements.length / 
        ((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24 * 30)); // per month
      
      // Calculate average ROI
      let totalROI = 0;
      let roiCount = 0;
      for (const improvement of contributorImprovements) {
        try {
          const roi = await this.calculateROI(improvement.id);
          totalROI += roi.roi;
          roiCount++;
        } catch (error) {
          // Skip if ROI calculation fails
        }
      }
      const averageROI = roiCount > 0 ? totalROI / roiCount : 0;
      
      teamComparison.push({
        contributorId,
        name: contributorId,
        qualityScore,
        improvementRate,
        roi: averageROI
      });
    }
    
    return {
      timeSeriesData,
      improvementHeatmap,
      roiTrends,
      teamComparison
    };
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
    
    if (!fs.existsSync(this.improvementsDir)) {
      fs.mkdirSync(this.improvementsDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.teamDataDir)) {
      fs.mkdirSync(this.teamDataDir, { recursive: true });
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

  private generateImprovementId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `improvement-${timestamp}-${random}`;
  }

  private async saveImprovement(improvement: ImprovementMetrics): Promise<void> {
    const filePath = path.join(this.improvementsDir, `${improvement.id}.json`);
    
    const serializable = {
      ...improvement,
      timestamp: improvement.timestamp.toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(serializable, null, 2));
  }

  private async loadImprovement(id: string): Promise<ImprovementMetrics | null> {
    const filePath = path.join(this.improvementsDir, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      return {
        ...data,
        timestamp: new Date(data.timestamp)
      };
    } catch (error) {
      console.error(`Failed to load improvement ${id}:`, error);
      return null;
    }
  }

  private async getImprovementsInPeriod(period: DateRange): Promise<ImprovementMetrics[]> {
    if (!fs.existsSync(this.improvementsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(this.improvementsDir)
      .filter(file => file.endsWith('.json'));
    
    const improvements: ImprovementMetrics[] = [];
    
    for (const file of files) {
      try {
        const improvement = await this.loadImprovement(path.basename(file, '.json'));
        if (improvement && 
            improvement.timestamp >= period.start && 
            improvement.timestamp <= period.end) {
          improvements.push(improvement);
        }
      } catch (error) {
        console.warn(`Failed to load improvement ${file}:`, error);
      }
    }
    
    return improvements.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}