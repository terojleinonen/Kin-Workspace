/**
 * Integration tests for CLI functionality
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CliApp } from '../../src/cli/cli-app';

describe('CLI Integration', () => {
  let tempDir: string;
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let originalProcessExit: typeof process.exit;
  let consoleLogs: string[];
  let consoleErrors: string[];
  let exitCode: number | undefined;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-integration-test-'));
    
    // Mock console methods
    consoleLogs = [];
    consoleErrors = [];
    exitCode = undefined;
    
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalProcessExit = process.exit;
    
    console.log = jest.fn((...args) => {
      consoleLogs.push(args.join(' '));
    });
    
    console.error = jest.fn((...args) => {
      consoleErrors.push(args.join(' '));
    });
    
    process.exit = jest.fn((code?: number) => {
      exitCode = code;
      throw new Error(`Process exit called with code ${code}`);
    }) as any;
    
    // Create test files
    const testFiles = {
      'src/good.ts': `
export class Calculator {
  add(firstNumber: number, secondNumber: number): number {
    return firstNumber + secondNumber;
  }
  
  multiply(firstNumber: number, secondNumber: number): number {
    return firstNumber * secondNumber;
  }
}`,
      'src/bad.ts': `
export class x {
  f(a,b,c,d,e,f) {
    if (a) {
      if (b) {
        if (c) {
          if (d) {
            if (e) {
              if (f) {
                return a+b+c+d+e+f;
              }
            }
          }
        }
      }
    }
    return 0;
  }
}`,
      '.clean-code.json': JSON.stringify({
        include: ['**/*.ts'],
        exclude: ['node_modules/**'],
        minSeverity: 'low',
        thresholds: {
          cyclomaticComplexity: 5,
          functionLength: 10
        }
      }, null, 2)
    };
    
    for (const [filePath, content] of Object.entries(testFiles)) {
      const fullPath = path.join(tempDir, filePath);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content);
    }
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
    
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
  
  describe('analyze command', () => {
    it('should analyze files and show results', async () => {
      const app = new CliApp();
      const originalCwd = process.cwd();
      
      try {
        process.chdir(tempDir);
        
        await expect(
          app.run(['node', 'cli.js', 'analyze', '--format', 'console'])
        ).rejects.toThrow('Process exit called');
        
        const output = consoleLogs.join('\n');
        expect(output).toContain('Clean Code Analysis Report');
        expect(output).toContain('Files analyzed:');
        
      } finally {
        process.chdir(originalCwd);
      }
    });
    
    it('should handle custom config file', async () => {
      const configPath = path.join(tempDir, 'custom-config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        include: ['**/*.ts'],
        exclude: [],
        minSeverity: 'high'
      }));
      
      const app = new CliApp();
      
      await expect(
        app.run(['node', 'cli.js', 'analyze', tempDir, '--config', configPath])
      ).rejects.toThrow('Process exit called');
      
      // Should complete without errors (config loading)
      expect(consoleErrors).toHaveLength(0);
    });
    
    it('should output to file when specified', async () => {
      const outputFile = path.join(tempDir, 'report.json');
      const app = new CliApp();
      
      await expect(
        app.run(['node', 'cli.js', 'analyze', tempDir, '--format', 'json', '--output', outputFile])
      ).rejects.toThrow('Process exit called');
      
      expect(fs.existsSync(outputFile)).toBe(true);
      const content = fs.readFileSync(outputFile, 'utf8');
      const report = JSON.parse(content);
      expect(report).toHaveProperty('totalFiles');
      expect(report).toHaveProperty('summary');
    });
    
    it('should handle verbose mode', async () => {
      const app = new CliApp();
      
      await expect(
        app.run(['node', 'cli.js', 'analyze', tempDir, '--verbose'])
      ).rejects.toThrow('Process exit called');
      
      const output = consoleLogs.join('\n');
      expect(output).toContain('Detailed Results:');
    });
    
    it('should handle invalid directory', async () => {
      const app = new CliApp();
      const invalidDir = path.join(tempDir, 'nonexistent');
      
      await expect(
        app.run(['node', 'cli.js', 'analyze', invalidDir])
      ).rejects.toThrow('Process exit called');
      
      expect(exitCode).toBe(1);
      expect(consoleErrors.length).toBeGreaterThan(0);
    });
    
    it('should handle invalid config file', async () => {
      const invalidConfig = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(invalidConfig, '{ invalid json }');
      
      const app = new CliApp();
      
      await expect(
        app.run(['node', 'cli.js', 'analyze', tempDir, '--config', invalidConfig])
      ).rejects.toThrow('Process exit called');
      
      expect(exitCode).toBe(1);
      expect(consoleErrors.some(err => err.includes('Failed to load config'))).toBe(true);
    });
  });
  
  describe('config commands', () => {
    it('should initialize config file', async () => {
      const app = new CliApp();
      const configPath = path.join(tempDir, 'new-config.json');
      
      await app.run(['node', 'cli.js', 'config', 'init', '--output', configPath]);
      
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      expect(config).toHaveProperty('include');
      expect(config).toHaveProperty('exclude');
      expect(config).toHaveProperty('thresholds');
      
      expect(consoleLogs.some(log => log.includes('Configuration file created'))).toBe(true);
    });
    
    it('should initialize YAML config file', async () => {
      const app = new CliApp();
      const configPath = path.join(tempDir, 'new-config.yml');
      
      await app.run(['node', 'cli.js', 'config', 'init', '--format', 'yaml', '--output', configPath]);
      
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf8');
      expect(content).toContain('include:');
      expect(content).toContain('exclude:');
    });
    
    it('should validate valid config file', async () => {
      const app = new CliApp();
      const configPath = path.join(tempDir, '.clean-code.json');
      
      await app.run(['node', 'cli.js', 'config', 'validate', '--config', configPath]);
      
      expect(consoleLogs.some(log => log.includes('Configuration is valid'))).toBe(true);
    });
    
    it('should detect invalid config file', async () => {
      const invalidConfig = path.join(tempDir, 'invalid-config.json');
      fs.writeFileSync(invalidConfig, JSON.stringify({
        include: [], // Invalid: empty include
        thresholds: {
          cyclomaticComplexity: 0 // Invalid: must be >= 1
        }
      }));
      
      const app = new CliApp();
      
      await expect(
        app.run(['node', 'cli.js', 'config', 'validate', '--config', invalidConfig])
      ).rejects.toThrow('Process exit called');
      
      expect(exitCode).toBe(1);
      expect(consoleLogs.some(log => log.includes('Configuration validation failed'))).toBe(true);
    });
  });
  
  describe('info command', () => {
    it('should show system information', async () => {
      const app = new CliApp();
      
      await app.run(['node', 'cli.js', 'info']);
      
      const output = consoleLogs.join('\n');
      expect(output).toContain('Clean Code Analyzer');
      expect(output).toContain('Version:');
      expect(output).toContain('Node.js:');
      expect(output).toContain('Platform:');
      expect(output).toContain('Supported File Types:');
      expect(output).toContain('Output Formats:');
    });
  });
  
  describe('help and version', () => {
    it('should show help', async () => {
      const app = new CliApp();
      
      await app.run(['node', 'cli.js', '--help']);
      
      const output = consoleLogs.join('\n');
      expect(output).toContain('clean-code-analyzer');
      expect(output).toContain('analyze');
      expect(output).toContain('config');
    });
    
    it('should show version', async () => {
      const app = new CliApp();
      
      await app.run(['node', 'cli.js', '--version']);
      
      const output = consoleLogs.join('\n');
      expect(output).toMatch(/\d+\.\d+\.\d+/); // Version pattern
    });
  });
});