/**
 * Tests for branch comparator functionality
 */

import { BranchComparator, QualityGates } from '../../src/git/branch-comparator';
import { GitService } from '../../src/git/git-service';
import { AnalysisConfig, DEFAULT_CONFIG } from '../../src/cli/config';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Mock the BatchProcessor since we're testing Git integration
jest.mock('../../src/cli/batch-processor');

describe('BranchComparator', () => {
  let tempDir: string;
  let gitService: GitService;
  let comparator: BranchComparator;
  let config: AnalysisConfig;

  beforeEach(() => {
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(__dirname, 'temp-branch-'));
    
    // Initialize git repository
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });
    
    gitService = new GitService(tempDir);
    config = { ...DEFAULT_CONFIG };
    comparator = new BranchComparator(gitService, config);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('compareBranches', () => {
    beforeEach(() => {
      // Create initial commit on main branch
      fs.writeFileSync(path.join(tempDir, 'main.ts'), `
function oldFunction() {
  console.log("old implementation");
}
`);
      execSync('git add main.ts', { cwd: tempDir });
      execSync('git commit -m "Initial commit"', { cwd: tempDir });
      
      // Create feature branch with changes
      execSync('git checkout -b feature-branch', { cwd: tempDir });
      fs.writeFileSync(path.join(tempDir, 'feature.ts'), `
function newFunction() {
  console.log("new implementation");
  return true;
}

class FeatureClass {
  private value: number;
  
  constructor(value: number) {
    this.value = value;
  }
  
  getValue(): number {
    return this.value;
  }
}
`);
      execSync('git add feature.ts', { cwd: tempDir });
      execSync('git commit -m "Add new feature"', { cwd: tempDir });
    });

    it('should throw error for non-existent base branch', async () => {
      await expect(comparator.compareBranches('non-existent', 'feature-branch'))
        .rejects.toThrow('Base branch does not exist');
    });

    it('should throw error for non-existent target branch', async () => {
      await expect(comparator.compareBranches('main', 'non-existent'))
        .rejects.toThrow('Target branch does not exist');
    });

    it('should throw error when no changes found', async () => {
      await expect(comparator.compareBranches('main', 'main'))
        .rejects.toThrow('No changes found between branches');
    });

    it('should compare branches successfully', async () => {
      // Mock the batch processor to return predictable results
      const mockBatchProcessor = require('../../src/cli/batch-processor').BatchProcessor;
      mockBatchProcessor.prototype.processFiles = jest.fn().mockResolvedValue({
        summary: {
          averageScore: 85,
          totalViolations: 2,
          violationsBySeverity: { critical: 0, high: 1, medium: 1, low: 0 }
        },
        reports: [
          {
            filePath: 'feature.ts',
            functions: [
              { complexity: { cyclomatic: 2 } },
              { complexity: { cyclomatic: 1 } }
            ]
          }
        ]
      });

      const comparison = await comparator.compareBranches('main', 'feature-branch');

      expect(comparison.baseBranch).toBe('main');
      expect(comparison.targetBranch).toBe('feature-branch');
      expect(comparison.changedFiles).toContain('feature.ts');
      expect(comparison.baseQuality).toBeDefined();
      expect(comparison.targetQuality).toBeDefined();
      expect(comparison.improvement).toBeDefined();
    });
  });

  describe('generateComparisonReport', () => {
    it('should generate markdown report', () => {
      const mockComparison = {
        baseBranch: 'main',
        targetBranch: 'feature',
        baseQuality: {
          overallScore: 80,
          totalViolations: 5,
          averageComplexity: 3.2,
          criticalViolations: 0,
          highViolations: 1,
          mediumViolations: 2,
          lowViolations: 2,
          fileCount: 3
        },
        targetQuality: {
          overallScore: 85,
          totalViolations: 3,
          averageComplexity: 2.8,
          criticalViolations: 0,
          highViolations: 0,
          mediumViolations: 2,
          lowViolations: 1,
          fileCount: 4
        },
        improvement: {
          scoreChange: 5,
          violationChange: -2,
          complexityChange: -0.4,
          percentageImprovement: 6.25,
          isImprovement: true
        },
        changedFiles: ['feature.ts', 'utils.ts'],
        newViolations: 0,
        fixedViolations: 2,
        regressions: [],
        improvements: [
          {
            file: 'multiple',
            type: 'fixed_violation' as const,
            description: '2 high-severity violations fixed',
            impact: 10
          }
        ]
      };

      const report = comparator.generateComparisonReport(mockComparison);

      expect(report).toContain('# Quality Comparison Report');
      expect(report).toContain('**Base Branch:** main');
      expect(report).toContain('**Target Branch:** feature');
      expect(report).toContain('✅ **Quality Improved**');
      expect(report).toContain('## ✅ Quality Improvements');
      expect(report).toContain('2 high-severity violations fixed');
    });

    it('should show quality decline when score decreases', () => {
      const mockComparison = {
        baseBranch: 'main',
        targetBranch: 'feature',
        baseQuality: {
          overallScore: 85,
          totalViolations: 2,
          averageComplexity: 2.5,
          criticalViolations: 0,
          highViolations: 0,
          mediumViolations: 1,
          lowViolations: 1,
          fileCount: 2
        },
        targetQuality: {
          overallScore: 75,
          totalViolations: 5,
          averageComplexity: 3.2,
          criticalViolations: 1,
          highViolations: 1,
          mediumViolations: 2,
          lowViolations: 1,
          fileCount: 3
        },
        improvement: {
          scoreChange: -10,
          violationChange: 3,
          complexityChange: 0.7,
          percentageImprovement: -11.76,
          isImprovement: false
        },
        changedFiles: ['feature.ts'],
        newViolations: 3,
        fixedViolations: 0,
        regressions: [
          {
            file: 'feature.ts',
            type: 'new_violation' as const,
            severity: 'critical' as const,
            description: '1 new critical violation',
            impact: 10
          }
        ],
        improvements: []
      };

      const report = comparator.generateComparisonReport(mockComparison);

      expect(report).toContain('❌ **Quality Declined**');
      expect(report).toContain('## ⚠️ Quality Regressions');
      expect(report).toContain('🔴 **NEW_VIOLATION**');
    });
  });

  describe('meetsQualityGates', () => {
    const mockComparison = {
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
      fixedViolations: 3,
      regressions: [],
      improvements: []
    };

    it('should pass when all gates are met', () => {
      const gates: QualityGates = {
        minScoreImprovement: 0,
        maxNewViolations: 5,
        maxCriticalViolations: 0
      };

      const result = comparator.meetsQualityGates(mockComparison, gates);

      expect(result.passed).toBe(true);
      expect(result.checks).toHaveLength(3);
      expect(result.checks.every(check => check.passed)).toBe(true);
    });

    it('should fail when score improvement is insufficient', () => {
      const gates: QualityGates = {
        minScoreImprovement: 10,
        maxNewViolations: 5,
        maxCriticalViolations: 0
      };

      const result = comparator.meetsQualityGates(mockComparison, gates);

      expect(result.passed).toBe(false);
      expect(result.checks.some(check => 
        check.gate === 'Score Improvement' && !check.passed
      )).toBe(true);
    });

    it('should fail when too many new violations', () => {
      const gates: QualityGates = {
        minScoreImprovement: 0,
        maxNewViolations: 0,
        maxCriticalViolations: 0
      };

      const result = comparator.meetsQualityGates(mockComparison, gates);

      expect(result.passed).toBe(false);
      expect(result.checks.some(check => 
        check.gate === 'New Violations' && !check.passed
      )).toBe(true);
    });

    it('should fail when critical violations exceed limit', () => {
      const comparisonWithCritical = {
        ...mockComparison,
        targetQuality: {
          ...mockComparison.targetQuality,
          criticalViolations: 2
        }
      };

      const gates: QualityGates = {
        minScoreImprovement: 0,
        maxNewViolations: 5,
        maxCriticalViolations: 1
      };

      const result = comparator.meetsQualityGates(comparisonWithCritical, gates);

      expect(result.passed).toBe(false);
      expect(result.checks.some(check => 
        check.gate === 'Critical Violations' && !check.passed
      )).toBe(true);
    });
  });
});