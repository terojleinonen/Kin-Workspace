/**
 * Batch processing capabilities for multiple files and directories
 */

import * as path from 'path';
import { TypeScriptAnalyzer, FileAnalysis } from '../analyzer/file-parser';
import { CleanCodeAssessor, QualityReport } from '../analyzer/quality-assessor';
import { ViolationDetector, ViolationReport } from '../analyzer/violation-detector';
import { ReportGenerator } from '../analyzer/report-generator';
import { AnalysisConfig } from './config';
import { ProgressIndicator, BatchProgress } from './progress';
import { FileDiscovery } from './file-discovery';

export interface BatchResult {
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
}

export interface AnalysisSummary {
  totalViolations: number;
  violationsBySeverity: Record<string, number>;
  violationsByPrinciple: Record<string, number>;
  averageQualityScore: number;
  filesWithIssues: number;
}

export class BatchProcessor {
  private config: AnalysisConfig;
  private progress: ProgressIndicator;
  private fileParser: TypeScriptAnalyzer;
  private qualityAssessor: CleanCodeAssessor;
  private violationDetector: ViolationDetector;
  private reportGenerator: ReportGenerator;
  
  constructor(config: AnalysisConfig, progress: ProgressIndicator) {
    this.config = config;
    this.progress = progress;
    this.fileParser = new TypeScriptAnalyzer();
    this.qualityAssessor = new CleanCodeAssessor();
    this.violationDetector = new ViolationDetector();
    this.reportGenerator = new ReportGenerator();
  }
  
  /**
   * Process multiple directories
   */
  async processBatch(directories: string[]): Promise<BatchResult> {
    this.progress.start('Discovering files...');
    
    try {
      // Discover files
      const files = await FileDiscovery.discoverFiles({
        include: this.config.include,
        exclude: this.config.exclude,
        directories
      });
      
      this.progress.succeed(`Found ${files.length} files to analyze`);
      
      if (files.length === 0) {
        this.progress.warn('No files found matching the specified patterns');
        return this.createEmptyResult();
      }
      
      // Process files in batches
      return await this.processFiles(files);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.progress.fail(`File discovery failed: ${errorMessage}`);
      throw error;
    }
  }
  
  /**
   * Process a list of files
   */
  private async processFiles(files: string[]): Promise<BatchResult> {
    const results: FileAnalysisResult[] = [];
    const failedFiles: string[] = [];
    const batchProgress = this.progress.createProgressBar(files.length);
    
    // Process files with concurrency control
    const semaphore = new Semaphore(this.config.maxConcurrency);
    const promises = files.map(async (file, index) => {
      await semaphore.acquire();
      
      try {
        const result = await this.processFile(file);
        results.push(result);
        
        if (!result.success) {
          failedFiles.push(file);
        }
        
        batchProgress.update(index + 1, `Analyzing: ${path.basename(file)}`);
      } finally {
        semaphore.release();
      }
    });
    
    await Promise.all(promises);
    batchProgress.complete(`Analyzed ${files.length} files`);
    
    // Generate summary
    const summary = this.generateSummary(results);
    
    return {
      totalFiles: files.length,
      processedFiles: results.filter(r => r.success).length,
      failedFiles,
      analysisResults: results,
      summary
    };
  }
  
  /**
   * Process a single file
   */
  private async processFile(filePath: string): Promise<FileAnalysisResult> {
    try {
      this.progress.verbose(`Processing: ${filePath}`);
      
      // Parse file
      const analysis = await this.fileParser.analyzeFile(filePath);
      if (!analysis) {
        return {
          filePath,
          success: false,
          error: 'Failed to parse file'
        };
      }
      
      // Assess quality
      const qualityReport = this.qualityAssessor.assessFile(analysis);
      
      // Detect violations
      const violationReport = this.violationDetector.detectViolations(analysis);
      
      // Filter violations by minimum severity
      const filteredViolations = violationReport.classifications
        .map(c => c.violation)
        .filter(v => 
          this.getSeverityLevel(v.severity) >= this.getSeverityLevel(this.config.minSeverity)
        );
      
      return {
        filePath,
        success: true,
        metrics: qualityReport,
        violations: filteredViolations,
        recommendations: [] // TODO: Add recommendations when available
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.progress.verbose(`Error processing ${filePath}: ${errorMessage}`);
      
      return {
        filePath,
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Generate analysis summary
   */
  private generateSummary(results: FileAnalysisResult[]): AnalysisSummary {
    const successfulResults = results.filter(r => r.success);
    
    let totalViolations = 0;
    const violationsBySeverity: Record<string, number> = {};
    const violationsByPrinciple: Record<string, number> = {};
    let totalQualityScore = 0;
    let filesWithIssues = 0;
    
    for (const result of successfulResults) {
      if (result.violations && result.violations.length > 0) {
        filesWithIssues++;
        totalViolations += result.violations.length;
        
        for (const violation of result.violations) {
          // Count by severity
          const severity = violation.severity;
          violationsBySeverity[severity] = (violationsBySeverity[severity] || 0) + 1;
          
          // Count by principle
          const principle = violation.principle;
          violationsByPrinciple[principle] = (violationsByPrinciple[principle] || 0) + 1;
        }
      }
      
      if (result.metrics) {
        totalQualityScore += result.metrics.overallScore || 0;
      }
    }
    
    return {
      totalViolations,
      violationsBySeverity,
      violationsByPrinciple,
      averageQualityScore: successfulResults.length > 0 ? totalQualityScore / successfulResults.length : 0,
      filesWithIssues
    };
  }
  
  /**
   * Get numeric severity level for comparison
   */
  private getSeverityLevel(severity: string): number {
    const levels: Record<string, number> = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return levels[severity.toLowerCase()] || 0;
  }
  
  /**
   * Create empty result for when no files are found
   */
  private createEmptyResult(): BatchResult {
    return {
      totalFiles: 0,
      processedFiles: 0,
      failedFiles: [],
      analysisResults: [],
      summary: {
        totalViolations: 0,
        violationsBySeverity: {},
        violationsByPrinciple: {},
        averageQualityScore: 0,
        filesWithIssues: 0
      }
    };
  }
}

/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];
  
  constructor(permits: number) {
    this.permits = permits;
  }
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }
  
  release(): void {
    this.permits++;
    
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      this.permits--;
      resolve();
    }
  }
}