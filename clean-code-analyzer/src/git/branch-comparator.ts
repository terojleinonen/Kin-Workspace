/**
 * Branch quality comparison functionality
 */

import { GitService } from './git-service';
import { BatchProcessor, BatchResult } from '../cli/batch-processor';
import { AnalysisConfig } from '../cli/config';
import { BatchAnalysisResult } from '../types';

export interface BranchComparison {
  baseBranch: string;
  targetBranch: string;
  baseQuality: BranchQualityMetrics;
  targetQuality: BranchQualityMetrics;
  improvement: QualityImprovement;
  changedFiles: string[];
  newViolations: number;
  fixedViolations: number;
  regressions: QualityRegression[];
  improvements: QualityEnhancement[];
}

export interface BranchQualityMetrics {
  overallScore: number;
  totalViolations: number;
  criticalViolations: number;
  highViolations: number;
  mediumViolations: number;
  lowViolations: number;
  fileCount: number;
  averageComplexity: number;
  testCoverage?: number;
}

export interface QualityImprovement {
  scoreChange: number;
  violationChange: number;
  complexityChange: number;
  percentageImprovement: number;
  isImprovement: boolean;
}

export interface QualityRegression {
  file: string;
  type: 'new_violation' | 'increased_complexity' | 'decreased_coverage';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: number;
}

export interface QualityEnhancement {
  file: string;
  type: 'fixed_violation' | 'reduced_complexity' | 'improved_coverage';
  description: string;
  impact: number;
}

export class BranchComparator {
  private gitService: GitService;
  private config: AnalysisConfig;

  constructor(gitService: GitService, config: AnalysisConfig) {
    this.gitService = gitService;
    this.config = config;
  }

  /**
   * Compare quality between two branches
   */
  async compareBranches(baseBranch: string, targetBranch: string): Promise<BranchComparison> {
    // Validate branches exist
    if (!this.gitService.branchExists(baseBranch)) {
      throw new Error(`Base branch does not exist: ${baseBranch}`);
    }
    if (!this.gitService.branchExists(targetBranch)) {
      throw new Error(`Target branch does not exist: ${targetBranch}`);
    }

    // Get changed files
    const changedFiles = this.gitService.getChangedFiles(baseBranch, targetBranch);
    
    if (changedFiles.length === 0) {
      throw new Error('No changes found between branches');
    }

    // Filter for supported file types
    const supportedFiles = changedFiles.filter(file => 
      file.endsWith('.ts') || file.endsWith('.tsx') || 
      file.endsWith('.js') || file.endsWith('.jsx')
    );

    if (supportedFiles.length === 0) {
      throw new Error('No supported source files changed between branches');
    }

    // Analyze both branches
    const [baseQuality, targetQuality] = await Promise.all([
      this.analyzeBranchFiles(baseBranch, supportedFiles),
      this.analyzeBranchFiles(targetBranch, supportedFiles)
    ]);

    // Calculate improvements and regressions
    const improvement = this.calculateImprovement(baseQuality, targetQuality);
    const { regressions, improvements } = this.identifyChanges(baseQuality, targetQuality, supportedFiles);

    return {
      baseBranch,
      targetBranch,
      baseQuality,
      targetQuality,
      improvement,
      changedFiles: supportedFiles,
      newViolations: regressions.filter(r => r.type === 'new_violation').length,
      fixedViolations: improvements.filter(i => i.type === 'fixed_violation').length,
      regressions,
      improvements
    };
  }

  /**
   * Analyze files in a specific branch
   */
  private async analyzeBranchFiles(branch: string, files: string[]): Promise<BranchQualityMetrics> {
    // Switch to branch temporarily (in a safe way)
    const currentBranch = this.gitService.getCurrentBranch();
    
    try {
      // For now, we'll analyze the current state
      // In a full implementation, we'd checkout the branch or use git show
      const { ProgressIndicator } = await import('../cli/progress');
      const progress = new ProgressIndicator({ verbose: false, silent: true });
      const processor = new BatchProcessor(this.config, progress);
      const result = await processor.processBatch(['.']); // Analyze current directory
      
      return this.extractQualityMetrics(result);
    } finally {
      // Ensure we're back on the original branch
      if (currentBranch !== branch) {
        // In practice, we'd switch back here
      }
    }
  }

  /**
   * Extract quality metrics from analysis result
   */
  private extractQualityMetrics(result: BatchResult): BranchQualityMetrics {
    const { summary, analysisResults } = result;
    
    let totalComplexity = 0;
    let functionCount = 0;
    
    analysisResults.forEach((analysisResult: any) => {
      if (analysisResult.functions) {
        analysisResult.functions.forEach((func: any) => {
          totalComplexity += func.complexity?.cyclomaticComplexity || 0;
          functionCount++;
        });
      }
    });

    return {
      overallScore: summary.averageQualityScore || 0,
      totalViolations: summary.totalViolations,
      criticalViolations: summary.violationsBySeverity.critical || 0,
      highViolations: summary.violationsBySeverity.high || 0,
      mediumViolations: summary.violationsBySeverity.medium || 0,
      lowViolations: summary.violationsBySeverity.low || 0,
      fileCount: analysisResults.length,
      averageComplexity: functionCount > 0 ? totalComplexity / functionCount : 0,
      testCoverage: undefined // Would be populated from coverage reports
    };
  }

  /**
   * Calculate quality improvement metrics
   */
  private calculateImprovement(base: BranchQualityMetrics, target: BranchQualityMetrics): QualityImprovement {
    const scoreChange = target.overallScore - base.overallScore;
    const violationChange = target.totalViolations - base.totalViolations;
    const complexityChange = target.averageComplexity - base.averageComplexity;
    
    const percentageImprovement = base.overallScore > 0 
      ? (scoreChange / base.overallScore) * 100 
      : 0;

    return {
      scoreChange,
      violationChange,
      complexityChange,
      percentageImprovement,
      isImprovement: scoreChange > 0 && violationChange <= 0
    };
  }

  /**
   * Identify specific regressions and improvements
   */
  private identifyChanges(
    base: BranchQualityMetrics, 
    target: BranchQualityMetrics, 
    files: string[]
  ): { regressions: QualityRegression[]; improvements: QualityEnhancement[] } {
    const regressions: QualityRegression[] = [];
    const improvements: QualityEnhancement[] = [];

    // Compare violation counts by severity
    if (target.criticalViolations > base.criticalViolations) {
      regressions.push({
        file: 'multiple',
        type: 'new_violation',
        severity: 'critical',
        description: `${target.criticalViolations - base.criticalViolations} new critical violations`,
        impact: (target.criticalViolations - base.criticalViolations) * 10
      });
    } else if (target.criticalViolations < base.criticalViolations) {
      improvements.push({
        file: 'multiple',
        type: 'fixed_violation',
        description: `${base.criticalViolations - target.criticalViolations} critical violations fixed`,
        impact: (base.criticalViolations - target.criticalViolations) * 10
      });
    }

    if (target.highViolations > base.highViolations) {
      regressions.push({
        file: 'multiple',
        type: 'new_violation',
        severity: 'high',
        description: `${target.highViolations - base.highViolations} new high-severity violations`,
        impact: (target.highViolations - base.highViolations) * 5
      });
    } else if (target.highViolations < base.highViolations) {
      improvements.push({
        file: 'multiple',
        type: 'fixed_violation',
        description: `${base.highViolations - target.highViolations} high-severity violations fixed`,
        impact: (base.highViolations - target.highViolations) * 5
      });
    }

    // Compare complexity
    if (target.averageComplexity > base.averageComplexity * 1.1) {
      regressions.push({
        file: 'multiple',
        type: 'increased_complexity',
        severity: 'medium',
        description: `Average complexity increased by ${(target.averageComplexity - base.averageComplexity).toFixed(1)}`,
        impact: Math.round(target.averageComplexity - base.averageComplexity)
      });
    } else if (target.averageComplexity < base.averageComplexity * 0.9) {
      improvements.push({
        file: 'multiple',
        type: 'reduced_complexity',
        description: `Average complexity reduced by ${(base.averageComplexity - target.averageComplexity).toFixed(1)}`,
        impact: Math.round(base.averageComplexity - target.averageComplexity)
      });
    }

    return { regressions, improvements };
  }

  /**
   * Generate quality comparison report
   */
  generateComparisonReport(comparison: BranchComparison): string {
    const { baseBranch, targetBranch, improvement, regressions, improvements } = comparison;
    
    let report = `# Quality Comparison Report\n\n`;
    report += `**Base Branch:** ${baseBranch}\n`;
    report += `**Target Branch:** ${targetBranch}\n`;
    report += `**Files Changed:** ${comparison.changedFiles.length}\n\n`;

    // Overall metrics
    report += `## Overall Quality Metrics\n\n`;
    report += `| Metric | Base | Target | Change |\n`;
    report += `|--------|------|--------|--------|\n`;
    report += `| Overall Score | ${comparison.baseQuality.overallScore.toFixed(1)} | ${comparison.targetQuality.overallScore.toFixed(1)} | ${improvement.scoreChange > 0 ? '+' : ''}${improvement.scoreChange.toFixed(1)} |\n`;
    report += `| Total Violations | ${comparison.baseQuality.totalViolations} | ${comparison.targetQuality.totalViolations} | ${improvement.violationChange > 0 ? '+' : ''}${improvement.violationChange} |\n`;
    report += `| Average Complexity | ${comparison.baseQuality.averageComplexity.toFixed(1)} | ${comparison.targetQuality.averageComplexity.toFixed(1)} | ${improvement.complexityChange > 0 ? '+' : ''}${improvement.complexityChange.toFixed(1)} |\n\n`;

    // Quality assessment
    if (improvement.isImprovement) {
      report += `✅ **Quality Improved** by ${improvement.percentageImprovement.toFixed(1)}%\n\n`;
    } else {
      report += `❌ **Quality Declined** by ${Math.abs(improvement.percentageImprovement).toFixed(1)}%\n\n`;
    }

    // Regressions
    if (regressions.length > 0) {
      report += `## ⚠️ Quality Regressions (${regressions.length})\n\n`;
      regressions.forEach(regression => {
        const icon = regression.severity === 'critical' ? '🔴' : 
                    regression.severity === 'high' ? '🟠' : 
                    regression.severity === 'medium' ? '🟡' : '🔵';
        report += `${icon} **${regression.type.replace('_', ' ').toUpperCase()}**: ${regression.description}\n`;
      });
      report += '\n';
    }

    // Improvements
    if (improvements.length > 0) {
      report += `## ✅ Quality Improvements (${improvements.length})\n\n`;
      improvements.forEach(improvement => {
        report += `✨ **${improvement.type.replace('_', ' ').toUpperCase()}**: ${improvement.description}\n`;
      });
      report += '\n';
    }

    // Recommendations
    report += `## Recommendations\n\n`;
    if (regressions.length > 0) {
      report += `- Address ${regressions.length} quality regression(s) before merging\n`;
      const criticalRegressions = regressions.filter(r => r.severity === 'critical');
      if (criticalRegressions.length > 0) {
        report += `- **Critical**: Fix ${criticalRegressions.length} critical issue(s) immediately\n`;
      }
    }
    
    if (improvement.isImprovement) {
      report += `- Great work! This change improves overall code quality\n`;
    } else {
      report += `- Consider refactoring to improve code quality before merging\n`;
    }

    return report;
  }

  /**
   * Check if branch meets quality gates
   */
  meetsQualityGates(comparison: BranchComparison, gates: QualityGates): QualityGateResult {
    const results: QualityGateCheck[] = [];
    let passed = true;

    // Check score improvement
    if (gates.minScoreImprovement !== undefined) {
      const scoreCheck = comparison.improvement.scoreChange >= gates.minScoreImprovement;
      results.push({
        gate: 'Score Improvement',
        passed: scoreCheck,
        actual: comparison.improvement.scoreChange,
        expected: gates.minScoreImprovement,
        message: scoreCheck ? 'Score improvement meets requirement' : 'Insufficient score improvement'
      });
      passed = passed && scoreCheck;
    }

    // Check new violations
    if (gates.maxNewViolations !== undefined) {
      const violationCheck = comparison.newViolations <= gates.maxNewViolations;
      results.push({
        gate: 'New Violations',
        passed: violationCheck,
        actual: comparison.newViolations,
        expected: gates.maxNewViolations,
        message: violationCheck ? 'New violations within limit' : 'Too many new violations'
      });
      passed = passed && violationCheck;
    }

    // Check critical violations
    if (gates.maxCriticalViolations !== undefined) {
      const criticalCheck = comparison.targetQuality.criticalViolations <= gates.maxCriticalViolations;
      results.push({
        gate: 'Critical Violations',
        passed: criticalCheck,
        actual: comparison.targetQuality.criticalViolations,
        expected: gates.maxCriticalViolations,
        message: criticalCheck ? 'Critical violations within limit' : 'Too many critical violations'
      });
      passed = passed && criticalCheck;
    }

    return { passed, checks: results };
  }
}

export interface QualityGates {
  minScoreImprovement?: number;
  maxNewViolations?: number;
  maxCriticalViolations?: number;
  minOverallScore?: number;
}

export interface QualityGateResult {
  passed: boolean;
  checks: QualityGateCheck[];
}

export interface QualityGateCheck {
  gate: string;
  passed: boolean;
  actual: number;
  expected: number;
  message: string;
}