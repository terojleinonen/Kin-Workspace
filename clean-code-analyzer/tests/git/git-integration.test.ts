/**
 * Integration tests for Git functionality
 */

import { GitService } from '../../src/git/git-service';
import { HookInstaller } from '../../src/git/hook-installer';
import { CommitMessageAnalyzer } from '../../src/git/commit-analyzer';
import { BranchComparator } from '../../src/git/branch-comparator';
import { PRReporter } from '../../src/git/pr-reporter';
import { AnalysisConfig, DEFAULT_CONFIG } from '../../src/cli/config';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Mock the BatchProcessor for integration tests
jest.mock('../../src/cli/batch-processor');

describe('Git Integration', () => {
  let tempDir: string;
  let gitService: GitService;
  let config: AnalysisConfig;

  beforeEach(() => {
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(__dirname, 'temp-integration-'));
    
    // Initialize git repository
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });
    
    gitService = new GitService(tempDir);
    config = { ...DEFAULT_CONFIG };
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Complete Git workflow', () => {
    it('should handle complete development workflow', async () => {
      // 1. Install Git hooks
      const installer = new HookInstaller(gitService);
      await installer.installHooks({
        preCommit: { enabled: true },
        commitMsg: { enabled: true },
        prePush: { enabled: false }
      } as Partial<HookConfig>);

      // Verify hooks are installed
      const hookStatus = installer.getHookStatus();
      expect(hookStatus['pre-commit']).toBe(true);
      expect(hookStatus['commit-msg']).toBe(true);

      // 2. Create initial commit on main branch
      fs.writeFileSync(path.join(tempDir, 'main.ts'), `
export function calculateSum(a: number, b: number): number {
  return a + b;
}

export class Calculator {
  add(x: number, y: number): number {
    return x + y;
  }
}
`);
      execSync('git add main.ts', { cwd: tempDir });
      execSync('git commit -m "feat: add calculator functionality"', { cwd: tempDir });

      // 3. Analyze commit message
      const commitAnalyzer = new CommitMessageAnalyzer();
      const commitMessage = gitService.getCommitMessage();
      const commitAnalysis = commitAnalyzer.analyzeMessage(commitMessage);
      
      expect(commitAnalysis.score).toBeGreaterThan(80);
      expect(commitAnalysis.type).toBe('feat');

      // 4. Create feature branch
      execSync('git checkout -b feature/improved-calculator', { cwd: tempDir });
      
      // Add new functionality
      fs.writeFileSync(path.join(tempDir, 'advanced-calculator.ts'), `
export class AdvancedCalculator {
  private history: number[] = [];

  add(a: number, b: number): number {
    const result = a + b;
    this.history.push(result);
    return result;
  }

  subtract(a: number, b: number): number {
    const result = a - b;
    this.history.push(result);
    return result;
  }

  multiply(a: number, b: number): number {
    const result = a * b;
    this.history.push(result);
    return result;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    const result = a / b;
    this.history.push(result);
    return result;
  }

  getHistory(): number[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}
`);

      // Improve existing file
      fs.writeFileSync(path.join(tempDir, 'main.ts'), `
export function calculateSum(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
}

export class Calculator {
  add(x: number, y: number): number {
    return calculateSum(x, y);
  }

  subtract(x: number, y: number): number {
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    return x - y;
  }
}
`);

      execSync('git add .', { cwd: tempDir });
      execSync('git commit -m "feat(calculator): add advanced calculator with history"', { cwd: tempDir });

      // 5. Compare branches
      const mockBatchProcessor = require('../../src/cli/batch-processor').BatchProcessor;
      mockBatchProcessor.prototype.processFiles = jest.fn()
        .mockResolvedValueOnce({
          // Main branch results
          summary: {
            averageScore: 75,
            totalViolations: 3,
            violationsBySeverity: { critical: 0, high: 1, medium: 2, low: 0 }
          },
          reports: [
            {
              filePath: 'main.ts',
              functions: [
                { complexity: { cyclomatic: 2 } },
                { complexity: { cyclomatic: 1 } }
              ]
            }
          ]
        })
        .mockResolvedValueOnce({
          // Feature branch results
          summary: {
            averageScore: 85,
            totalViolations: 1,
            violationsBySeverity: { critical: 0, high: 0, medium: 1, low: 0 }
          },
          reports: [
            {
              filePath: 'main.ts',
              functions: [
                { complexity: { cyclomatic: 2 } },
                { complexity: { cyclomatic: 2 } }
              ]
            },
            {
              filePath: 'advanced-calculator.ts',
              functions: [
                { complexity: { cyclomatic: 1 } },
                { complexity: { cyclomatic: 1 } },
                { complexity: { cyclomatic: 1 } },
                { complexity: { cyclomatic: 2 } },
                { complexity: { cyclomatic: 1 } },
                { complexity: { cyclomatic: 1 } }
              ]
            }
          ]
        });

      const comparator = new BranchComparator(gitService, config);
      const comparison = await comparator.compareBranches('main', 'feature/improved-calculator');

      expect(comparison.improvement.isImprovement).toBe(true);
      expect(comparison.improvement.scoreChange).toBeGreaterThan(0);
      expect(comparison.changedFiles).toContain('advanced-calculator.ts');
      expect(comparison.changedFiles).toContain('main.ts');

      // 6. Generate PR report
      const reporter = new PRReporter(comparator);
      const prReport = await reporter.generateReport(
        'main',
        'feature/improved-calculator',
        'Add advanced calculator with history tracking',
        '42'
      );

      expect(prReport.approvalStatus).toBe('approved');
      expect(prReport.summary.overallAssessment).toBe('good');
      expect(prReport.prNumber).toBe('42');
      expect(prReport.title).toBe('Add advanced calculator with history tracking');

      // 7. Generate different report formats
      const githubReport = reporter.formatForGitHub(prReport);
      expect(githubReport).toContain('## 🔍 Code Quality Report');
      expect(githubReport).toContain('✅ **Status**: Approved');

      const jsonReport = reporter.formatAsJSON(prReport);
      const parsedJson = JSON.parse(jsonReport);
      expect(parsedJson.approvalStatus).toBe('approved');

      const textReport = reporter.formatAsText(prReport);
      expect(textReport).toContain('CODE QUALITY REPORT');
      expect(textReport).toContain('Status: APPROVED');

      // 8. Test quality gates
      const qualityGates = {
        minScoreImprovement: 5,
        maxNewViolations: 2,
        maxCriticalViolations: 0
      };

      const gateResult = comparator.meetsQualityGates(comparison, qualityGates);
      expect(gateResult.passed).toBe(true);

      // 9. Uninstall hooks
      await installer.uninstallHooks();
      const finalHookStatus = installer.getHookStatus();
      expect(finalHookStatus['pre-commit']).toBe(false);
      expect(finalHookStatus['commit-msg']).toBe(false);
    });

    it('should handle workflow with quality issues', async () => {
      // Create initial commit
      fs.writeFileSync(path.join(tempDir, 'good-code.ts'), `
export function simpleFunction(): string {
  return 'hello world';
}
`);
      execSync('git add good-code.ts', { cwd: tempDir });
      execSync('git commit -m "feat: add simple function"', { cwd: tempDir });

      // Create problematic feature branch
      execSync('git checkout -b feature/problematic-code', { cwd: tempDir });
      
      fs.writeFileSync(path.join(tempDir, 'bad-code.ts'), `
export function veryComplexFunction(a, b, c, d, e, f, g) {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          if (e) {
            if (f) {
              if (g) {
                return a + b + c + d + e + f + g;
              } else {
                return a + b + c + d + e + f;
              }
            } else {
              return a + b + c + d + e;
            }
          } else {
            return a + b + c + d;
          }
        } else {
          return a + b + c;
        }
      } else {
        return a + b;
      }
    } else {
      return a;
    }
  } else {
    return 0;
  }
}

export class BadClass {
  public x;
  public y;
  public z;
  
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  method1() { return this.x; }
  method2() { return this.y; }
  method3() { return this.z; }
  method4() { return this.x + this.y; }
  method5() { return this.y + this.z; }
  method6() { return this.x + this.z; }
  method7() { return this.x + this.y + this.z; }
}
`);

      execSync('git add bad-code.ts', { cwd: tempDir });
      execSync('git commit -m "add complex code"', { cwd: tempDir }); // Poor commit message

      // Analyze the poor commit message
      const commitAnalyzer = new CommitMessageAnalyzer();
      const badCommitMessage = gitService.getCommitMessage();
      const badCommitAnalysis = commitAnalyzer.analyzeMessage(badCommitMessage);
      
      expect(badCommitAnalysis.score).toBeLessThan(70);
      expect(badCommitAnalysis.issues.length).toBeGreaterThan(0);

      // Mock poor quality results
      const mockBatchProcessor = require('../../src/cli/batch-processor').BatchProcessor;
      mockBatchProcessor.prototype.processFiles = jest.fn()
        .mockResolvedValueOnce({
          // Main branch results (good)
          summary: {
            averageScore: 85,
            totalViolations: 1,
            violationsBySeverity: { critical: 0, high: 0, medium: 1, low: 0 }
          },
          reports: [
            {
              filePath: 'good-code.ts',
              functions: [{ complexity: { cyclomatic: 1 } }]
            }
          ]
        })
        .mockResolvedValueOnce({
          // Feature branch results (poor)
          summary: {
            averageScore: 45,
            totalViolations: 8,
            violationsBySeverity: { critical: 2, high: 3, medium: 2, low: 1 }
          },
          reports: [
            {
              filePath: 'good-code.ts',
              functions: [{ complexity: { cyclomatic: 1 } }]
            },
            {
              filePath: 'bad-code.ts',
              functions: [
                { complexity: { cyclomatic: 15 } }, // Very complex function
                { complexity: { cyclomatic: 1 } },
                { complexity: { cyclomatic: 1 } },
                { complexity: { cyclomatic: 1 } },
                { complexity: { cyclomatic: 1 } },
                { complexity: { cyclomatic: 1 } },
                { complexity: { cyclomatic: 1 } },
                { complexity: { cyclomatic: 1 } }
              ]
            }
          ]
        });

      const comparator = new BranchComparator(gitService, config);
      const comparison = await comparator.compareBranches('main', 'feature/problematic-code');

      expect(comparison.improvement.isImprovement).toBe(false);
      expect(comparison.improvement.scoreChange).toBeLessThan(0);
      expect(comparison.regressions.length).toBeGreaterThan(0);

      // Generate PR report for problematic code
      const reporter = new PRReporter(comparator);
      const prReport = await reporter.generateReport(
        'main',
        'feature/problematic-code',
        'Add complex functionality'
      );

      expect(prReport.approvalStatus).toBe('blocked');
      expect(prReport.summary.overallAssessment).toBe('poor');
      expect(prReport.summary.riskLevel).toBe('critical');
      expect(prReport.recommendations.some(r => r.includes('Critical'))).toBe(true);

      // Test strict quality gates
      const strictGates = {
        minScoreImprovement: 0,
        maxNewViolations: 2,
        maxCriticalViolations: 0
      };

      const gateResult = comparator.meetsQualityGates(comparison, strictGates);
      expect(gateResult.passed).toBe(false);
      expect(gateResult.checks.some(check => !check.passed)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle non-existent branches gracefully', async () => {
      const comparator = new BranchComparator(gitService, config);
      
      await expect(comparator.compareBranches('non-existent', 'main'))
        .rejects.toThrow('Base branch does not exist');
    });

    it('should handle repositories with no commits', () => {
      expect(() => gitService.getCurrentBranch()).toThrow();
    });

    it('should handle invalid commit messages', () => {
      const analyzer = new CommitMessageAnalyzer();
      const analysis = analyzer.analyzeMessage('');
      
      expect(analysis.score).toBe(0);
      expect(analysis.issues.some(i => i.message.includes('empty'))).toBe(true);
    });
  });

  describe('Configuration handling', () => {
    it('should respect custom analyzer configuration', () => {
      const customAnalyzer = new CommitMessageAnalyzer({
        enforceConventionalCommits: false,
        maxSubjectLength: 100,
        subjectCase: 'any'
      });

      const analysis = customAnalyzer.analyzeMessage('This is a long commit message that would normally fail');
      
      // Should not fail on conventional commit format
      expect(analysis.issues.some(i => i.type === 'format')).toBe(false);
    });

    it('should handle custom hook configuration', async () => {
      const installer = new HookInstaller(gitService);
      
      const customConfig = {
        preCommit: {
          enabled: true,
          minScore: 90,
          maxViolations: 1,
          skipPatterns: ['*.test.ts', '*.spec.ts', '*.d.ts', '*.config.js']
        },
        commitMsg: {
          enabled: true,
          enforceConventional: false,
          minScore: 60,
          maxSubjectLength: 100
        },
        prePush: {
          enabled: true,
          baseBranch: 'develop',
          qualityGates: {
            minScoreImprovement: 5,
            maxNewViolations: 0
          }
        }
      };

      await installer.installHooks(customConfig);
      const loadedConfig = installer.loadHookConfig();

      expect(loadedConfig.preCommit.minScore).toBe(90);
      expect(loadedConfig.commitMsg.enforceConventional).toBe(false);
      expect(loadedConfig.prePush.baseBranch).toBe('develop');
    });
  });
});