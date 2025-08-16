/**
 * Tests for PR reporter functionality
 */

import { PRReporter, DEFAULT_PR_CONFIG } from '../../src/git/pr-reporter';
import { BranchComparator } from '../../src/git/branch-comparator';

// Mock the BranchComparator
jest.mock('../../src/git/branch-comparator');

describe('PRReporter', () => {
  let mockComparator: jest.Mocked<BranchComparator>;
  let reporter: PRReporter;

  beforeEach(() => {
    mockComparator = new BranchComparator(null as any, null as any) as jest.Mocked<BranchComparator>;
    reporter = new PRReporter(mockComparator);
  });

  describe('generateReport', () => {
    const mockComparison = {
      baseBranch: 'main',
      targetBranch: 'feature-branch',
      baseQuality: {
        overallScore: 80,
        totalViolations: 5,
        averageComplexity: 3.0,
        criticalViolations: 0,
        highViolations: 2,
        mediumViolations: 2,
        lowViolations: 1,
        fileCount: 3
      },
      targetQuality: {
        overallScore: 85,
        totalViolations: 3,
        averageComplexity: 2.5,
        criticalViolations: 0,
        highViolations: 1,
        mediumViolations: 1,
        lowViolations: 1,
        fileCount: 3
      },
      improvement: {
        scoreChange: 5,
        violationChange: -2,
        complexityChange: -0.5,
        percentageImprovement: 6.25,
        isImprovement: true
      },
      changedFiles: ['feature.ts', 'utils.ts'],
      newViolations: 1,
      fixedViolations: 3,
      regressions: [],
      improvements: [
        {
          file: 'multiple',
          type: 'fixed_violation' as const,
          description: '1 high-severity violation fixed',
          impact: 5
        }
      ]
    };

    beforeEach(() => {
      mockComparator.compareBranches.mockResolvedValue(mockComparison);
    });

    it('should generate report with excellent assessment', async () => {
      const excellentComparison = {
        ...mockComparison,
        improvement: {
          ...mockComparison.improvement,
          scoreChange: 15
        },
        regressions: []
      };
      mockComparator.compareBranches.mockResolvedValue(excellentComparison);

      const report = await reporter.generateReport('main', 'feature-branch');

      expect(report.summary.overallAssessment).toBe('excellent');
      expect(report.summary.riskLevel).toBe('low');
      expect(report.approvalStatus).toBe('approved');
    });

    it('should generate report with poor assessment for regressions', async () => {
      const poorComparison = {
        ...mockComparison,
        improvement: {
          ...mockComparison.improvement,
          scoreChange: -15
        },
        regressions: [
          {
            file: 'feature.ts',
            type: 'new_violation' as const,
            severity: 'critical' as const,
            description: '2 new critical violations',
            impact: 20
          }
        ]
      };
      mockComparator.compareBranches.mockResolvedValue(poorComparison);

      const report = await reporter.generateReport('main', 'feature-branch');

      expect(report.summary.overallAssessment).toBe('poor');
      expect(report.summary.riskLevel).toBe('critical');
      expect(report.approvalStatus).toBe('blocked');
    });

    it('should include PR metadata when provided', async () => {
      const report = await reporter.generateReport(
        'main', 
        'feature-branch', 
        'Add new feature',
        '123'
      );

      expect(report.title).toBe('Add new feature');
      expect(report.prNumber).toBe('123');
      expect(report.baseBranch).toBe('main');
      expect(report.headBranch).toBe('feature-branch');
    });

    it('should generate appropriate recommendations', async () => {
      const report = await reporter.generateReport('main', 'feature-branch');

      expect(report.recommendations).toContain('✅ Great work! 1 quality improvement(s) detected');
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('approval status determination', () => {
    const baseComparison = {
      baseBranch: 'main',
      targetBranch: 'feature',
      baseQuality: {
        overallScore: 80,
        totalViolations: 5,
        averageComplexity: 3.0,
        criticalViolations: 0,
        highViolations: 2,
        mediumViolations: 2,
        lowViolations: 1,
        fileCount: 3
      },
      targetQuality: {
        overallScore: 85,
        totalViolations: 3,
        averageComplexity: 2.5,
        criticalViolations: 0,
        highViolations: 1,
        mediumViolations: 1,
        lowViolations: 1,
        fileCount: 3
      },
      improvement: {
        scoreChange: 5,
        violationChange: -2,
        complexityChange: -0.5,
        percentageImprovement: 6.25,
        isImprovement: true
      },
      changedFiles: ['feature.ts'],
      newViolations: 1,
      fixedViolations: 2,
      regressions: [],
      improvements: []
    };

    it('should block on critical violations when configured', async () => {
      const criticalComparison = {
        ...baseComparison,
        regressions: [
          {
            file: 'feature.ts',
            type: 'new_violation' as const,
            severity: 'critical' as const,
            description: 'Critical issue',
            impact: 10
          }
        ]
      };
      mockComparator.compareBranches.mockResolvedValue(criticalComparison);

      const report = await reporter.generateReport('main', 'feature');

      expect(report.approvalStatus).toBe('blocked');
    });

    it('should block on too many new violations', async () => {
      const manyViolationsComparison = {
        ...baseComparison,
        newViolations: 10
      };
      mockComparator.compareBranches.mockResolvedValue(manyViolationsComparison);

      const report = await reporter.generateReport('main', 'feature');

      expect(report.approvalStatus).toBe('blocked');
    });

    it('should block on very low score', async () => {
      const lowScoreComparison = {
        ...baseComparison,
        targetQuality: {
          ...baseComparison.targetQuality,
          overallScore: 50
        }
      };
      mockComparator.compareBranches.mockResolvedValue(lowScoreComparison);

      const report = await reporter.generateReport('main', 'feature');

      expect(report.approvalStatus).toBe('blocked');
    });

    it('should approve good quality changes', async () => {
      mockComparator.compareBranches.mockResolvedValue(baseComparison);

      const report = await reporter.generateReport('main', 'feature');

      expect(report.approvalStatus).toBe('approved');
    });
  });

  describe('formatForGitHub', () => {
    const mockReport = {
      prNumber: '123',
      title: 'Add new feature',
      baseBranch: 'main',
      headBranch: 'feature',
      comparison: {
        baseBranch: 'main',
        targetBranch: 'feature',
        baseQuality: {
          overallScore: 80,
          totalViolations: 5,
          averageComplexity: 3.0,
          criticalViolations: 0,
          highViolations: 2,
          mediumViolations: 2,
          lowViolations: 1,
          fileCount: 3
        },
        targetQuality: {
          overallScore: 85,
          totalViolations: 3,
          averageComplexity: 2.5,
          criticalViolations: 0,
          highViolations: 1,
          mediumViolations: 1,
          lowViolations: 1,
          fileCount: 3
        },
        improvement: {
          scoreChange: 5,
          violationChange: -2,
          complexityChange: -0.5,
          percentageImprovement: 6.25,
          isImprovement: true
        },
        changedFiles: ['feature.ts'],
        newViolations: 1,
        fixedViolations: 2,
        regressions: [],
        improvements: [
          {
            file: 'feature.ts',
            type: 'fixed_violation' as const,
            description: '2 violations fixed',
            impact: 10
          }
        ]
      },
      summary: {
        overallAssessment: 'good' as const,
        keyMetrics: {
          scoreChange: 5,
          violationChange: -2,
          filesChanged: 1,
          regressionCount: 0,
          improvementCount: 1
        },
        riskLevel: 'low' as const
      },
      recommendations: [
        '✅ Great work! 1 quality improvement(s) detected'
      ],
      approvalStatus: 'approved' as const
    };

    it('should format approved report correctly', () => {
      const markdown = reporter.formatForGitHub(mockReport);

      expect(markdown).toContain('## 🔍 Code Quality Report');
      expect(markdown).toContain('✅ **Status**: Approved');
      expect(markdown).toContain('✅ **Overall Assessment**: GOOD');
      expect(markdown).toContain('### 📊 Key Metrics');
      expect(markdown).toContain('### 💡 Recommendations');
      expect(markdown).toContain('### ✅ Quality Improvements');
      expect(markdown).toContain('*Generated by Clean Code Analyzer*');
    });

    it('should format blocked report correctly', () => {
      const blockedReport = {
        ...mockReport,
        approvalStatus: 'blocked' as const,
        summary: {
          ...mockReport.summary,
          overallAssessment: 'poor' as const,
          riskLevel: 'critical' as const
        },
        comparison: {
          ...mockReport.comparison,
          regressions: [
            {
              file: 'feature.ts',
              type: 'new_violation' as const,
              severity: 'critical' as const,
              description: 'Critical violation detected',
              impact: 20
            }
          ]
        },
        recommendations: [
          '🔴 **Critical**: Address 1 critical quality issue(s) before merging'
        ]
      };

      const markdown = reporter.formatForGitHub(blockedReport);

      expect(markdown).toContain('❌ **Status**: Blocked');
      expect(markdown).toContain('❌ **Overall Assessment**: POOR');
      expect(markdown).toContain('### ⚠️ Quality Regressions');
      expect(markdown).toContain('🔴 **NEW_VIOLATION**');
    });

    it('should respect configuration options', () => {
      const customReporter = new PRReporter(mockComparator, {
        includeMetrics: false,
        includeRecommendations: false,
        includeDetails: false
      });

      const markdown = customReporter.formatForGitHub(mockReport);

      expect(markdown).not.toContain('### 📊 Key Metrics');
      expect(markdown).not.toContain('### 💡 Recommendations');
      expect(markdown).not.toContain('### ✅ Quality Improvements');
    });
  });

  describe('formatAsJSON', () => {
    it('should format report as valid JSON', () => {
      const mockReport = {
        prNumber: '123',
        title: 'Test PR',
        baseBranch: 'main',
        headBranch: 'feature',
        comparison: {} as any,
        summary: {} as any,
        recommendations: [],
        approvalStatus: 'approved' as const
      };

      const json = reporter.formatAsJSON(mockReport);
      const parsed = JSON.parse(json);

      expect(parsed.prNumber).toBe('123');
      expect(parsed.title).toBe('Test PR');
      expect(parsed.approvalStatus).toBe('approved');
    });
  });

  describe('formatAsText', () => {
    it('should format report as plain text', () => {
      const mockReport = {
        prNumber: '123',
        title: 'Test PR',
        baseBranch: 'main',
        headBranch: 'feature',
        comparison: {
          targetQuality: { overallScore: 85, totalViolations: 3 },
          improvement: { scoreChange: 5, violationChange: -2 }
        } as any,
        summary: {
          overallAssessment: 'good' as const,
          keyMetrics: {
            scoreChange: 5,
            violationChange: -2,
            filesChanged: 2,
            regressionCount: 0,
            improvementCount: 1
          },
          riskLevel: 'low' as const
        },
        recommendations: ['Fix issues', 'Great work!'],
        approvalStatus: 'approved' as const
      };

      const text = reporter.formatAsText(mockReport);

      expect(text).toContain('CODE QUALITY REPORT');
      expect(text).toContain('Status: APPROVED');
      expect(text).toContain('Assessment: GOOD');
      expect(text).toContain('Risk Level: LOW');
      expect(text).toContain('METRICS:');
      expect(text).toContain('RECOMMENDATIONS:');
      expect(text).not.toContain('*'); // No markdown formatting
    });
  });
});