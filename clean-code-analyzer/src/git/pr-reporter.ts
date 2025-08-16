/**
 * Pull Request quality reporter
 */

import { BranchComparison, BranchComparator } from './branch-comparator';
import { GitService } from './git-service';

export interface PRQualityReport {
  prNumber?: string;
  title: string;
  baseBranch: string;
  headBranch: string;
  comparison: BranchComparison;
  summary: PRQualitySummary;
  recommendations: string[];
  approvalStatus: 'approved' | 'needs_work' | 'blocked';
}

export interface PRQualitySummary {
  overallAssessment: 'excellent' | 'good' | 'fair' | 'poor';
  keyMetrics: {
    scoreChange: number;
    violationChange: number;
    filesChanged: number;
    regressionCount: number;
    improvementCount: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface PRReportConfig {
  template: 'github' | 'gitlab' | 'bitbucket' | 'custom';
  includeDetails: boolean;
  includeMetrics: boolean;
  includeRecommendations: boolean;
  qualityGates: {
    minScore: number;
    maxNewViolations: number;
    blockOnCritical: boolean;
  };
}

export const DEFAULT_PR_CONFIG: PRReportConfig = {
  template: 'github',
  includeDetails: true,
  includeMetrics: true,
  includeRecommendations: true,
  qualityGates: {
    minScore: 70,
    maxNewViolations: 5,
    blockOnCritical: true
  }
};

export class PRReporter {
  private comparator: BranchComparator;
  private config: PRReportConfig;

  constructor(comparator: BranchComparator, config: Partial<PRReportConfig> = {}) {
    this.comparator = comparator;
    this.config = { ...DEFAULT_PR_CONFIG, ...config };
  }

  /**
   * Generate PR quality report
   */
  async generateReport(
    baseBranch: string, 
    headBranch: string, 
    prTitle?: string,
    prNumber?: string
  ): Promise<PRQualityReport> {
    // Get branch comparison
    const comparison = await this.comparator.compareBranches(baseBranch, headBranch);
    
    // Generate summary
    const summary = this.generateSummary(comparison);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(comparison, summary);
    
    // Determine approval status
    const approvalStatus = this.determineApprovalStatus(comparison, summary);

    return {
      prNumber,
      title: prTitle || `Quality report for ${headBranch}`,
      baseBranch,
      headBranch,
      comparison,
      summary,
      recommendations,
      approvalStatus
    };
  }

  /**
   * Generate quality summary
   */
  private generateSummary(comparison: BranchComparison): PRQualitySummary {
    const { improvement, regressions, improvements } = comparison;
    
    // Determine overall assessment
    let overallAssessment: 'excellent' | 'good' | 'fair' | 'poor';
    if (improvement.scoreChange >= 10 && regressions.length === 0) {
      overallAssessment = 'excellent';
    } else if (improvement.scoreChange >= 0 && regressions.length <= 2) {
      overallAssessment = 'good';
    } else if (improvement.scoreChange >= -5 && regressions.length <= 5) {
      overallAssessment = 'fair';
    } else {
      overallAssessment = 'poor';
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    const criticalRegressions = regressions.filter(r => r.severity === 'critical').length;
    const highRegressions = regressions.filter(r => r.severity === 'high').length;
    
    if (criticalRegressions > 0) {
      riskLevel = 'critical';
    } else if (highRegressions > 2 || improvement.scoreChange < -10) {
      riskLevel = 'high';
    } else if (highRegressions > 0 || improvement.scoreChange < -5) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      overallAssessment,
      keyMetrics: {
        scoreChange: improvement.scoreChange,
        violationChange: improvement.violationChange,
        filesChanged: comparison.changedFiles.length,
        regressionCount: regressions.length,
        improvementCount: improvements.length
      },
      riskLevel
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(comparison: BranchComparison, summary: PRQualitySummary): string[] {
    const recommendations: string[] = [];
    const { regressions, improvements } = comparison;

    // Critical issues
    const criticalRegressions = regressions.filter(r => r.severity === 'critical');
    if (criticalRegressions.length > 0) {
      recommendations.push(`🔴 **Critical**: Address ${criticalRegressions.length} critical quality issue(s) before merging`);
    }

    // High severity issues
    const highRegressions = regressions.filter(r => r.severity === 'high');
    if (highRegressions.length > 0) {
      recommendations.push(`🟠 **High Priority**: Fix ${highRegressions.length} high-severity issue(s)`);
    }

    // Score improvement
    if (comparison.improvement.scoreChange < 0) {
      recommendations.push(`📉 Consider refactoring to improve quality score (currently ${comparison.improvement.scoreChange.toFixed(1)} points lower)`);
    }

    // New violations
    if (comparison.newViolations > this.config.qualityGates.maxNewViolations) {
      recommendations.push(`⚠️ Reduce new violations from ${comparison.newViolations} to ${this.config.qualityGates.maxNewViolations} or fewer`);
    }

    // Positive feedback
    if (improvements.length > 0) {
      recommendations.push(`✅ Great work! ${improvements.length} quality improvement(s) detected`);
    }

    // Risk-based recommendations
    if (summary.riskLevel === 'high' || summary.riskLevel === 'critical') {
      recommendations.push(`🚨 High risk change - consider additional code review and testing`);
    }

    // Specific improvement suggestions
    if (comparison.improvement.complexityChange > 2) {
      recommendations.push(`🔄 Consider breaking down complex functions to reduce average complexity`);
    }

    return recommendations;
  }

  /**
   * Determine approval status
   */
  private determineApprovalStatus(comparison: BranchComparison, summary: PRQualitySummary): 'approved' | 'needs_work' | 'blocked' {
    const { regressions } = comparison;
    const criticalRegressions = regressions.filter(r => r.severity === 'critical');

    // Block on critical issues if configured
    if (this.config.qualityGates.blockOnCritical && criticalRegressions.length > 0) {
      return 'blocked';
    }

    // Block on too many new violations
    if (comparison.newViolations > this.config.qualityGates.maxNewViolations) {
      return 'blocked';
    }

    // Block on very low score
    if (comparison.targetQuality.overallScore < this.config.qualityGates.minScore) {
      return 'blocked';
    }

    // Needs work if there are significant issues
    if (summary.riskLevel === 'high' || summary.overallAssessment === 'poor') {
      return 'needs_work';
    }

    return 'approved';
  }

  /**
   * Format report for GitHub
   */
  formatForGitHub(report: PRQualityReport): string {
    const { comparison, summary, recommendations, approvalStatus } = report;
    
    let markdown = `## 🔍 Code Quality Report\n\n`;

    // Status badge
    const statusIcon = approvalStatus === 'approved' ? '✅' : 
                      approvalStatus === 'needs_work' ? '⚠️' : '❌';
    const statusText = approvalStatus === 'approved' ? 'Approved' : 
                      approvalStatus === 'needs_work' ? 'Needs Work' : 'Blocked';
    
    markdown += `${statusIcon} **Status**: ${statusText}\n\n`;

    // Overall assessment
    const assessmentIcon = summary.overallAssessment === 'excellent' ? '🌟' :
                          summary.overallAssessment === 'good' ? '✅' :
                          summary.overallAssessment === 'fair' ? '⚠️' : '❌';
    
    markdown += `${assessmentIcon} **Overall Assessment**: ${summary.overallAssessment.toUpperCase()}\n\n`;

    // Key metrics
    if (this.config.includeMetrics) {
      markdown += `### 📊 Key Metrics\n\n`;
      markdown += `| Metric | Value | Change |\n`;
      markdown += `|--------|-------|--------|\n`;
      markdown += `| Quality Score | ${comparison.targetQuality.overallScore.toFixed(1)}/100 | ${comparison.improvement.scoreChange > 0 ? '+' : ''}${comparison.improvement.scoreChange.toFixed(1)} |\n`;
      markdown += `| Total Violations | ${comparison.targetQuality.totalViolations} | ${comparison.improvement.violationChange > 0 ? '+' : ''}${comparison.improvement.violationChange} |\n`;
      markdown += `| Files Changed | ${summary.keyMetrics.filesChanged} | - |\n`;
      markdown += `| Risk Level | ${summary.riskLevel.toUpperCase()} | - |\n\n`;
    }

    // Recommendations
    if (this.config.includeRecommendations && recommendations.length > 0) {
      markdown += `### 💡 Recommendations\n\n`;
      recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }

    // Detailed breakdown
    if (this.config.includeDetails) {
      if (comparison.regressions.length > 0) {
        markdown += `### ⚠️ Quality Regressions (${comparison.regressions.length})\n\n`;
        comparison.regressions.forEach(regression => {
          const icon = regression.severity === 'critical' ? '🔴' : 
                      regression.severity === 'high' ? '🟠' : 
                      regression.severity === 'medium' ? '🟡' : '🔵';
          markdown += `${icon} **${regression.type.replace('_', ' ').toUpperCase()}**: ${regression.description}\n`;
        });
        markdown += '\n';
      }

      if (comparison.improvements.length > 0) {
        markdown += `### ✅ Quality Improvements (${comparison.improvements.length})\n\n`;
        comparison.improvements.forEach(improvement => {
          markdown += `✨ **${improvement.type.replace('_', ' ').toUpperCase()}**: ${improvement.description}\n`;
        });
        markdown += '\n';
      }
    }

    // Footer
    markdown += `---\n`;
    markdown += `*Generated by Clean Code Analyzer*\n`;

    return markdown;
  }

  /**
   * Format report for GitLab
   */
  formatForGitLab(report: PRQualityReport): string {
    // Similar to GitHub but with GitLab-specific formatting
    return this.formatForGitHub(report);
  }

  /**
   * Format report as JSON
   */
  formatAsJSON(report: PRQualityReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Format report as plain text
   */
  formatAsText(report: PRQualityReport): string {
    const { comparison, summary, recommendations, approvalStatus } = report;
    
    let text = `CODE QUALITY REPORT\n`;
    text += `==================\n\n`;
    text += `Status: ${approvalStatus.toUpperCase()}\n`;
    text += `Assessment: ${summary.overallAssessment.toUpperCase()}\n`;
    text += `Risk Level: ${summary.riskLevel.toUpperCase()}\n\n`;
    
    text += `METRICS:\n`;
    text += `- Quality Score: ${comparison.targetQuality.overallScore.toFixed(1)}/100 (${comparison.improvement.scoreChange > 0 ? '+' : ''}${comparison.improvement.scoreChange.toFixed(1)})\n`;
    text += `- Total Violations: ${comparison.targetQuality.totalViolations} (${comparison.improvement.violationChange > 0 ? '+' : ''}${comparison.improvement.violationChange})\n`;
    text += `- Files Changed: ${summary.keyMetrics.filesChanged}\n\n`;
    
    if (recommendations.length > 0) {
      text += `RECOMMENDATIONS:\n`;
      recommendations.forEach((rec, index) => {
        text += `${index + 1}. ${rec.replace(/[*_`]/g, '')}\n`;
      });
    }
    
    return text;
  }
}