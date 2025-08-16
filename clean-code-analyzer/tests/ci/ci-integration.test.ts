import { CIIntegration } from '../../src/ci/ci-integration';
import { QualityGateConfig, QualityComparison } from '../../src/ci/types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('../../src/analyzer');
jest.mock('../../src/git/git-service');
jest.mock('../../src/analyzer/report-generator');
jest.mock('fs/promises');
jest.mock('glob');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('CIIntegration', () => {
  let ciIntegration: CIIntegration;
  let mockConfig: QualityGateConfig;

  beforeEach(() => {
    ciIntegration = new CIIntegration();
    mockConfig = {
      sourceDir: 'src',
      qualityGates: {
        minimumScore: 75,
        maxCriticalViolations: 0,
        minTestCoverage: 80
      }
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('runCIAnalysis', () => {
    it('should run complete CI analysis successfully', async () => {
      // Mock analyzer results
      const mockResults = [
        { filePath: 'src/test.ts', overallScore: 85, violations: [] },
        { filePath: 'src/utils.ts', overallScore: 75, violations: [] }
      ];

      // Mock file system operations
      mockFs.writeFile.mockResolvedValue(undefined);

      // Mock analyzer methods
      const mockAnalyzer = {
        analyzeBatch: jest.fn().mockResolvedValue({ files: mockResults })
      };
      (ciIntegration as any).analyzer = mockAnalyzer;

      // Mock report generator
      const mockReportGenerator = {
        generateReport: jest.fn().mockResolvedValue({
          json: 'reports/quality-report.json',
          html: 'reports/quality-report.html'
        })
      };
      (ciIntegration as any).reportGenerator = mockReportGenerator;

      await ciIntegration.runCIAnalysis(mockConfig);

      expect(mockAnalyzer.analyzeBatch).toHaveBeenCalled();
      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith(mockResults, {
        format: ['json', 'html'],
        outputDir: 'reports'
      });
      expect(mockFs.writeFile).toHaveBeenCalledWith('quality-score.txt', '80');
    });

    it('should fail when quality score is below threshold', async () => {
      const mockResults = [
        { filePath: 'src/test.ts', overallScore: 60, violations: [] }
      ];

      const mockAnalyzer = {
        analyzeBatch: jest.fn().mockResolvedValue({ files: mockResults })
      };
      (ciIntegration as any).analyzer = mockAnalyzer;

      const mockReportGenerator = {
        generateReport: jest.fn().mockResolvedValue({})
      };
      (ciIntegration as any).reportGenerator = mockReportGenerator;

      mockFs.writeFile.mockResolvedValue(undefined);

      await expect(ciIntegration.runCIAnalysis(mockConfig)).rejects.toThrow(
        'Quality score 60 below minimum threshold 75'
      );
    });

    it('should handle analysis errors gracefully', async () => {
      const mockAnalyzer = {
        analyzeBatch: jest.fn().mockRejectedValue(new Error('Analysis failed'))
      };
      (ciIntegration as any).analyzer = mockAnalyzer;

      await expect(ciIntegration.runCIAnalysis(mockConfig)).rejects.toThrow('Analysis failed');
    });
  });

  describe('createBaseline', () => {
    it('should create quality baseline successfully', async () => {
      const mockResults = [
        { filePath: 'src/test.ts', overallScore: 85, violations: [] }
      ];

      const mockAnalyzer = {
        analyzeBatch: jest.fn().mockResolvedValue({ files: mockResults })
      };
      (ciIntegration as any).analyzer = mockAnalyzer;

      const mockGitService = {
        getLastCommitHash: jest.fn().mockReturnValue('abc123')
      };
      (ciIntegration as any).gitService = mockGitService;

      mockFs.writeFile.mockResolvedValue(undefined);

      await ciIntegration.createBaseline('src');

      expect(mockAnalyzer.analyzeBatch).toHaveBeenCalled();
      expect(mockGitService.getLastCommitHash).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'quality-baseline.json',
        expect.stringContaining('"commit":"abc123"')
      );
    });
  });

  describe('compareWithBaseline', () => {
    it('should compare current analysis with baseline', async () => {
      // Mock baseline data
      const mockBaseline = {
        timestamp: '2023-01-01T00:00:00.000Z',
        commit: 'abc123',
        overallScore: 75,
        results: [
          { filePath: 'src/test.ts', overallScore: 75, violations: [] }
        ]
      };

      // Mock current results
      const mockCurrentResults = [
        { filePath: 'src/test.ts', overallScore: 85, violations: [] }
      ];

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockBaseline));
      mockFs.writeFile.mockResolvedValue(undefined);

      const mockAnalyzer = {
        analyzeDirectory: jest.fn().mockResolvedValue(mockCurrentResults)
      };
      (ciIntegration as any).analyzer = mockAnalyzer;

      const comparison = await ciIntegration.compareWithBaseline('src');

      expect(comparison.baselineScore).toBe(75);
      expect(comparison.currentScore).toBe(85);
      expect(comparison.scoreDelta).toBe(10);
      expect(comparison.improvements).toContain('Improved src/test.ts: 75 → 85');
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'quality-comparison.json',
        expect.stringContaining('"scoreDelta":10')
      );
    });

    it('should detect quality regressions', async () => {
      const mockBaseline = {
        timestamp: '2023-01-01T00:00:00.000Z',
        commit: 'abc123',
        overallScore: 85,
        results: [
          { filePath: 'src/test.ts', overallScore: 85, violations: [] }
        ]
      };

      const mockCurrentResults = [
        { filePath: 'src/test.ts', overallScore: 65, violations: [] }
      ];

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockBaseline));
      mockFs.writeFile.mockResolvedValue(undefined);

      const mockAnalyzer = {
        analyzeDirectory: jest.fn().mockResolvedValue(mockCurrentResults)
      };
      (ciIntegration as any).analyzer = mockAnalyzer;

      const comparison = await ciIntegration.compareWithBaseline('src');

      expect(comparison.baselineScore).toBe(85);
      expect(comparison.currentScore).toBe(65);
      expect(comparison.scoreDelta).toBe(-20);
      expect(comparison.regressions).toContain('Regression in src/test.ts: 85 → 65');
    });

    it('should handle missing baseline file', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(ciIntegration.compareWithBaseline('src')).rejects.toThrow('File not found');
    });
  });

  describe('quality gate checks', () => {
    it('should pass all quality gates when criteria are met', async () => {
      const mockResults = [
        { filePath: 'src/test.ts', overallScore: 85, violations: [] }
      ];

      // Mock quality report with no critical violations
      mockFs.readFile.mockImplementation((path: any) => {
        if (path === 'reports/quality-report.json') {
          return Promise.resolve(JSON.stringify({
            summary: { criticalViolations: 0 }
          }));
        }
        if (path === 'coverage/coverage-summary.json') {
          return Promise.resolve(JSON.stringify({
            total: { lines: { pct: 85 } }
          }));
        }
        return Promise.reject(new Error('File not found'));
      });

      const mockAnalyzer = {
        analyzeDirectory: jest.fn().mockResolvedValue(mockResults)
      };
      (ciIntegration as any).analyzer = mockAnalyzer;

      const mockReportGenerator = {
        generateReport: jest.fn().mockResolvedValue({})
      };
      (ciIntegration as any).reportGenerator = mockReportGenerator;

      mockFs.writeFile.mockResolvedValue(undefined);

      // Should not throw
      await expect(ciIntegration.runCIAnalysis(mockConfig)).resolves.not.toThrow();
    });

    it('should fail when critical violations exceed limit', async () => {
      const mockResults = [
        { filePath: 'src/test.ts', overallScore: 85, violations: [] }
      ];

      // Mock quality report with critical violations
      mockFs.readFile.mockImplementation((path: any) => {
        if (path === 'reports/quality-report.json') {
          return Promise.resolve(JSON.stringify({
            summary: { criticalViolations: 2 }
          }));
        }
        return Promise.reject(new Error('File not found'));
      });

      const mockAnalyzer = {
        analyzeDirectory: jest.fn().mockResolvedValue(mockResults)
      };
      (ciIntegration as any).analyzer = mockAnalyzer;

      const mockReportGenerator = {
        generateReport: jest.fn().mockResolvedValue({})
      };
      (ciIntegration as any).reportGenerator = mockReportGenerator;

      mockFs.writeFile.mockResolvedValue(undefined);

      await expect(ciIntegration.runCIAnalysis(mockConfig)).rejects.toThrow(
        'Critical violations 2 exceed limit 0'
      );
    });

    it('should fail when test coverage is below minimum', async () => {
      const mockResults = [
        { filePath: 'src/test.ts', overallScore: 85, violations: [] }
      ];

      // Mock coverage report with low coverage
      mockFs.readFile.mockImplementation((path: any) => {
        if (path === 'reports/quality-report.json') {
          return Promise.resolve(JSON.stringify({
            summary: { criticalViolations: 0 }
          }));
        }
        if (path === 'coverage/coverage-summary.json') {
          return Promise.resolve(JSON.stringify({
            total: { lines: { pct: 60 } }
          }));
        }
        return Promise.reject(new Error('File not found'));
      });

      const mockAnalyzer = {
        analyzeDirectory: jest.fn().mockResolvedValue(mockResults)
      };
      (ciIntegration as any).analyzer = mockAnalyzer;

      const mockReportGenerator = {
        generateReport: jest.fn().mockResolvedValue({})
      };
      (ciIntegration as any).reportGenerator = mockReportGenerator;

      mockFs.writeFile.mockResolvedValue(undefined);

      await expect(ciIntegration.runCIAnalysis(mockConfig)).rejects.toThrow(
        'Test coverage 60% below minimum 80%'
      );
    });
  });

  describe('recommendation generation', () => {
    it('should generate recommendations from violations', async () => {
      const mockResults = [
        {
          filePath: 'src/test.ts',
          overallScore: 75,
          violations: [
            {
              description: 'Function too long',
              severity: 'high',
              estimatedEffort: 'Medium'
            },
            {
              description: 'Poor naming',
              severity: 'medium',
              estimatedEffort: 'Small'
            }
          ]
        }
      ];

      const recommendations = await (ciIntegration as any).generateRecommendations(mockResults);

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].description).toBe('src/test.ts: Function too long');
      expect(recommendations[0].severity).toBe('high');
      expect(recommendations[0].effort).toBe('Medium');
    });

    it('should limit recommendations to top 10', async () => {
      const violations = Array.from({ length: 15 }, (_, i) => ({
        description: `Violation ${i}`,
        severity: 'medium',
        estimatedEffort: 'Small'
      }));

      const mockResults = [
        {
          filePath: 'src/test.ts',
          overallScore: 50,
          violations: violations
        }
      ];

      const recommendations = await (ciIntegration as any).generateRecommendations(mockResults);

      expect(recommendations).toHaveLength(10);
    });
  });
});