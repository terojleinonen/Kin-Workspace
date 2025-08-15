/**
 * Basic CLI functionality tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigManager } from '../../src/cli/config';
import { FileDiscovery } from '../../src/cli/file-discovery';
import { BatchProcessor } from '../../src/cli/batch-processor';
import { ProgressIndicator } from '../../src/cli/progress';

describe('CLI Basic Functionality', () => {
  let tempDir: string;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-basic-test-'));
    
    // Create test files
    const testFiles = {
      'src/good.ts': `
export class Calculator {
  add(firstNumber: number, secondNumber: number): number {
    return firstNumber + secondNumber;
  }
}`,
      'src/bad.ts': `
export class x {
  f(a,b,c,d,e,f) {
    return a+b+c+d+e+f;
  }
}`
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
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
  
  describe('Configuration Management', () => {
    it('should create and load configuration files', () => {
      const configPath = path.join(tempDir, 'config.json');
      const config = ConfigManager.loadConfig(); // Load default
      
      // Save config
      ConfigManager.saveConfig(config, configPath);
      expect(fs.existsSync(configPath)).toBe(true);
      
      // Load saved config
      const loadedConfig = ConfigManager.loadConfig(configPath);
      expect(loadedConfig.include).toEqual(config.include);
      expect(loadedConfig.exclude).toEqual(config.exclude);
    });
    
    it('should validate configuration', () => {
      const validConfig = ConfigManager.loadConfig();
      const errors = ConfigManager.validateConfig(validConfig);
      expect(errors).toEqual([]);
      
      const invalidConfig = { ...validConfig, include: [] };
      const invalidErrors = ConfigManager.validateConfig(invalidConfig);
      expect(invalidErrors.length).toBeGreaterThan(0);
    });
  });
  
  describe('File Discovery', () => {
    it('should discover TypeScript files', async () => {
      const files = await FileDiscovery.discoverFiles({
        include: ['**/*.ts'],
        exclude: ['node_modules/**'],
        directories: [tempDir]
      });
      
      expect(files.length).toBe(2);
      expect(files.some(f => f.includes('good.ts'))).toBe(true);
      expect(files.some(f => f.includes('bad.ts'))).toBe(true);
    });
    
    it('should validate directories', () => {
      const errors = FileDiscovery.validateDirectories([tempDir]);
      expect(errors).toEqual([]);
      
      const invalidErrors = FileDiscovery.validateDirectories(['/nonexistent']);
      expect(invalidErrors.length).toBeGreaterThan(0);
    });
  });
  
  describe('Batch Processing', () => {
    it('should process files and generate reports', async () => {
      const config = ConfigManager.loadConfig();
      const progress = new ProgressIndicator({ verbose: false, silent: true });
      const processor = new BatchProcessor(config, progress);
      
      const result = await processor.processBatch([tempDir]);
      
      expect(result.totalFiles).toBe(2);
      expect(result.processedFiles).toBe(2);
      expect(result.failedFiles).toEqual([]);
      expect(result.analysisResults.length).toBe(2);
      expect(result.summary.totalViolations).toBeGreaterThan(0);
    });
    
    it('should handle empty directories', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      fs.mkdirSync(emptyDir);
      
      const config = ConfigManager.loadConfig();
      const progress = new ProgressIndicator({ verbose: false, silent: true });
      const processor = new BatchProcessor(config, progress);
      
      const result = await processor.processBatch([emptyDir]);
      
      expect(result.totalFiles).toBe(0);
      expect(result.processedFiles).toBe(0);
      expect(result.analysisResults).toEqual([]);
    });
  });
  
  describe('Progress Indicator', () => {
    it('should create progress indicators', () => {
      const progress = new ProgressIndicator({ verbose: false, silent: true });
      expect(progress).toBeDefined();
      
      const batchProgress = progress.createProgressBar(10);
      expect(batchProgress).toBeDefined();
    });
    
    it('should handle silent mode', () => {
      const progress = new ProgressIndicator({ verbose: true, silent: true });
      
      // These should not throw in silent mode
      progress.info('test');
      progress.success('test');
      progress.warn('test');
      progress.error('test');
      progress.verbose('test');
    });
  });
});