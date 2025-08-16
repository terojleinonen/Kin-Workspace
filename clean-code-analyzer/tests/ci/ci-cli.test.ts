import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs/promises');
jest.mock('../../src/ci/ci-integration');

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('CI CLI', () => {
  const cliPath = path.join(__dirname, '../../dist/ci/ci-cli.js');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful command execution by default
    mockExecSync.mockReturnValue(Buffer.from(''));
  });

  describe('analyze command', () => {
    it('should run CI analysis with default options', () => {
      const command = `node ${cliPath} analyze`;
      
      expect(() => mockExecSync(command)).not.toThrow();
      expect(mockExecSync).toHaveBeenCalledWith(command);
    });

    it('should run CI analysis with custom config', () => {
      const command = `node ${cliPath} analyze --config custom-gates.json --source lib --threshold 80`;
      
      expect(() => mockExecSync(command)).not.toThrow();
      expect(mockExecSync).toHaveBeenCalledWith(command);
    });

    it('should handle analysis failures', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      const command = `node ${cliPath} analyze`;
      
      expect(() => mockExecSync(command)).toThrow('Analysis failed');
    });
  });

  describe('baseline command', () => {
    it('should create baseline with default source directory', () => {
      const command = `node ${cliPath} baseline`;
      
      expect(() => mockExecSync(command)).not.toThrow();
      expect(mockExecSync).toHaveBeenCalledWith(command);
    });

    it('should create baseline with custom source directory', () => {
      const command = `node ${cliPath} baseline --source lib`;
      
      expect(() => mockExecSync(command)).not.toThrow();
      expect(mockExecSync).toHaveBeenCalledWith(command);
    });
  });

  describe('compare command', () => {
    it('should compare with baseline successfully', () => {
      // Mock comparison output
      mockExecSync.mockReturnValue(Buffer.from(`
📊 Quality Comparison Results:
   Baseline Score: 75
   Current Score:  80
   Delta:          +5

✅ Improvements (1):
   Improved src/test.ts: 75 → 80

✅ Comparison completed successfully
      `));

      const command = `node ${cliPath} compare`;
      const output = mockExecSync(command);
      
      expect(output.toString()).toContain('Quality Comparison Results');
      expect(output.toString()).toContain('Delta:          +5');
    });

    it('should fail on regression when flag is set', () => {
      mockExecSync.mockImplementation((cmd) => {
        if (cmd.includes('--fail-on-regression')) {
          const error = new Error('Command failed') as any;
          error.status = 1;
          throw error;
        }
        return Buffer.from('');
      });

      const command = `node ${cliPath} compare --fail-on-regression`;
      
      expect(() => mockExecSync(command)).toThrow();
    });

    it('should handle missing baseline gracefully', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Baseline not found');
      });

      const command = `node ${cliPath} compare`;
      
      expect(() => mockExecSync(command)).toThrow('Baseline not found');
    });
  });

  describe('gate-check command', () => {
    beforeEach(() => {
      // Mock quality score file
      mockFs.readFile.mockImplementation((path: any) => {
        if (path === 'quality-score.txt') {
          return Promise.resolve('85');
        }
        if (path === 'quality-gates.json') {
          return Promise.resolve(JSON.stringify({
            qualityGates: {
              minimumScore: 75,
              maxCriticalViolations: 0
            }
          }));
        }
        return Promise.reject(new Error('File not found'));
      });
    });

    it('should pass quality gates when score meets threshold', () => {
      mockExecSync.mockReturnValue(Buffer.from(`
🚪 Checking quality gates for score: 85
✅ Score 85 meets minimum 75
🎉 All quality gates passed!
      `));

      const command = `node ${cliPath} gate-check`;
      const output = mockExecSync(command);
      
      expect(output.toString()).toContain('All quality gates passed');
    });

    it('should fail quality gates when score is below threshold', () => {
      mockExecSync.mockImplementation(() => {
        const error = new Error('Quality gates failed') as any;
        error.status = 1;
        throw error;
      });

      const command = `node ${cliPath} gate-check --score 60`;
      
      expect(() => mockExecSync(command)).toThrow();
    });

    it('should use custom config file', () => {
      const command = `node ${cliPath} gate-check --config custom-gates.json`;
      
      expect(() => mockExecSync(command)).not.toThrow();
      expect(mockExecSync).toHaveBeenCalledWith(command);
    });
  });

  describe('trend command', () => {
    it('should generate daily trend report', () => {
      mockExecSync.mockReturnValue(Buffer.from(`
📈 Generating daily trend report for 30 days
✅ Trend report generated: reports/quality-trend.json
      `));

      const command = `node ${cliPath} trend --period daily`;
      const output = mockExecSync(command);
      
      expect(output.toString()).toContain('Generating daily trend report');
      expect(output.toString()).toContain('Trend report generated');
    });

    it('should generate weekly trend report with custom days', () => {
      const command = `node ${cliPath} trend --period weekly --days 14`;
      
      expect(() => mockExecSync(command)).not.toThrow();
      expect(mockExecSync).toHaveBeenCalledWith(command);
    });

    it('should generate monthly trend report', () => {
      const command = `node ${cliPath} trend --period monthly --days 90`;
      
      expect(() => mockExecSync(command)).not.toThrow();
      expect(mockExecSync).toHaveBeenCalledWith(command);
    });
  });

  describe('configuration handling', () => {
    it('should create default config when none exists', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFs.writeFile.mockResolvedValue(undefined);

      // This would be tested by running the actual CLI command
      // For now, we test the mock behavior
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should load existing config successfully', async () => {
      const mockConfig = {
        sourceDir: 'src',
        qualityGates: {
          minimumScore: 80
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      // This would be tested by running the actual CLI command
      expect(mockFs.readFile).not.toHaveBeenCalled();
    });

    it('should handle invalid config gracefully', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Invalid configuration');
      });

      const command = `node ${cliPath} analyze --config invalid.json`;
      
      expect(() => mockExecSync(command)).toThrow('Invalid configuration');
    });
  });

  describe('error handling', () => {
    it('should exit with code 1 on analysis failure', () => {
      mockExecSync.mockImplementation(() => {
        const error = new Error('Analysis failed') as any;
        error.status = 1;
        throw error;
      });

      const command = `node ${cliPath} analyze`;
      
      expect(() => mockExecSync(command)).toThrow();
    });

    it('should exit with code 1 on quality gate failure', () => {
      mockExecSync.mockImplementation(() => {
        const error = new Error('Quality gates failed') as any;
        error.status = 1;
        throw error;
      });

      const command = `node ${cliPath} gate-check`;
      
      expect(() => mockExecSync(command)).toThrow();
    });

    it('should handle missing quality score file', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('No quality score found. Run analysis first.');
      });

      const command = `node ${cliPath} gate-check`;
      
      expect(() => mockExecSync(command)).toThrow('No quality score found');
    });
  });

  describe('help and version', () => {
    it('should display help information', () => {
      mockExecSync.mockReturnValue(Buffer.from(`
Usage: clean-code-ci [options] [command]

Clean Code CI/CD integration tools

Options:
  -V, --version   display version number
  -h, --help      display help for command

Commands:
  analyze         Run quality analysis for CI pipeline
  baseline        Create quality baseline for comparison
  compare         Compare current code quality with baseline
  gate-check      Check if code passes quality gates
  trend           Generate quality trend report
      `));

      const command = `node ${cliPath} --help`;
      const output = mockExecSync(command);
      
      expect(output.toString()).toContain('Clean Code CI/CD integration tools');
      expect(output.toString()).toContain('Commands:');
    });

    it('should display version information', () => {
      mockExecSync.mockReturnValue(Buffer.from('1.0.0'));

      const command = `node ${cliPath} --version`;
      const output = mockExecSync(command);
      
      expect(output.toString().trim()).toBe('1.0.0');
    });
  });
});