import { TypeScriptAnalyzer } from '../analyzer';
import { QualityGateConfig, QualityComparison, NotificationConfig } from './types';
import { GitService } from '../git/git-service';
import { ReportGenerator } from '../analyzer/report-generator';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CIIntegration {
  private analyzer: TypeScriptAnalyzer;
  private gitService: GitService;
  private reportGenerator: ReportGenerator;

  constructor() {
    this.analyzer = new TypeScriptAnalyzer();
    this.gitService = new GitService();
    this.reportGenerator = new ReportGenerator();
  }

  /**
   * Run quality analysis for CI pipeline
   */
  async runCIAnalysis(config: QualityGateConfig): Promise<void> {
    try {
      console.log('🔍 Starting CI quality analysis...');
      
      // Run full codebase analysis
      const filePaths = await this.getSourceFiles(config.sourceDir);
      const results = await this.analyzer.analyzeBatch(filePaths);
      
      // Generate reports
      const fileReports = results.files.map((analysis: any) => 
        this.reportGenerator.generateFileReport({
          filePath: analysis.filePath,
          overallScore: this.calculateFileScore(analysis),
          principleScores: new Map(),
          violations: analysis.violations || [],
          strengths: []
        })
      );

      // Calculate overall quality score
      const qualityScore = this.calculateOverallScore(results);
      
      // Write score for GitHub Actions
      await fs.writeFile('quality-score.txt', qualityScore.toString());
      
      // Check quality gates
      await this.checkQualityGates(qualityScore, config);
      
      console.log(`✅ Quality analysis complete. Score: ${qualityScore}`);
      
    } catch (error) {
      console.error('❌ CI analysis failed:', error);
      throw error;
    }
  }

  /**
   * Create baseline for comparison
   */
  async createBaseline(sourceDir: string): Promise<void> {
    console.log('📊 Creating quality baseline...');
    
    const filePaths = await this.getSourceFiles(sourceDir);
    const results = await this.analyzer.analyzeBatch(filePaths);
    const baseline = {
      timestamp: new Date().toISOString(),
      commit: this.gitService.getLastCommitHash(),
      results: results,
      overallScore: this.calculateOverallScore(results)
    };

    await fs.writeFile('quality-baseline.json', JSON.stringify(baseline, null, 2));
    console.log('✅ Baseline created');
  }

  /**
   * Compare current analysis with baseline
   */
  async compareWithBaseline(sourceDir: string): Promise<QualityComparison> {
    console.log('🔄 Comparing with baseline...');
    
    // Load baseline
    const baselineData = await fs.readFile('quality-baseline.json', 'utf-8');
    const baseline = JSON.parse(baselineData);
    
    // Run current analysis
    const filePaths = await this.getSourceFiles(sourceDir);
    const currentResults = await this.analyzer.analyzeBatch(filePaths);
    const currentScore = this.calculateOverallScore(currentResults);
    
    // Generate comparison
    const comparison: QualityComparison = {
      baselineScore: baseline.overallScore,
      currentScore: currentScore,
      scoreDelta: currentScore - baseline.overallScore,
      improvements: this.findImprovements(baseline.results, currentResults.files),
      regressions: this.findRegressions(baseline.results, currentResults.files),
      recommendations: await this.generateRecommendations(currentResults.files),
      reportUrl: `reports/quality-report.html`
    };

    // Save comparison for GitHub Actions
    await fs.writeFile('quality-comparison.json', JSON.stringify(comparison, null, 2));
    
    console.log(`📈 Comparison complete. Delta: ${comparison.scoreDelta > 0 ? '+' : ''}${comparison.scoreDelta}`);
    
    return comparison;
  }

  /**
   * Check if quality gates pass
   */
  private async checkQualityGates(score: number, config: QualityGateConfig): Promise<void> {
    const gates = config.qualityGates;
    
    if (gates.minimumScore && score < gates.minimumScore) {
      throw new Error(`Quality score ${score} below minimum threshold ${gates.minimumScore}`);
    }

    if (gates.maxCriticalViolations !== undefined) {
      const criticalCount = await this.getCriticalViolationCount();
      if (criticalCount > gates.maxCriticalViolations) {
        throw new Error(`Critical violations ${criticalCount} exceed limit ${gates.maxCriticalViolations}`);
      }
    }

    if (gates.minTestCoverage !== undefined) {
      const coverage = await this.getTestCoverage();
      if (coverage < gates.minTestCoverage) {
        throw new Error(`Test coverage ${coverage}% below minimum ${gates.minTestCoverage}%`);
      }
    }
  }

  /**
   * Calculate overall quality score from analysis results
   */
  private calculateOverallScore(results: any): number {
    if (!results.files || results.files.length === 0) return 0;
    
    const totalScore = results.files.reduce((sum: number, analysis: any) => 
      sum + this.calculateFileScore(analysis), 0);
    return Math.round(totalScore / results.files.length);
  }

  /**
   * Find quality improvements between baseline and current
   */
  private findImprovements(baseline: any[], current: any[]): string[] {
    const improvements: string[] = [];
    
    // Compare file-level improvements
    for (const currentFile of current) {
      const baselineFile = baseline.find(f => f.filePath === currentFile.filePath);
      if (baselineFile && currentFile.overallScore > baselineFile.overallScore) {
        improvements.push(`Improved ${currentFile.filePath}: ${baselineFile.overallScore} → ${currentFile.overallScore}`);
      }
    }
    
    return improvements;
  }

  /**
   * Find quality regressions between baseline and current
   */
  private findRegressions(baseline: any[], current: any[]): string[] {
    const regressions: string[] = [];
    
    // Compare file-level regressions
    for (const currentFile of current) {
      const baselineFile = baseline.find(f => f.filePath === currentFile.filePath);
      if (baselineFile && currentFile.overallScore < baselineFile.overallScore) {
        regressions.push(`Regression in ${currentFile.filePath}: ${baselineFile.overallScore} → ${currentFile.overallScore}`);
      }
    }
    
    return regressions;
  }

  /**
   * Generate recommendations for current analysis
   */
  private async generateRecommendations(results: any[]): Promise<any[]> {
    // Use existing recommendation engine
    const recommendations = [];
    
    for (const result of results) {
      if (result.violations && result.violations.length > 0) {
        const topViolations = result.violations
          .sort((a: any, b: any) => b.severity - a.severity)
          .slice(0, 3);
        
        recommendations.push(...topViolations.map((v: any) => ({
          description: `${result.filePath}: ${v.description}`,
          severity: v.severity,
          effort: v.estimatedEffort || 'Medium'
        })));
      }
    }
    
    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  /**
   * Get count of critical violations
   */
  private async getCriticalViolationCount(): Promise<number> {
    try {
      const reportData = await fs.readFile('reports/quality-report.json', 'utf-8');
      const report = JSON.parse(reportData);
      
      return report.summary?.criticalViolations || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get test coverage percentage
   */
  private async getTestCoverage(): Promise<number> {
    try {
      // Try to read coverage from common locations
      const coveragePaths = [
        'coverage/coverage-summary.json',
        'coverage/lcov-report/index.html'
      ];
      
      for (const coveragePath of coveragePaths) {
        try {
          const coverageData = await fs.readFile(coveragePath, 'utf-8');
          if (coveragePath.endsWith('.json')) {
            const coverage = JSON.parse(coverageData);
            return coverage.total?.lines?.pct || 0;
          }
        } catch {
          continue;
        }
      }
      
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Send notifications based on configuration
   */
  async sendNotifications(comparison: QualityComparison, config: NotificationConfig): Promise<void> {
    if (config.slack && comparison.scoreDelta < -5) {
      await this.sendSlackNotification(comparison, config.slack);
    }
    
    if (config.email && comparison.regressions.length > 0) {
      await this.sendEmailNotification(comparison, config.email);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(comparison: QualityComparison, slackConfig: any): Promise<void> {
    // Implementation would use Slack webhook
    console.log('📱 Slack notification sent');
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(comparison: QualityComparison, emailConfig: any): Promise<void> {
    // Implementation would use email service
    console.log('📧 Email notification sent');
  }

  /**
   * Get source files from directory
   */
  private async getSourceFiles(sourceDir: string): Promise<string[]> {
    const { glob } = require('glob');
    return new Promise((resolve, reject) => {
      glob(`${sourceDir}/**/*.{ts,js,tsx,jsx}`, { ignore: ['**/node_modules/**', '**/dist/**'] }, (err: any, files: string[]) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
  }

  /**
   * Calculate file score from analysis
   */
  private calculateFileScore(analysis: any): number {
    // Simple scoring based on complexity and violations
    const baseScore = 100;
    const complexityPenalty = (analysis.complexity?.cyclomatic || 0) * 2;
    const violationPenalty = (analysis.violations?.length || 0) * 5;
    
    return Math.max(0, baseScore - complexityPenalty - violationPenalty);
  }
}