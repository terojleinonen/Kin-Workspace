/**
 * Report Generator Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  ReportGenerator, 
  FileQualityReport, 
  CodebaseReport,
  ExportOptions 
} from '../../src/analyzer/report-generator';
import { 
  QualityReport, 
  PrincipleScore,
  CleanCodeAssessor 
} from '../../src/analyzer/quality-assessor';
import { 
  ViolationReport,
  ViolationDetector 
} from '../../src/analyzer/violation-detector';
import { 
  CleanCodePrinciple, 
  Severity, 
  Violation,
  CodeLocation 
} from '../../src/types';

describe('ReportGenerator', () => {
  let reportGenerator: ReportGenerator;
  let mockQualityReport: QualityReport;
  let mockViolationReport: ViolationReport;

  beforeEach(() => {
    reportGenerator = new ReportGenerator();
    
    // Create mock data
    const mockLocation: CodeLocation = {
      filePath: 'test.ts',
      line: 10,
      column: 5
    };

    const mockViolation: Violation = {
      id: 'test-violation-1',
      principle: CleanCodePrinciple.NAMING,
      severity: Severity.HIGH,
      location: mockLocation,
      description: 'Variable name is too short',
      suggestion: 'Use a more descriptive name'
    };

    const mockPrincipleScore: PrincipleScore = {
      principle: CleanCodePrinciple.NAMING,
      score: 7,
      maxScore: 10,
      violations: [mockViolation]
    };

    mockQualityReport = {
      filePath: 'test.ts',
      overallScore: 0.75,
      principleScores: new Map([[CleanCodePrinciple.NAMING, mockPrincipleScore]]),
      violations: [mockViolation],
      strengths: ['Good function structure']
    };

    mockViolationReport = {
      filePath: 'test.ts',
      totalViolations: 1,
      violationsByPrinciple: new Map([[CleanCodePrinciple.NAMING, 1]]),
      violationsBySeverity: new Map([[Severity.HIGH, 1]]),
      classifications: [],
      qualityScore: 75
    };
  });

  afterEach(() => {
    // Clean up any generated test files
    const testFiles = [
      'test-report.json',
      'test-report.csv',
      'test-report.html'
    ];
    
    testFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  describe('generateFileReport', () => {
    it('should generate a comprehensive file quality report', () => {
      const fileReport = reportGenerator.generateFileReport(mockQualityReport, mockViolationReport);

      expect(fileReport).toBeDefined();
      expect(fileReport.filePath).toBe('test.ts');
      expect(fileReport.overallScore).toBe(0.75);
      expect(fileReport.principleBreakdown).toHaveLength(1);
      expect(fileReport.violations).toHaveLength(1);
      expect(fileReport.metrics).toBeDefined();
      expect(fileReport.recommendations).toBeDefined();
    });

    it('should create principle breakdown with correct percentages', () => {
      const fileReport = reportGenerator.generateFileReport(mockQualityReport);
      const namingBreakdown = fileReport.principleBreakdown.find(
        p => p.principle === CleanCodePrinciple.NAMING
      );

      expect(namingBreakdown).toBeDefined();
      expect(namingBreakdown!.score).toBe(7);
      expect(namingBreakdown!.maxScore).toBe(10);
      expect(namingBreakdown!.percentage).toBe(0.7);
      expect(namingBreakdown!.status).toBe('good');
      expect(namingBreakdown!.violationCount).toBe(1);
    });

    it('should generate appropriate recommendations based on violations', () => {
      const fileReport = reportGenerator.generateFileReport(mockQualityReport);

      expect(fileReport.recommendations).toContain(
        'Improve variable and function naming for better clarity'
      );
    });

    it('should handle reports with no violations', () => {
      const cleanReport: QualityReport = {
        ...mockQualityReport,
        violations: [],
        principleScores: new Map([[CleanCodePrinciple.NAMING, {
          principle: CleanCodePrinciple.NAMING,
          score: 10,
          maxScore: 10,
          violations: []
        }]])
      };

      const fileReport = reportGenerator.generateFileReport(cleanReport);

      expect(fileReport.violations).toHaveLength(0);
      expect(fileReport.principleBreakdown[0].status).toBe('excellent');
    });
  });

  describe('generateCodebaseReport', () => {
    it('should generate comprehensive codebase report from multiple files', () => {
      const qualityReports = [mockQualityReport, mockQualityReport];
      const violationReports = [mockViolationReport, mockViolationReport];

      const codebaseReport = reportGenerator.generateCodebaseReport(qualityReports, violationReports);

      expect(codebaseReport).toBeDefined();
      expect(codebaseReport.summary.totalFiles).toBe(2);
      expect(codebaseReport.summary.averageQualityScore).toBe(0.75);
      expect(codebaseReport.summary.totalViolations).toBe(2);
      expect(codebaseReport.summary.qualityGrade).toBe('C');
      expect(codebaseReport.fileReports).toHaveLength(2);
      expect(codebaseReport.violationAnalysis).toBeDefined();
      expect(codebaseReport.recommendations).toBeDefined();
      expect(codebaseReport.trends).toBeDefined();
      expect(codebaseReport.generatedAt).toBeDefined();
    });

    it('should calculate correct quality grades', () => {
      const excellentReport: QualityReport = { ...mockQualityReport, overallScore: 0.95 };
      const goodReport: QualityReport = { ...mockQualityReport, overallScore: 0.85 };
      const poorReport: QualityReport = { ...mockQualityReport, overallScore: 0.45 };

      const excellentCodebase = reportGenerator.generateCodebaseReport([excellentReport]);
      const goodCodebase = reportGenerator.generateCodebaseReport([goodReport]);
      const poorCodebase = reportGenerator.generateCodebaseReport([poorReport]);

      expect(excellentCodebase.summary.qualityGrade).toBe('A');
      expect(goodCodebase.summary.qualityGrade).toBe('B');
      expect(poorCodebase.summary.qualityGrade).toBe('F');
    });

    it('should handle empty quality reports', () => {
      const codebaseReport = reportGenerator.generateCodebaseReport([]);

      expect(codebaseReport.summary.totalFiles).toBe(0);
      expect(codebaseReport.summary.averageQualityScore).toBe(0);
      expect(codebaseReport.summary.totalViolations).toBe(0);
      expect(codebaseReport.fileReports).toHaveLength(0);
    });

    it('should aggregate principle scores correctly', () => {
      const report1: QualityReport = {
        ...mockQualityReport,
        principleScores: new Map([[CleanCodePrinciple.NAMING, {
          principle: CleanCodePrinciple.NAMING,
          score: 8,
          maxScore: 10,
          violations: []
        }]])
      };

      const report2: QualityReport = {
        ...mockQualityReport,
        principleScores: new Map([[CleanCodePrinciple.NAMING, {
          principle: CleanCodePrinciple.NAMING,
          score: 6,
          maxScore: 10,
          violations: []
        }]])
      };

      const codebaseReport = reportGenerator.generateCodebaseReport([report1, report2]);

      expect(codebaseReport.summary.principleScores[CleanCodePrinciple.NAMING]).toBe(0.7); // (0.8 + 0.6) / 2
    });
  });

  describe('generateViolationSummaryReport', () => {
    it('should create violation analysis grouped by severity and principle', () => {
      const criticalViolation: Violation = {
        id: 'critical-1',
        principle: CleanCodePrinciple.FUNCTIONS,
        severity: Severity.CRITICAL,
        location: { filePath: 'test.ts', line: 1, column: 1 },
        description: 'Critical function issue',
        suggestion: 'Fix immediately'
      };

      const reportWithCritical: QualityReport = {
        ...mockQualityReport,
        violations: [mockQualityReport.violations[0], criticalViolation]
      };

      const violationAnalysis = reportGenerator.generateViolationSummaryReport([reportWithCritical]);

      expect(violationAnalysis.totalViolations).toBe(2);
      expect(violationAnalysis.bySeverity[Severity.HIGH]).toBe(1);
      expect(violationAnalysis.bySeverity[Severity.CRITICAL]).toBe(1);
      expect(violationAnalysis.byPrinciple[CleanCodePrinciple.NAMING]).toBe(1);
      expect(violationAnalysis.byPrinciple[CleanCodePrinciple.FUNCTIONS]).toBe(1);
      expect(violationAnalysis.criticalIssues).toHaveLength(1);
    });

    it('should identify top violations by frequency', () => {
      const duplicateViolation: Violation = {
        ...mockQualityReport.violations[0],
        id: 'duplicate-violation'
      };

      const reportWithDuplicates: QualityReport = {
        ...mockQualityReport,
        violations: [mockQualityReport.violations[0], duplicateViolation]
      };

      const violationAnalysis = reportGenerator.generateViolationSummaryReport([reportWithDuplicates]);

      expect(violationAnalysis.topViolations).toHaveLength(1);
      expect(violationAnalysis.topViolations[0].description).toBe('Variable name is too short');
    });
  });

  describe('exportReport', () => {
    let tempDir: string;
    let codebaseReport: CodebaseReport;

    beforeEach(() => {
      tempDir = path.join(__dirname, 'temp-reports');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      codebaseReport = reportGenerator.generateCodebaseReport([mockQualityReport]);
    });

    afterEach(() => {
      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should export report as JSON', async () => {
      const outputPath = path.join(tempDir, 'test-report.json');
      const options: ExportOptions = {
        format: 'json',
        includeDetails: true,
        outputPath
      };

      const resultPath = await reportGenerator.exportReport(codebaseReport, options);

      expect(resultPath).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);

      const exportedData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(exportedData.summary).toBeDefined();
      expect(exportedData.fileReports).toBeDefined();
      expect(exportedData.generatedAt).toBeDefined();
    });

    it('should export report as CSV', async () => {
      const outputPath = path.join(tempDir, 'test-report.csv');
      const options: ExportOptions = {
        format: 'csv',
        includeDetails: true,
        outputPath
      };

      const resultPath = await reportGenerator.exportReport(codebaseReport, options);

      expect(resultPath).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);

      const csvContent = fs.readFileSync(outputPath, 'utf-8');
      expect(csvContent).toContain('File Path,Overall Score');
      expect(csvContent).toContain('test.ts');
    });

    it('should export report as HTML', async () => {
      const outputPath = path.join(tempDir, 'test-report.html');
      const options: ExportOptions = {
        format: 'html',
        includeDetails: true,
        outputPath
      };

      const resultPath = await reportGenerator.exportReport(codebaseReport, options);

      expect(resultPath).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);

      const htmlContent = fs.readFileSync(outputPath, 'utf-8');
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('Clean Code Quality Report');
      expect(htmlContent).toContain('Overall Quality Score');
    });

    it('should handle export without details', async () => {
      const outputPath = path.join(tempDir, 'summary-report.json');
      const options: ExportOptions = {
        format: 'json',
        includeDetails: false,
        outputPath
      };

      const resultPath = await reportGenerator.exportReport(codebaseReport, options);

      expect(fs.existsSync(outputPath)).toBe(true);

      const exportedData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(exportedData.summary).toBeDefined();
      expect(exportedData.fileReports).toBeUndefined();
    });

    it('should throw error for unsupported format', async () => {
      const options: ExportOptions = {
        format: 'xml' as any,
        includeDetails: true
      };

      await expect(reportGenerator.exportReport(codebaseReport, options))
        .rejects.toThrow('Unsupported export format: xml');
    });
  });

  describe('exportMetricsJSON', () => {
    it('should export metrics in JSON format', async () => {
      const codebaseReport = reportGenerator.generateCodebaseReport([mockQualityReport]);
      const outputPath = path.join(__dirname, 'metrics.json');

      const resultPath = await reportGenerator.exportMetricsJSON(codebaseReport, outputPath);

      expect(resultPath).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);

      const metricsData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(metricsData.summary).toBeDefined();
      expect(metricsData.violationAnalysis).toBeDefined();
      expect(metricsData.files).toBeDefined();
      expect(metricsData.generatedAt).toBeDefined();

      // Clean up
      fs.unlinkSync(outputPath);
    });
  });

  describe('exportDetailedCSV', () => {
    it('should export detailed CSV with all metrics', async () => {
      const codebaseReport = reportGenerator.generateCodebaseReport([mockQualityReport]);
      const outputPath = path.join(__dirname, 'detailed.csv');

      const resultPath = await reportGenerator.exportDetailedCSV(codebaseReport, outputPath);

      expect(resultPath).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);

      const csvContent = fs.readFileSync(outputPath, 'utf-8');
      const lines = csvContent.split('\n');
      
      // Check header
      expect(lines[0]).toContain('File Path,Overall Score,Quality Grade');
      expect(lines[0]).toContain('Critical Violations,High Violations');
      expect(lines[0]).toContain('Cyclomatic Complexity,Cognitive Complexity');
      
      // Check data row
      expect(lines[1]).toContain('"test.ts"');
      expect(lines[1]).toContain('0.75');
      expect(lines[1]).toContain('C'); // Quality grade

      // Clean up
      fs.unlinkSync(outputPath);
    });
  });

  describe('Integration with Quality Assessor', () => {
    it('should work with real quality assessor output', async () => {
      // Create a temporary test file
      const testFilePath = path.join(__dirname, 'temp-test-file.ts');
      const testCode = `
function a() {
  return 1;
}

class VeryLongClassNameThatViolatesNamingConventions {
  method1() {}
  method2() {}
  method3() {}
}
`;

      fs.writeFileSync(testFilePath, testCode);

      try {
        const { TypeScriptAnalyzer } = await import('../../src/analyzer/file-parser');
        const analyzer = new TypeScriptAnalyzer();
        const analysis = await analyzer.analyzeFile(testFilePath);

        const assessor = new CleanCodeAssessor();
        const qualityReport = assessor.assessFile(analysis);

        const fileReport = reportGenerator.generateFileReport(qualityReport);

        expect(fileReport).toBeDefined();
        expect(fileReport.filePath).toBe(testFilePath);
        expect(fileReport.violations.length).toBeGreaterThan(0);
        expect(fileReport.principleBreakdown.length).toBeGreaterThan(0);
      } finally {
        // Clean up
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with no functions or classes', () => {
      const emptyReport: QualityReport = {
        filePath: 'empty.ts',
        overallScore: 1.0,
        principleScores: new Map(),
        violations: [],
        strengths: ['No violations found']
      };

      const fileReport = reportGenerator.generateFileReport(emptyReport);

      expect(fileReport.overallScore).toBe(1.0);
      expect(fileReport.violations).toHaveLength(0);
      expect(fileReport.principleBreakdown).toHaveLength(0);
    });

    it('should handle very large numbers of violations', () => {
      const manyViolations: Violation[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `violation-${i}`,
        principle: CleanCodePrinciple.NAMING,
        severity: Severity.LOW,
        location: { filePath: 'test.ts', line: i + 1, column: 1 },
        description: `Violation ${i}`,
        suggestion: `Fix violation ${i}`
      }));

      const reportWithManyViolations: QualityReport = {
        ...mockQualityReport,
        violations: manyViolations
      };

      const violationAnalysis = reportGenerator.generateViolationSummaryReport([reportWithManyViolations]);

      expect(violationAnalysis.totalViolations).toBe(1000);
      expect(violationAnalysis.bySeverity[Severity.LOW]).toBe(1000);
      expect(violationAnalysis.topViolations.length).toBeLessThanOrEqual(10);
    });

    it('should handle special characters in file paths', () => {
      const specialPathReport: QualityReport = {
        ...mockQualityReport,
        filePath: 'path/with spaces/and-special@chars#.ts'
      };

      const fileReport = reportGenerator.generateFileReport(specialPathReport);

      expect(fileReport.filePath).toBe('path/with spaces/and-special@chars#.ts');
    });
  });
});