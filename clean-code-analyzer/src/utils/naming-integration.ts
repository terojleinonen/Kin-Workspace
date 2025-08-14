/**
 * Naming Integration Utility - Integrates naming analysis with file analysis
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import { NamingAnalyzer, NamingAnalysisResult } from '../analyzer/naming-analyzer';
import { FileAnalysis } from '../analyzer/file-parser';

/**
 * Extended file analysis that includes naming analysis results
 */
export interface FileAnalysisWithNaming extends FileAnalysis {
  namingAnalysis: NamingAnalysisResult;
}

/**
 * Utility class for integrating naming analysis with file analysis
 */
export class NamingIntegration {
  /**
   * Analyze a file and include naming analysis results
   */
  static async analyzeFileWithNaming(filePath: string, fileAnalysis: FileAnalysis): Promise<FileAnalysisWithNaming> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.ES2020,
      true
    );

    const namingAnalyzer = new NamingAnalyzer(sourceFile);
    const namingAnalysis = namingAnalyzer.analyze();

    return {
      ...fileAnalysis,
      namingAnalysis
    };
  }

  /**
   * Extract naming violations from a file analysis with naming
   */
  static extractNamingViolations(analysis: FileAnalysisWithNaming) {
    return analysis.namingAnalysis.violations;
  }

  /**
   * Get naming metrics from a file analysis with naming
   */
  static getNamingMetrics(analysis: FileAnalysisWithNaming) {
    return analysis.namingAnalysis.metrics;
  }

  /**
   * Get naming suggestions from a file analysis with naming
   */
  static getNamingSuggestions(analysis: FileAnalysisWithNaming) {
    return analysis.namingAnalysis.suggestions;
  }

  /**
   * Calculate naming quality score (0-1) based on naming metrics
   */
  static calculateNamingQualityScore(analysis: FileAnalysisWithNaming): number {
    const metrics = analysis.namingAnalysis.metrics;
    
    if (metrics.totalNames === 0) {
      return 1; // Perfect score for files with no names to analyze
    }

    // Weight different aspects of naming quality
    const violationPenalty = metrics.violationCount / metrics.totalNames;
    const descriptivenessBonusWeight = 0.3;
    const consistencyBonusWeight = 0.3;
    const searchabilityBonusWeight = 0.2;
    const abbreviationPenaltyWeight = 0.2;

    let score = 1.0;

    // Apply violation penalty
    score -= violationPenalty * 0.5;

    // Apply bonus for good practices
    score += metrics.averageDescriptiveness * descriptivenessBonusWeight;
    score += metrics.consistencyScore * consistencyBonusWeight;
    score += metrics.searchabilityScore * searchabilityBonusWeight;

    // Apply penalty for abbreviations
    const abbreviationRatio = metrics.abbreviationCount / metrics.totalNames;
    score -= abbreviationRatio * abbreviationPenaltyWeight;

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Generate a summary of naming issues for reporting
   */
  static generateNamingSummary(analysis: FileAnalysisWithNaming): string {
    const metrics = analysis.namingAnalysis.metrics;
    const violations = analysis.namingAnalysis.violations;

    if (violations.length === 0) {
      return 'Excellent naming conventions - no violations found!';
    }

    const summary = [];
    
    // Count violation types
    const violationTypes = new Map<string, number>();
    violations.forEach(violation => {
      const type = violation.description.split(':')[0];
      violationTypes.set(type, (violationTypes.get(type) || 0) + 1);
    });

    // Generate summary based on most common issues
    const sortedTypes = Array.from(violationTypes.entries())
      .sort((a, b) => b[1] - a[1]);

    sortedTypes.forEach(([type, count]) => {
      if (type.includes('abbreviation')) {
        summary.push(`${count} abbreviation(s) should be expanded`);
      } else if (type.includes('Single letter')) {
        summary.push(`${count} single-letter name(s) need better descriptions`);
      } else if (type.includes('meaningless')) {
        summary.push(`${count} generic name(s) should be more specific`);
      } else if (type.includes('should follow')) {
        summary.push(`${count} naming convention violation(s)`);
      }
    });

    // Add quality metrics
    if (metrics.averageDescriptiveness < 0.5) {
      summary.push('Names could be more descriptive overall');
    }
    if (metrics.consistencyScore < 0.8) {
      summary.push('Naming consistency needs improvement');
    }

    return summary.join(', ');
  }
}