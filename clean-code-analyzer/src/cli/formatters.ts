/**
 * Output formatters for different report formats
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { BatchResult, FileAnalysisResult, AnalysisSummary } from './batch-processor';

export interface FormatterOptions {
  verbose: boolean;
  outputFile?: string;
}

export abstract class BaseFormatter {
  protected options: FormatterOptions;
  
  constructor(options: FormatterOptions) {
    this.options = options;
  }
  
  abstract format(result: BatchResult): string;
  
  /**
   * Write output to file or console
   */
  async output(result: BatchResult): Promise<void> {
    const content = this.format(result);
    
    if (this.options.outputFile) {
      await fs.promises.writeFile(this.options.outputFile, content, 'utf8');
      console.log(`Report saved to: ${this.options.outputFile}`);
    } else {
      console.log(content);
    }
  }
}

export class ConsoleFormatter extends BaseFormatter {
  format(result: BatchResult): string {
    const lines: string[] = [];
    
    // Header
    lines.push(chalk.bold.blue('\n📊 Clean Code Analysis Report'));
    lines.push(chalk.gray('='.repeat(50)));
    
    // Summary
    lines.push(this.formatSummary(result.summary, result.totalFiles, result.processedFiles));
    
    // Failed files
    if (result.failedFiles.length > 0) {
      lines.push(this.formatFailedFiles(result.failedFiles));
    }
    
    // Violations by severity
    if (result.summary.totalViolations > 0) {
      lines.push(this.formatViolationsBySeverity(result.summary.violationsBySeverity));
    }
    
    // Violations by principle
    if (result.summary.totalViolations > 0) {
      lines.push(this.formatViolationsByPrinciple(result.summary.violationsByPrinciple));
    }
    
    // Detailed file results (if verbose)
    if (this.options.verbose) {
      lines.push(this.formatDetailedResults(result.analysisResults));
    }
    
    // Footer
    lines.push(chalk.gray('='.repeat(50)));
    
    return lines.join('\n');
  }
  
  private formatSummary(summary: AnalysisSummary, totalFiles: number, processedFiles: number): string {
    const lines: string[] = [];
    
    lines.push(chalk.bold('\n📈 Summary:'));
    lines.push(`  Files analyzed: ${chalk.cyan(processedFiles.toString())} / ${totalFiles}`);
    lines.push(`  Files with issues: ${chalk.yellow(summary.filesWithIssues.toString())}`);
    lines.push(`  Total violations: ${chalk.red(summary.totalViolations.toString())}`);
    lines.push(`  Average quality score: ${this.formatQualityScore(summary.averageQualityScore)}`);
    
    return lines.join('\n');
  }
  
  private formatFailedFiles(failedFiles: string[]): string {
    const lines: string[] = [];
    
    lines.push(chalk.bold.red('\n❌ Failed Files:'));
    for (const file of failedFiles) {
      lines.push(`  ${chalk.red('✗')} ${file}`);
    }
    
    return lines.join('\n');
  }
  
  private formatViolationsBySeverity(violations: Record<string, number>): string {
    const lines: string[] = [];
    
    lines.push(chalk.bold('\n🚨 Violations by Severity:'));
    
    const severityOrder = ['critical', 'high', 'medium', 'low'];
    const severityColors: Record<string, chalk.Chalk> = {
      critical: chalk.red,
      high: chalk.magenta,
      medium: chalk.yellow,
      low: chalk.blue
    };
    
    for (const severity of severityOrder) {
      const count = violations[severity] || 0;
      if (count > 0) {
        const color = severityColors[severity] || chalk.white;
        lines.push(`  ${color(severity.toUpperCase())}: ${count}`);
      }
    }
    
    return lines.join('\n');
  }
  
  private formatViolationsByPrinciple(violations: Record<string, number>): string {
    const lines: string[] = [];
    
    lines.push(chalk.bold('\n📋 Violations by Principle:'));
    
    const sorted = Object.entries(violations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10
    
    for (const [principle, count] of sorted) {
      lines.push(`  ${chalk.cyan(principle.replace('_', ' '))}: ${count}`);
    }
    
    return lines.join('\n');
  }
  
  private formatDetailedResults(results: FileAnalysisResult[]): string {
    const lines: string[] = [];
    
    lines.push(chalk.bold('\n📁 Detailed Results:'));
    
    const resultsWithIssues = results
      .filter(r => r.success && r.violations && r.violations.length > 0)
      .sort((a, b) => (b.violations?.length || 0) - (a.violations?.length || 0))
      .slice(0, 20); // Top 20 files with most issues
    
    for (const result of resultsWithIssues) {
      lines.push(`\n  ${chalk.bold(path.basename(result.filePath))}`);
      lines.push(`    Path: ${chalk.gray(result.filePath)}`);
      lines.push(`    Violations: ${chalk.red(result.violations?.length.toString() || '0')}`);
      
      if (result.violations && result.violations.length > 0) {
        const topViolations = result.violations.slice(0, 3);
        for (const violation of topViolations) {
          const severityColor = this.getSeverityColor(violation.severity);
          lines.push(`      ${severityColor(violation.severity.toUpperCase())}: ${violation.description}`);
        }
        
        if (result.violations.length > 3) {
          lines.push(`      ${chalk.gray(`... and ${result.violations.length - 3} more`)}`);
        }
      }
    }
    
    return lines.join('\n');
  }
  
  private formatQualityScore(score: number): string {
    if (score >= 80) return chalk.green(score.toFixed(1));
    if (score >= 60) return chalk.yellow(score.toFixed(1));
    return chalk.red(score.toFixed(1));
  }
  
  private getSeverityColor(severity: string): chalk.Chalk {
    const colors: Record<string, chalk.Chalk> = {
      critical: chalk.red,
      high: chalk.magenta,
      medium: chalk.yellow,
      low: chalk.blue
    };
    return colors[severity.toLowerCase()] || chalk.white;
  }
}

export class JsonFormatter extends BaseFormatter {
  format(result: BatchResult): string {
    return JSON.stringify(result, null, 2);
  }
}

export class CsvFormatter extends BaseFormatter {
  format(result: BatchResult): string {
    const lines: string[] = [];
    
    // Header
    lines.push('File,Success,Violations,Quality Score,Error');
    
    // Data rows
    for (const analysisResult of result.analysisResults) {
      const violations = analysisResult.violations?.length || 0;
      const qualityScore = analysisResult.metrics?.overallScore || 0;
      const error = analysisResult.error || '';
      
      lines.push([
        analysisResult.filePath,
        analysisResult.success.toString(),
        violations.toString(),
        qualityScore.toFixed(2),
        error.replace(/,/g, ';') // Escape commas in error messages
      ].join(','));
    }
    
    return lines.join('\n');
  }
}

export class HtmlFormatter extends BaseFormatter {
  format(result: BatchResult): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clean Code Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .violations { margin: 20px 0; }
        .file-results { margin: 20px 0; }
        .severity-critical { color: #d32f2f; }
        .severity-high { color: #f57c00; }
        .severity-medium { color: #fbc02d; }
        .severity-low { color: #1976d2; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Clean Code Analysis Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <h2>📈 Summary</h2>
        <ul>
            <li>Files analyzed: ${result.processedFiles} / ${result.totalFiles}</li>
            <li>Files with issues: ${result.summary.filesWithIssues}</li>
            <li>Total violations: ${result.summary.totalViolations}</li>
            <li>Average quality score: ${result.summary.averageQualityScore.toFixed(1)}</li>
        </ul>
    </div>
    
    ${this.formatViolationsHtml(result.summary)}
    ${this.formatFileResultsHtml(result.analysisResults)}
</body>
</html>`;
  }
  
  private formatViolationsHtml(summary: AnalysisSummary): string {
    if (summary.totalViolations === 0) return '';
    
    const severityRows = Object.entries(summary.violationsBySeverity)
      .map(([severity, count]) => 
        `<tr><td class="severity-${severity}">${severity.toUpperCase()}</td><td>${count}</td></tr>`
      ).join('');
    
    const principleRows = Object.entries(summary.violationsByPrinciple)
      .sort(([,a], [,b]) => b - a)
      .map(([principle, count]) => 
        `<tr><td>${principle.replace('_', ' ')}</td><td>${count}</td></tr>`
      ).join('');
    
    return `
    <div class="violations">
        <h2>🚨 Violations by Severity</h2>
        <table>
            <tr><th>Severity</th><th>Count</th></tr>
            ${severityRows}
        </table>
        
        <h2>📋 Violations by Principle</h2>
        <table>
            <tr><th>Principle</th><th>Count</th></tr>
            ${principleRows}
        </table>
    </div>`;
  }
  
  private formatFileResultsHtml(results: FileAnalysisResult[]): string {
    const rows = results
      .filter(r => r.success)
      .map(result => {
        const violations = result.violations?.length || 0;
        const qualityScore = result.metrics?.overallScore || 0;
        
        return `
        <tr>
            <td>${result.filePath}</td>
            <td>${violations}</td>
            <td>${qualityScore.toFixed(1)}</td>
        </tr>`;
      }).join('');
    
    return `
    <div class="file-results">
        <h2>📁 File Results</h2>
        <table>
            <tr><th>File</th><th>Violations</th><th>Quality Score</th></tr>
            ${rows}
        </table>
    </div>`;
  }
}

export function createFormatter(format: string, options: FormatterOptions): BaseFormatter {
  switch (format.toLowerCase()) {
    case 'json':
      return new JsonFormatter(options);
    case 'csv':
      return new CsvFormatter(options);
    case 'html':
      return new HtmlFormatter(options);
    case 'console':
    default:
      return new ConsoleFormatter(options);
  }
}