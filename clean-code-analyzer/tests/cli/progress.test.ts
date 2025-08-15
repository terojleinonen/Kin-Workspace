/**
 * Tests for progress indicators
 */

import { ProgressIndicator, BatchProgress } from '../../src/cli/progress';

// Mock ora to avoid actual spinner output during tests
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    text: ''
  }));
});

// Mock console methods
const originalConsoleLog = console.log;
const originalStdoutWrite = process.stdout.write;

describe('ProgressIndicator', () => {
  let consoleLogs: string[];
  let stdoutWrites: string[];
  
  beforeEach(() => {
    consoleLogs = [];
    stdoutWrites = [];
    
    console.log = jest.fn((...args) => {
      consoleLogs.push(args.join(' '));
    });
    
    process.stdout.write = jest.fn((data) => {
      stdoutWrites.push(data.toString());
      return true;
    });
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
    process.stdout.write = originalStdoutWrite;
  });
  
  describe('constructor', () => {
    it('should create with default options', () => {
      const progress = new ProgressIndicator();
      expect(progress).toBeDefined();
    });
    
    it('should create with custom options', () => {
      const progress = new ProgressIndicator({ verbose: true, silent: false });
      expect(progress).toBeDefined();
    });
  });
  
  describe('logging methods', () => {
    it('should log info messages', () => {
      const progress = new ProgressIndicator({ verbose: false, silent: false });
      progress.info('Test info message');
      
      expect(consoleLogs).toHaveLength(1);
      expect(consoleLogs[0]).toContain('Test info message');
    });
    
    it('should log success messages', () => {
      const progress = new ProgressIndicator({ verbose: false, silent: false });
      progress.success('Test success message');
      
      expect(consoleLogs).toHaveLength(1);
      expect(consoleLogs[0]).toContain('Test success message');
    });
    
    it('should log warning messages', () => {
      const progress = new ProgressIndicator({ verbose: false, silent: false });
      progress.warn('Test warning message');
      
      expect(consoleLogs).toHaveLength(1);
      expect(consoleLogs[0]).toContain('Test warning message');
    });
    
    it('should log error messages', () => {
      const progress = new ProgressIndicator({ verbose: false, silent: false });
      progress.error('Test error message');
      
      expect(consoleLogs).toHaveLength(1);
      expect(consoleLogs[0]).toContain('Test error message');
    });
    
    it('should log verbose messages when verbose is enabled', () => {
      const progress = new ProgressIndicator({ verbose: true, silent: false });
      progress.verbose('Test verbose message');
      
      expect(consoleLogs).toHaveLength(1);
      expect(consoleLogs[0]).toContain('Test verbose message');
    });
    
    it('should not log verbose messages when verbose is disabled', () => {
      const progress = new ProgressIndicator({ verbose: false, silent: false });
      progress.verbose('Test verbose message');
      
      expect(consoleLogs).toHaveLength(0);
    });
    
    it('should not log anything in silent mode', () => {
      const progress = new ProgressIndicator({ verbose: true, silent: true });
      progress.info('Test info');
      progress.success('Test success');
      progress.warn('Test warning');
      progress.error('Test error');
      progress.verbose('Test verbose');
      
      expect(consoleLogs).toHaveLength(0);
    });
  });
  
  describe('createProgressBar', () => {
    it('should create a BatchProgress instance', () => {
      const progress = new ProgressIndicator();
      const batchProgress = progress.createProgressBar(10);
      
      expect(batchProgress).toBeInstanceOf(BatchProgress);
    });
  });
});

describe('BatchProgress', () => {
  let stdoutWrites: string[];
  
  beforeEach(() => {
    stdoutWrites = [];
    
    process.stdout.write = jest.fn((data) => {
      stdoutWrites.push(data.toString());
      return true;
    });
  });
  
  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
  });
  
  describe('update', () => {
    it('should update progress with percentage', () => {
      const batchProgress = new BatchProgress(10, { verbose: false, silent: false });
      batchProgress.update(5, 'Processing files');
      
      expect(stdoutWrites).toHaveLength(1);
      expect(stdoutWrites[0]).toContain('Processing files');
      expect(stdoutWrites[0]).toContain('5/10');
      expect(stdoutWrites[0]).toContain('(50%)');
    });
    
    it('should not update in silent mode', () => {
      const batchProgress = new BatchProgress(10, { verbose: false, silent: true });
      batchProgress.update(5, 'Processing files');
      
      expect(stdoutWrites).toHaveLength(0);
    });
    
    it('should handle zero progress', () => {
      const batchProgress = new BatchProgress(10, { verbose: false, silent: false });
      batchProgress.update(0, 'Starting');
      
      expect(stdoutWrites).toHaveLength(1);
      expect(stdoutWrites[0]).toContain('0/10');
      expect(stdoutWrites[0]).toContain('(0%)');
    });
    
    it('should handle complete progress', () => {
      const batchProgress = new BatchProgress(10, { verbose: false, silent: false });
      batchProgress.update(10, 'Complete');
      
      expect(stdoutWrites).toHaveLength(1);
      expect(stdoutWrites[0]).toContain('10/10');
      expect(stdoutWrites[0]).toContain('(100%)');
    });
  });
  
  describe('complete', () => {
    it('should show completion message', () => {
      const batchProgress = new BatchProgress(10, { verbose: false, silent: false });
      batchProgress.complete('All done');
      
      expect(stdoutWrites).toHaveLength(1);
      expect(stdoutWrites[0]).toContain('All done');
    });
    
    it('should not show completion in silent mode', () => {
      const batchProgress = new BatchProgress(10, { verbose: false, silent: true });
      batchProgress.complete('All done');
      
      expect(stdoutWrites).toHaveLength(0);
    });
    
    it('should use default message when none provided', () => {
      const batchProgress = new BatchProgress(10, { verbose: false, silent: false });
      batchProgress.complete();
      
      expect(stdoutWrites).toHaveLength(1);
      expect(stdoutWrites[0]).toContain('Processing complete');
    });
  });
});