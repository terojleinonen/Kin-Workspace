/**
 * Report Generation Demo
 * Demonstrates how to use the ReportGenerator to create comprehensive code quality reports
 */

import * as path from 'path';
import { TypeScriptAnalyzer } from '../src/analyzer/file-parser';
import { CleanCodeAssessor, QualityReport } from '../src/analyzer/quality-assessor';
import { ViolationDetector, ViolationReport } from '../src/analyzer/violation-detector';
import { ReportGenerator, ExportOptions } from '../src/analyzer/report-generator';

async function demonstrateReportGeneration() {
  console.log('🔍 Clean Code Report Generation Demo\n');

  // Initialize components
  const analyzer = new TypeScriptAnalyzer();
  const assessor = new CleanCodeAssessor();
  const violationDetector = new ViolationDetector();
  const reportGenerator = new ReportGenerator();

  // Example files to analyze (using demo files from examples directory)
  const filesToAnalyze = [
    path.join(__dirname, 'naming-analysis-demo.ts'),
    path.join(__dirname, 'quality-assessment-demo.ts'),
    path.join(__dirname, 'violation-detection-demo.ts')
  ];

  try {
    console.log('📊 Analyzing files...');
    
    // Step 1: Analyze files
    const qualityReports: QualityReport[] = [];
    const violationReports: ViolationReport[] = [];

    for (const filePath of filesToAnalyze) {
      try {
        console.log(`  - Analyzing: ${path.basename(filePath)}`);
        
        // Parse file and get analysis
        const fileAnalysis = await analyzer.analyzeFile(filePath);
        
        // Assess quality
        const qualityReport = assessor.assessFile(fileAnalysis);
        qualityReports.push(qualityReport);
        
        // Detect violations
        const violationReport = violationDetector.detectViolations(fileAnalysis);
        violationReports.push(violationReport);
        
      } catch (error) {
        console.warn(`    ⚠️  Could not analyze ${filePath}: ${error}`);
      }
    }

    if (qualityReports.length === 0) {
      console.log('❌ No files could be analyzed. Demo will use mock data.');
      return;
    }

    console.log(`✅ Successfully analyzed ${qualityReports.length} files\n`);

    // Step 2: Generate individual file reports
    console.log('📋 Generating file reports...');
    const fileReports = qualityReports.map((report, index) => {
      const fileReport = reportGenerator.generateFileReport(report, violationReports[index]);
      console.log(`  - ${path.basename(fileReport.filePath)}: Score ${(fileReport.overallScore * 100).toFixed(1)}%`);
      return fileReport;
    });

    // Step 3: Generate comprehensive codebase report
    console.log('\n📈 Generating codebase report...');
    const codebaseReport = reportGenerator.generateCodebaseReport(qualityReports, violationReports);
    
    console.log(`  - Total files: ${codebaseReport.summary.totalFiles}`);
    console.log(`  - Average quality score: ${(codebaseReport.summary.averageQualityScore * 100).toFixed(1)}%`);
    console.log(`  - Quality grade: ${codebaseReport.summary.qualityGrade}`);
    console.log(`  - Total violations: ${codebaseReport.summary.totalViolations}`);

    // Step 4: Generate violation summary
    console.log('\n🚨 Violation Analysis:');
    const violationAnalysis = codebaseReport.violationAnalysis;
    console.log(`  - Critical: ${violationAnalysis.bySeverity.critical}`);
    console.log(`  - High: ${violationAnalysis.bySeverity.high}`);
    console.log(`  - Medium: ${violationAnalysis.bySeverity.medium}`);
    console.log(`  - Low: ${violationAnalysis.bySeverity.low}`);

    // Step 5: Show recommendations
    console.log('\n💡 Top Recommendations:');
    const recommendations = codebaseReport.recommendations;
    if (recommendations.quickWins.length > 0) {
      console.log('  Quick Wins:');
      recommendations.quickWins.slice(0, 3).forEach(rec => console.log(`    - ${rec}`));
    }
    if (recommendations.highImpact.length > 0) {
      console.log('  High Impact:');
      recommendations.highImpact.slice(0, 3).forEach(rec => console.log(`    - ${rec}`));
    }

    // Step 6: Export reports in different formats
    console.log('\n💾 Exporting reports...');
    
    const outputDir = path.join(__dirname, '../reports');
    
    // Export as JSON
    const jsonOptions: ExportOptions = {
      format: 'json',
      includeDetails: true,
      outputPath: path.join(outputDir, 'quality-report.json')
    };
    
    try {
      const jsonPath = await reportGenerator.exportReport(codebaseReport, jsonOptions);
      console.log(`  ✅ JSON report exported: ${path.basename(jsonPath)}`);
    } catch (error) {
      console.log(`  📄 JSON export: ${error}`);
    }

    // Export as CSV
    const csvOptions: ExportOptions = {
      format: 'csv',
      includeDetails: true,
      outputPath: path.join(outputDir, 'quality-report.csv')
    };
    
    try {
      const csvPath = await reportGenerator.exportReport(codebaseReport, csvOptions);
      console.log(`  ✅ CSV report exported: ${path.basename(csvPath)}`);
    } catch (error) {
      console.log(`  📊 CSV export: ${error}`);
    }

    // Export as HTML
    const htmlOptions: ExportOptions = {
      format: 'html',
      includeDetails: true,
      outputPath: path.join(outputDir, 'quality-report.html')
    };
    
    try {
      const htmlPath = await reportGenerator.exportReport(codebaseReport, htmlOptions);
      console.log(`  ✅ HTML report exported: ${path.basename(htmlPath)}`);
    } catch (error) {
      console.log(`  🌐 HTML export: ${error}`);
    }

    // Export metrics only
    try {
      const metricsPath = await reportGenerator.exportMetricsJSON(codebaseReport);
      console.log(`  ✅ Metrics JSON exported: ${path.basename(metricsPath)}`);
    } catch (error) {
      console.log(`  📊 Metrics export: ${error}`);
    }

    console.log('\n🎉 Report generation demo completed successfully!');
    console.log('\nGenerated reports include:');
    console.log('  - File-level quality reports with principle breakdowns');
    console.log('  - Overall codebase scoring and aggregation');
    console.log('  - Violation summary reports grouped by severity and principle');
    console.log('  - Multiple export formats (JSON, CSV, HTML)');
    console.log('  - Actionable recommendations for improvement');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Example of using the report generator programmatically
async function programmaticExample() {
  console.log('\n🔧 Programmatic Usage Example\n');

  const reportGenerator = new ReportGenerator();
  
  // Mock data for demonstration
  const mockQualityReport = {
    filePath: 'example.ts',
    overallScore: 0.75,
    principleScores: new Map(),
    violations: [],
    strengths: ['Good function structure']
  };

  // Generate file report
  const fileReport = reportGenerator.generateFileReport(mockQualityReport);
  console.log('File Report Generated:');
  console.log(`  - File: ${fileReport.filePath}`);
  console.log(`  - Score: ${(fileReport.overallScore * 100).toFixed(1)}%`);
  console.log(`  - Violations: ${fileReport.violations.length}`);
  console.log(`  - Recommendations: ${fileReport.recommendations.length}`);

  // Generate codebase report
  const codebaseReport = reportGenerator.generateCodebaseReport([mockQualityReport]);
  console.log('\nCodebase Report Generated:');
  console.log(`  - Files: ${codebaseReport.summary.totalFiles}`);
  console.log(`  - Grade: ${codebaseReport.summary.qualityGrade}`);
  console.log(`  - Generated: ${new Date(codebaseReport.generatedAt).toLocaleString()}`);

  console.log('\n✨ Programmatic example completed!');
}

// Run the demo
if (require.main === module) {
  demonstrateReportGeneration()
    .then(() => programmaticExample())
    .catch(console.error);
}

export { demonstrateReportGeneration, programmaticExample };