/**
 * Tests for output formatters
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { 
  ConsoleFormatter, 
  JsonFormatter, 
  CsvFormatter, 
  HtmlFormatter,
  createFormatter 
} from '../../src/cli/formatters';
import { BatchResult } from '../../src/cli/batch-processor';
import { Severity, CleanCodePrinciple } from '../../src/types';

describe('Formatters', () => {
  let tempDir: string;
  let mockResult: BatchResult;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'formatter-test-'));
    
    mockResult = {
      totalFiles: 5,
      processedFiles: 4,
      failedFiles: ['failed.ts'],
      analysisResults: [
        {
          filePath: 'src/good.ts',
          success: true,
          metrics: { overallScore: 85 },
          violations: []
        },
        {
          filePath: 'src/bad.ts',
          success: true,
          metrics: { overallScore: 45 },
          violations: [
            {
              id: 'v1',
              principle: CleanCodePrinciple.NAMING,
              severity: Severity.HIGH,
              location: { filePath: 'src/bad.ts', line: 10, column: 5 },
              description: 'Variable name is unclear',
              suggestion: 'Use descriptive variable names'
            },
            {
              id: 'v2',
              principle: CleanCodePrinciple.FUNCTIONS,
              severity: Severity.MEDIUM,
              location: { filePath: 'src/bad.ts', line: 20, column: 1 },
              description: 'Function is too long',
              suggestion: 'Break function into smaller parts'
            }
          ]
        },
        {
          filePath: 'src/medium.ts',
          success: true,
          metrics: { overallScore: 70 },
          violations: [
            {
              id: 'v3',
              principle: CleanCodePrinciple.COMMENTS,
              severity: Severity.LOW,
              location: { filePath: 'src/medium.ts', line: 5, column: 1 },
              description: 'Unnecessary comment',
              suggestion: 'Remove obvious comments'
            }
          ]
        },
        {
          filePath: 'failed.ts',
          success: false,
          error: 'Parse error'
        }
      ],
      summary: {
        totalViolations: 3,
        violationsBySeverity: {
          [Severity.HIGH]: 1,
          [Severity.MEDIUM]: 1,
          [Severity.LOW]: 1
        },
        violationsByPrinciple: {
          [CleanCodePrinciple.NAMING]: 1,
          [CleanCodePrinciple.FUNCTIONS]: 1,
          [CleanCodePrinciple.COMMENTS]: 1
        },
        averageQualityScore: 66.7,
        filesWithIssues: 2
      }
    };
  });
  
  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
  
  describe('ConsoleFormatter', () => {
    it('should format basic console output', () => {
      const formatter = new ConsoleFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      expect(output).toContain('Clean Code Analysis Report');
      expect(output).toContain('Files analyzed: 4 / 5');
      expect(output).toContain('Files with issues: 2');
      expect(output).toContain('Total violations: 3');
      expect(output).toContain('Average quality score: 66.7');
    });
    
    it('should include failed files section', () => {
      const formatter = new ConsoleFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      expect(output).toContain('Failed Files:');
      expect(output).toContain('failed.ts');
    });
    
    it('should include violations by severity', () => {
      const formatter = new ConsoleFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      expect(output).toContain('Violations by Severity:');
      expect(output).toContain('HIGH: 1');
      expect(output).toContain('MEDIUM: 1');
      expect(output).toContain('LOW: 1');
    });
    
    it('should include violations by principle', () => {
      const formatter = new ConsoleFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      expect(output).toContain('Violations by Principle:');
      expect(output).toContain('naming: 1');
      expect(output).toContain('functions: 1');
      expect(output).toContain('comments: 1');
    });
    
    it('should include detailed results in verbose mode', () => {
      const formatter = new ConsoleFormatter({ verbose: true });
      const output = formatter.format(mockResult);
      
      expect(output).toContain('Detailed Results:');
      expect(output).toContain('bad.ts');
      expect(output).toContain('Variable name is unclear');
      expect(output).toContain('Function is too long');
    });
    
    it('should not include detailed results in non-verbose mode', () => {
      const formatter = new ConsoleFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      expect(output).not.toContain('Detailed Results:');
    });
    
    it('should handle empty results', () => {
      const emptyResult: BatchResult = {
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
      
      const formatter = new ConsoleFormatter({ verbose: false });
      const output = formatter.format(emptyResult);
      
      expect(output).toContain('Files analyzed: 0 / 0');
      expect(output).toContain('Total violations: 0');
    });
  });
  
  describe('JsonFormatter', () => {
    it('should format as valid JSON', () => {
      const formatter = new JsonFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      expect(() => JSON.parse(output)).not.toThrow();
      
      const parsed = JSON.parse(output);
      expect(parsed.totalFiles).toBe(5);
      expect(parsed.processedFiles).toBe(4);
      expect(parsed.summary.totalViolations).toBe(3);
    });
    
    it('should include all result data', () => {
      const formatter = new JsonFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      const parsed = JSON.parse(output);
      
      expect(parsed).toHaveProperty('totalFiles');
      expect(parsed).toHaveProperty('processedFiles');
      expect(parsed).toHaveProperty('failedFiles');
      expect(parsed).toHaveProperty('analysisResults');
      expect(parsed).toHaveProperty('summary');
    });
  });
  
  describe('CsvFormatter', () => {
    it('should format as CSV with headers', () => {
      const formatter = new CsvFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      const lines = output.split('\n');
      expect(lines[0]).toBe('File,Success,Violations,Quality Score,Error');
    });
    
    it('should include data rows', () => {
      const formatter = new CsvFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      const lines = output.split('\n');
      expect(lines).toHaveLength(5); // Header + 4 data rows
      
      expect(lines[1]).toContain('src/good.ts,true,0,85.00,');
      expect(lines[2]).toContain('src/bad.ts,true,2,45.00,');
      expect(lines[4]).toContain('failed.ts,false,0,0.00,Parse error');
    });
    
    it('should escape commas in error messages', () => {
      const resultWithCommaError = {
        ...mockResult,
        analysisResults: [
          {
            filePath: 'error.ts',
            success: false,
            error: 'Parse error, line 5, column 10'
          }
        ]
      };
      
      const formatter = new CsvFormatter({ verbose: false });
      const output = formatter.format(resultWithCommaError);
      
      expect(output).toContain('Parse error; line 5; column 10');
    });
  });
  
  describe('HtmlFormatter', () => {
    it('should format as valid HTML', () => {
      const formatter = new HtmlFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      expect(output).toContain('<!DOCTYPE html>');
      expect(output).toContain('<html lang="en">');
      expect(output).toContain('</html>');
      expect(output).toContain('<title>Clean Code Analysis Report</title>');
    });
    
    it('should include summary section', () => {
      const formatter = new HtmlFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      expect(output).toContain('Summary');
      expect(output).toContain('Files analyzed: 4 / 5');
      expect(output).toContain('Total violations: 3');
    });
    
    it('should include violations tables', () => {
      const formatter = new HtmlFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      expect(output).toContain('Violations by Severity');
      expect(output).toContain('Violations by Principle');
      expect(output).toContain('<table>');
      expect(output).toContain('HIGH');
      expect(output).toContain('naming');
    });
    
    it('should include file results table', () => {
      const formatter = new HtmlFormatter({ verbose: false });
      const output = formatter.format(mockResult);
      
      expect(output).toContain('File Results');
      expect(output).toContain('src/good.ts');
      expect(output).toContain('85.0');
    });
    
    it('should handle empty violations', () => {
      const emptyResult: BatchResult = {
        ...mockResult,
        summary: {
          ...mockResult.summary,
          totalViolations: 0,
          violationsBySeverity: {},
          violationsByPrinciple: {}
        }
      };
      
      const formatter = new HtmlFormatter({ verbose: false });
      const output = formatter.format(emptyResult);
      
      expect(output).toContain('Summary');
      expect(output).not.toContain('Violations by Severity');
    });
  });
  
  describe('createFormatter', () => {
    it('should create ConsoleFormatter for console format', () => {
      const formatter = createFormatter('console', { verbose: false });
      expect(formatter).toBeInstanceOf(ConsoleFormatter);
    });
    
    it('should create JsonFormatter for json format', () => {
      const formatter = createFormatter('json', { verbose: false });
      expect(formatter).toBeInstanceOf(JsonFormatter);
    });
    
    it('should create CsvFormatter for csv format', () => {
      const formatter = createFormatter('csv', { verbose: false });
      expect(formatter).toBeInstanceOf(CsvFormatter);
    });
    
    it('should create HtmlFormatter for html format', () => {
      const formatter = createFormatter('html', { verbose: false });
      expect(formatter).toBeInstanceOf(HtmlFormatter);
    });
    
    it('should default to ConsoleFormatter for unknown format', () => {
      const formatter = createFormatter('unknown', { verbose: false });
      expect(formatter).toBeInstanceOf(ConsoleFormatter);
    });
    
    it('should be case insensitive', () => {
      const formatter = createFormatter('JSON', { verbose: false });
      expect(formatter).toBeInstanceOf(JsonFormatter);
    });
  });
  
  describe('output method', () => {
    it('should write to file when outputFile is specified', async () => {
      const outputFile = path.join(tempDir, 'output.json');
      const formatter = new JsonFormatter({ verbose: false, outputFile });
      
      // Mock console.log to capture the success message
      const consoleLogs: string[] = [];
      const originalConsoleLog = console.log;
      console.log = jest.fn((...args) => {
        consoleLogs.push(args.join(' '));
      });
      
      try {
        await formatter.output(mockResult);
        
        expect(fs.existsSync(outputFile)).toBe(true);
        const content = fs.readFileSync(outputFile, 'utf8');
        const parsed = JSON.parse(content);
        expect(parsed.totalFiles).toBe(5);
        
        expect(consoleLogs).toContain(`Report saved to: ${outputFile}`);
      } finally {
        console.log = originalConsoleLog;
      }
    });
    
    it('should write to console when no outputFile is specified', async () => {
      const formatter = new ConsoleFormatter({ verbose: false });
      
      // Mock console.log to capture output
      const consoleLogs: string[] = [];
      const originalConsoleLog = console.log;
      console.log = jest.fn((...args) => {
        consoleLogs.push(args.join(' '));
      });
      
      try {
        await formatter.output(mockResult);
        
        expect(consoleLogs.length).toBeGreaterThan(0);
        const fullOutput = consoleLogs.join('\n');
        expect(fullOutput).toContain('Clean Code Analysis Report');
      } finally {
        console.log = originalConsoleLog;
      }
    });
  });
});