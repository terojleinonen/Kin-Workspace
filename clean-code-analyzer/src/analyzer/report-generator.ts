/**
 * Report Generator - Creates comprehensive quality reports and exports
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  CleanCodePrinciple, 
  Severity, 
  Violation 
} from '../types';
import { QualityReport, OverallQuality, PrincipleScore } from './quality-assessor';
import { ViolationReport, ViolationClassification } from './violation-detector';

export interface FileQualityReport {
  filePath: string;
  overallScore: number;
  principleBreakdown: PrincipleBreakdown[];
  violations: ViolationSummary[];
  metrics: QualityMetrics;
  recommendations: string[];
}

export interface PrincipleBreakdown {
  principle: CleanCodePrinciple;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  violationCount: number;
}

export interface ViolationSummary {
  id: string;
  principle: CleanCodePrinciple;
  severity: Severity;
  description: string;
  suggestion: string;
  location: {
    line: number;
    column: number;
  };
}

export interface QualityMetrics {
  complexity: {
    cyclomatic: number;
    cognitive: number;
    nesting: number;
  };
  maintainability: number;
  testability: number;
  readability: number;
  lineCount: number;
}

export interface CodebaseReport {
  summary: CodebaseSummary;
  fileReports: FileQualityReport[];
  violationAnalysis: ViolationAnalysis;
  recommendations: RecommendationSummary;
  trends: QualityTrends;
  generatedAt: string;
}

export interface CodebaseSummary {
  totalFiles: number;
  averageQualityScore: number;
  totalViolations: number;
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  principleScores: Record<CleanCodePrinciple, number>;
  complexityMetrics: QualityMetrics;
}

export interface ViolationAnalysis {
  totalViolations: number;
  bySeverity: Record<Severity, number>;
  byPrinciple: Record<CleanCodePrinciple, number>;
  topViolations: ViolationSummary[];
  criticalIssues: ViolationSummary[];
}

export interface RecommendationSummary {
  totalRecommendations: number;
  quickWins: string[];
  highImpact: string[];
  longTerm: string[];
}

export interface QualityTrends {
  improvementOpportunities: string[];
  strengths: string[];
  riskAreas: string[];
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'html';
  includeDetails: boolean;
  outputPath?: string;
}

/**
 * Report Generator implementation
 */
export class ReportGenerator {
  private readonly QUALITY_THRESHOLDS = {
    excellent: 0.9,
    good: 0.7,
    needs_improvement: 0.5,
    poor: 0
  };

  private readonly GRADE_THRESHOLDS = {
    A: 0.9,
    B: 0.8,
    C: 0.7,
    D: 0.6,
    F: 0
  };

  /**
   * Generate file-level quality report with principle breakdowns
   */
  generateFileReport(qualityReport: QualityReport, violationReport?: ViolationReport): FileQualityReport {
    const principleBreakdown = this.createPrincipleBreakdown(qualityReport.principleScores);
    const violations = this.createViolationSummary(qualityReport.violations);
    const metrics = this.extractQualityMetrics(qualityReport);
    const recommendations = this.generateFileRecommendations(qualityReport, principleBreakdown);

    return {
      filePath: qualityReport.filePath,
      overallScore: Math.round(qualityReport.overallScore * 100) / 100,
      principleBreakdown,
      violations,
      metrics,
      recommendations
    };
  }

  /**
   * Generate overall codebase report aggregating from individual files
   */
  generateCodebaseReport(
    qualityReports: QualityReport[], 
    violationReports?: ViolationReport[]
  ): CodebaseReport {
    const fileReports = qualityReports.map((report, index) => 
      this.generateFileReport(report, violationReports?.[index])
    );

    const summary = this.createCodebaseSummary(qualityReports, fileReports);
    const violationAnalysis = this.createViolationAnalysis(qualityReports);
    const recommendations = this.createRecommendationSummary(fileReports);
    const trends = this.analyzeTrends(fileReports);

    return {
      summary,
      fileReports,
      violationAnalysis,
      recommendations,
      trends,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate violation summary report grouped by severity and principle
   */
  generateViolationSummaryReport(qualityReports: QualityReport[]): ViolationAnalysis {
    return this.createViolationAnalysis(qualityReports);
  }

  /**
   * Export report in specified format
   */
  async exportReport(report: CodebaseReport, options: ExportOptions): Promise<string> {
    const outputPath = options.outputPath || this.generateDefaultOutputPath(options.format);
    
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(report, outputPath, options.includeDetails);
      case 'csv':
        return this.exportAsCSV(report, outputPath, options.includeDetails);
      case 'html':
        return this.exportAsHTML(report, outputPath, options.includeDetails);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export metrics in JSON format
   */
  async exportMetricsJSON(report: CodebaseReport, outputPath?: string): Promise<string> {
    const filePath = outputPath || this.generateDefaultOutputPath('json');
    const metricsData = {
      summary: report.summary,
      violationAnalysis: report.violationAnalysis,
      generatedAt: report.generatedAt,
      files: report.fileReports.map(file => ({
        filePath: file.filePath,
        overallScore: file.overallScore,
        metrics: file.metrics,
        violationCount: file.violations.length
      }))
    };

    await fs.promises.writeFile(filePath, JSON.stringify(metricsData, null, 2));
    return filePath;
  }

  /**
   * Export detailed CSV report
   */
  async exportDetailedCSV(report: CodebaseReport, outputPath?: string): Promise<string> {
    const filePath = outputPath || this.generateDefaultOutputPath('csv');
    const csvRows: string[] = [];

    // Header
    csvRows.push([
      'File Path',
      'Overall Score',
      'Quality Grade',
      'Total Violations',
      'Critical Violations',
      'High Violations',
      'Medium Violations',
      'Low Violations',
      'Cyclomatic Complexity',
      'Cognitive Complexity',
      'Line Count',
      'Maintainability',
      'Testability',
      'Readability'
    ].join(','));

    // Data rows
    for (const fileReport of report.fileReports) {
      const violationCounts = this.countViolationsBySeverity(fileReport.violations);
      const grade = this.calculateQualityGrade(fileReport.overallScore);
      
      csvRows.push([
        `"${fileReport.filePath}"`,
        fileReport.overallScore.toString(),
        grade,
        fileReport.violations.length.toString(),
        violationCounts[Severity.CRITICAL].toString(),
        violationCounts[Severity.HIGH].toString(),
        violationCounts[Severity.MEDIUM].toString(),
        violationCounts[Severity.LOW].toString(),
        fileReport.metrics.complexity.cyclomatic.toString(),
        fileReport.metrics.complexity.cognitive.toString(),
        fileReport.metrics.lineCount.toString(),
        fileReport.metrics.maintainability.toString(),
        fileReport.metrics.testability.toString(),
        fileReport.metrics.readability.toString()
      ].join(','));
    }

    await fs.promises.writeFile(filePath, csvRows.join('\n'));
    return filePath;
  }

  private createPrincipleBreakdown(principleScores: Map<CleanCodePrinciple, PrincipleScore>): PrincipleBreakdown[] {
    const breakdown: PrincipleBreakdown[] = [];

    for (const [principle, score] of principleScores) {
      const percentage = score.maxScore > 0 ? (score.score / score.maxScore) : 0;
      const status = this.determineQualityStatus(percentage);

      breakdown.push({
        principle,
        score: score.score,
        maxScore: score.maxScore,
        percentage: Math.round(percentage * 100) / 100,
        status,
        violationCount: score.violations.length
      });
    }

    return breakdown.sort((a, b) => b.percentage - a.percentage);
  }

  private createViolationSummary(violations: Violation[]): ViolationSummary[] {
    return violations.map(violation => ({
      id: violation.id,
      principle: violation.principle,
      severity: violation.severity,
      description: violation.description,
      suggestion: violation.suggestion,
      location: {
        line: violation.location.line,
        column: violation.location.column
      }
    }));
  }

  private extractQualityMetrics(qualityReport: QualityReport): QualityMetrics {
    // Extract metrics from the first function or use defaults
    const firstFunction = qualityReport.violations.length > 0 ? 
      qualityReport.violations[0] : null;

    return {
      complexity: {
        cyclomatic: 1, // Default values - would be extracted from actual analysis
        cognitive: 1,
        nesting: 1
      },
      maintainability: Math.round(qualityReport.overallScore * 10),
      testability: Math.round(qualityReport.overallScore * 8),
      readability: Math.round(qualityReport.overallScore * 9),
      lineCount: 0 // Would be extracted from file analysis
    };
  }

  private generateFileRecommendations(
    qualityReport: QualityReport, 
    principleBreakdown: PrincipleBreakdown[]
  ): string[] {
    const recommendations: string[] = [];

    // Add recommendations based on principle scores
    for (const principle of principleBreakdown) {
      if (principle.status === 'poor' || principle.status === 'needs_improvement' || principle.violationCount > 0) {
        switch (principle.principle) {
          case CleanCodePrinciple.NAMING:
            recommendations.push('Improve variable and function naming for better clarity');
            break;
          case CleanCodePrinciple.FUNCTIONS:
            recommendations.push('Break down large functions and reduce complexity');
            break;
          case CleanCodePrinciple.CLASSES:
            recommendations.push('Review class design for single responsibility principle');
            break;
          case CleanCodePrinciple.COMMENTS:
            recommendations.push('Remove unnecessary comments and improve meaningful ones');
            break;
          case CleanCodePrinciple.ERROR_HANDLING:
            recommendations.push('Implement proper error handling and validation');
            break;
        }
      }
    }

    // Add specific recommendations based on violations
    const criticalViolations = qualityReport.violations.filter(v => v.severity === Severity.CRITICAL);
    if (criticalViolations.length > 0) {
      recommendations.push('Address critical violations immediately to prevent technical debt');
    }

    const highViolations = qualityReport.violations.filter(v => v.severity === Severity.HIGH);
    if (highViolations.length > 3) {
      recommendations.push('Focus on high-severity violations to improve code maintainability');
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private createCodebaseSummary(
    qualityReports: QualityReport[], 
    fileReports: FileQualityReport[]
  ): CodebaseSummary {
    const totalFiles = qualityReports.length;
    const averageQualityScore = totalFiles > 0 ? 
      qualityReports.reduce((sum, report) => sum + report.overallScore, 0) / totalFiles : 0;
    
    const totalViolations = qualityReports.reduce((sum, report) => sum + report.violations.length, 0);
    const qualityGrade = this.calculateQualityGrade(averageQualityScore);

    // Calculate principle scores
    const principleScores: Record<CleanCodePrinciple, number> = {} as Record<CleanCodePrinciple, number>;
    const principleCounts: Record<CleanCodePrinciple, number> = {} as Record<CleanCodePrinciple, number>;

    for (const report of qualityReports) {
      for (const [principle, score] of report.principleScores) {
        const normalizedScore = score.maxScore > 0 ? score.score / score.maxScore : 0;
        principleScores[principle] = (principleScores[principle] || 0) + normalizedScore;
        principleCounts[principle] = (principleCounts[principle] || 0) + 1;
      }
    }

    // Average the principle scores
    for (const principle of Object.keys(principleScores) as CleanCodePrinciple[]) {
      const count = principleCounts[principle] || 1;
      principleScores[principle] = Math.round((principleScores[principle] / count) * 100) / 100;
    }

    // Calculate average complexity metrics
    const complexityMetrics: QualityMetrics = {
      complexity: {
        cyclomatic: Math.round(fileReports.reduce((sum, file) => sum + file.metrics.complexity.cyclomatic, 0) / totalFiles),
        cognitive: Math.round(fileReports.reduce((sum, file) => sum + file.metrics.complexity.cognitive, 0) / totalFiles),
        nesting: Math.max(...fileReports.map(file => file.metrics.complexity.nesting))
      },
      maintainability: Math.round(fileReports.reduce((sum, file) => sum + file.metrics.maintainability, 0) / totalFiles),
      testability: Math.round(fileReports.reduce((sum, file) => sum + file.metrics.testability, 0) / totalFiles),
      readability: Math.round(fileReports.reduce((sum, file) => sum + file.metrics.readability, 0) / totalFiles),
      lineCount: fileReports.reduce((sum, file) => sum + file.metrics.lineCount, 0)
    };

    return {
      totalFiles,
      averageQualityScore: Math.round(averageQualityScore * 100) / 100,
      totalViolations,
      qualityGrade,
      principleScores,
      complexityMetrics
    };
  }

  private createViolationAnalysis(qualityReports: QualityReport[]): ViolationAnalysis {
    const allViolations = qualityReports.flatMap(report => report.violations);
    const totalViolations = allViolations.length;

    // Group by severity
    const bySeverity: Record<Severity, number> = {
      [Severity.CRITICAL]: 0,
      [Severity.HIGH]: 0,
      [Severity.MEDIUM]: 0,
      [Severity.LOW]: 0
    };

    // Group by principle
    const byPrinciple: Record<CleanCodePrinciple, number> = {
      [CleanCodePrinciple.NAMING]: 0,
      [CleanCodePrinciple.FUNCTIONS]: 0,
      [CleanCodePrinciple.CLASSES]: 0,
      [CleanCodePrinciple.COMMENTS]: 0,
      [CleanCodePrinciple.ERROR_HANDLING]: 0,
      [CleanCodePrinciple.SOLID_PRINCIPLES]: 0
    };

    for (const violation of allViolations) {
      bySeverity[violation.severity]++;
      byPrinciple[violation.principle]++;
    }

    // Get top violations (most frequent)
    const violationFrequency = new Map<string, { violation: Violation, count: number }>();
    for (const violation of allViolations) {
      const key = `${violation.principle}-${violation.description}`;
      const existing = violationFrequency.get(key);
      if (existing) {
        existing.count++;
      } else {
        violationFrequency.set(key, { violation, count: 1 });
      }
    }

    const topViolations = Array.from(violationFrequency.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => this.createViolationSummary([item.violation])[0]);

    const criticalIssues = allViolations
      .filter(v => v.severity === Severity.CRITICAL)
      .slice(0, 10)
      .map(v => this.createViolationSummary([v])[0]);

    return {
      totalViolations,
      bySeverity,
      byPrinciple,
      topViolations,
      criticalIssues
    };
  }

  private createRecommendationSummary(fileReports: FileQualityReport[]): RecommendationSummary {
    const allRecommendations = fileReports.flatMap(report => report.recommendations);
    const recommendationCounts = new Map<string, number>();

    // Count recommendation frequency
    for (const recommendation of allRecommendations) {
      recommendationCounts.set(recommendation, (recommendationCounts.get(recommendation) || 0) + 1);
    }

    const sortedRecommendations = Array.from(recommendationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([recommendation]) => recommendation);

    return {
      totalRecommendations: sortedRecommendations.length,
      quickWins: sortedRecommendations.filter(r => r.includes('Remove') || r.includes('naming')).slice(0, 5),
      highImpact: sortedRecommendations.filter(r => r.includes('Break down') || r.includes('complexity')).slice(0, 5),
      longTerm: sortedRecommendations.filter(r => r.includes('Review') || r.includes('Implement')).slice(0, 5)
    };
  }

  private analyzeTrends(fileReports: FileQualityReport[]): QualityTrends {
    const avgScore = fileReports.reduce((sum, report) => sum + report.overallScore, 0) / fileReports.length;
    const highQualityFiles = fileReports.filter(report => report.overallScore >= 0.8).length;
    const lowQualityFiles = fileReports.filter(report => report.overallScore < 0.5).length;

    const improvementOpportunities: string[] = [];
    const strengths: string[] = [];
    const riskAreas: string[] = [];

    if (lowQualityFiles > fileReports.length * 0.3) {
      riskAreas.push('High number of low-quality files requiring immediate attention');
    }

    if (highQualityFiles > fileReports.length * 0.7) {
      strengths.push('Majority of files maintain high code quality standards');
    }

    if (avgScore < 0.7) {
      improvementOpportunities.push('Overall codebase quality needs improvement');
    }

    // Analyze common violation patterns
    const commonViolations = fileReports.flatMap(report => report.violations)
      .reduce((acc, violation) => {
        acc[violation.principle] = (acc[violation.principle] || 0) + 1;
        return acc;
      }, {} as Record<CleanCodePrinciple, number>);

    const topViolationPrinciple = Object.entries(commonViolations)
      .sort(([,a], [,b]) => b - a)[0];

    if (topViolationPrinciple) {
      improvementOpportunities.push(`Focus on ${topViolationPrinciple[0]} improvements across the codebase`);
    }

    return {
      improvementOpportunities,
      strengths,
      riskAreas
    };
  }

  private determineQualityStatus(percentage: number): 'excellent' | 'good' | 'needs_improvement' | 'poor' {
    if (percentage >= this.QUALITY_THRESHOLDS.excellent) return 'excellent';
    if (percentage >= this.QUALITY_THRESHOLDS.good) return 'good';
    if (percentage >= this.QUALITY_THRESHOLDS.needs_improvement) return 'needs_improvement';
    return 'poor';
  }

  private calculateQualityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= this.GRADE_THRESHOLDS.A) return 'A';
    if (score >= this.GRADE_THRESHOLDS.B) return 'B';
    if (score >= this.GRADE_THRESHOLDS.C) return 'C';
    if (score >= this.GRADE_THRESHOLDS.D) return 'D';
    return 'F';
  }

  private countViolationsBySeverity(violations: ViolationSummary[]): Record<Severity, number> {
    return violations.reduce((acc, violation) => {
      acc[violation.severity] = (acc[violation.severity] || 0) + 1;
      return acc;
    }, {
      [Severity.CRITICAL]: 0,
      [Severity.HIGH]: 0,
      [Severity.MEDIUM]: 0,
      [Severity.LOW]: 0
    });
  }

  private generateDefaultOutputPath(format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(process.cwd(), `clean-code-report-${timestamp}.${format}`);
  }

  private async exportAsJSON(report: CodebaseReport, outputPath: string, includeDetails: boolean): Promise<string> {
    const exportData = includeDetails ? report : {
      summary: report.summary,
      violationAnalysis: report.violationAnalysis,
      recommendations: report.recommendations,
      generatedAt: report.generatedAt
    };

    await fs.promises.writeFile(outputPath, JSON.stringify(exportData, null, 2));
    return outputPath;
  }

  private async exportAsCSV(report: CodebaseReport, outputPath: string, includeDetails: boolean): Promise<string> {
    return this.exportDetailedCSV(report, outputPath);
  }

  private async exportAsHTML(report: CodebaseReport, outputPath: string, includeDetails: boolean): Promise<string> {
    const html = this.generateHTMLReport(report, includeDetails);
    await fs.promises.writeFile(outputPath, html);
    return outputPath;
  }

  private generateHTMLReport(report: CodebaseReport, includeDetails: boolean): string {
    const { summary, violationAnalysis, recommendations } = report;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clean Code Quality Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .grade { font-size: 48px; font-weight: bold; color: ${this.getGradeColor(summary.qualityGrade)}; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .metric-label { color: #666; font-size: 14px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .violation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .violation-item { background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107; }
        .recommendations { background: #d1ecf1; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8; }
        .file-list { max-height: 400px; overflow-y: auto; }
        .file-item { padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
        .score-bar { width: 100px; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .score-fill { height: 100%; background: linear-gradient(90deg, #dc3545, #ffc107, #28a745); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Clean Code Quality Report</h1>
            <div class="grade">${summary.qualityGrade}</div>
            <p>Overall Quality Score: ${(summary.averageQualityScore * 100).toFixed(1)}%</p>
            <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${summary.totalFiles}</div>
                <div class="metric-label">Files Analyzed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.totalViolations}</div>
                <div class="metric-label">Total Violations</div>
            </div>
            <div class="metric">
                <div class="metric-value">${violationAnalysis.bySeverity[Severity.CRITICAL]}</div>
                <div class="metric-label">Critical Issues</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.complexityMetrics.lineCount.toLocaleString()}</div>
                <div class="metric-label">Lines of Code</div>
            </div>
        </div>

        <div class="section">
            <h2>Violation Analysis</h2>
            <div class="violation-grid">
                <div class="violation-item">
                    <strong>Critical:</strong> ${violationAnalysis.bySeverity[Severity.CRITICAL]}
                </div>
                <div class="violation-item">
                    <strong>High:</strong> ${violationAnalysis.bySeverity[Severity.HIGH]}
                </div>
                <div class="violation-item">
                    <strong>Medium:</strong> ${violationAnalysis.bySeverity[Severity.MEDIUM]}
                </div>
                <div class="violation-item">
                    <strong>Low:</strong> ${violationAnalysis.bySeverity[Severity.LOW]}
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Key Recommendations</h2>
            <div class="recommendations">
                <h3>Quick Wins</h3>
                <ul>
                    ${recommendations.quickWins.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
                <h3>High Impact</h3>
                <ul>
                    ${recommendations.highImpact.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>

        ${includeDetails ? this.generateFileDetailsHTML(report.fileReports) : ''}
    </div>
</body>
</html>`;
  }

  private generateFileDetailsHTML(fileReports: FileQualityReport[]): string {
    return `
        <div class="section">
            <h2>File Details</h2>
            <div class="file-list">
                ${fileReports.map(file => `
                    <div class="file-item">
                        <div>
                            <strong>${path.basename(file.filePath)}</strong>
                            <br>
                            <small>${file.filePath}</small>
                        </div>
                        <div>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${file.overallScore * 100}%"></div>
                            </div>
                            <small>${(file.overallScore * 100).toFixed(1)}%</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
  }

  private getGradeColor(grade: string): string {
    switch (grade) {
      case 'A': return '#28a745';
      case 'B': return '#6f42c1';
      case 'C': return '#ffc107';
      case 'D': return '#fd7e14';
      case 'F': return '#dc3545';
      default: return '#6c757d';
    }
  }
}