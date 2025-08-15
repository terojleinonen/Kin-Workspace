/**
 * Tests for configuration management
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigManager, AnalysisConfig, DEFAULT_CONFIG } from '../../src/cli/config';
import { CleanCodePrinciple, Severity } from '../../src/types';

describe('ConfigManager', () => {
  let tempDir: string;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
  });
  
  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
  
  describe('loadConfig', () => {
    it('should return default config when no config file exists', () => {
      const config = ConfigManager.loadConfig('/nonexistent/path');
      expect(config).toEqual(DEFAULT_CONFIG);
    });
    
    it('should load JSON config file', () => {
      const configPath = path.join(tempDir, 'config.json');
      const customConfig = {
        include: ['**/*.ts'],
        exclude: ['test/**'],
        minSeverity: Severity.HIGH,
        thresholds: {
          cyclomaticComplexity: 5
        }
      };
      
      fs.writeFileSync(configPath, JSON.stringify(customConfig, null, 2));
      
      const config = ConfigManager.loadConfig(configPath);
      expect(config.include).toEqual(['**/*.ts']);
      expect(config.exclude).toEqual(['test/**']);
      expect(config.minSeverity).toBe(Severity.HIGH);
      expect(config.thresholds.cyclomaticComplexity).toBe(5);
      // Should merge with defaults
      expect(config.thresholds.functionLength).toBe(DEFAULT_CONFIG.thresholds.functionLength);
    });
    
    it('should load YAML config file', () => {
      const configPath = path.join(tempDir, 'config.yml');
      const yamlContent = `
include:
  - "**/*.ts"
exclude:
  - "test/**"
minSeverity: high
thresholds:
  cyclomaticComplexity: 5
`;
      
      fs.writeFileSync(configPath, yamlContent);
      
      const config = ConfigManager.loadConfig(configPath);
      expect(config.include).toEqual(['**/*.ts']);
      expect(config.exclude).toEqual(['test/**']);
      expect(config.minSeverity).toBe('high');
      expect(config.thresholds.cyclomaticComplexity).toBe(5);
    });
    
    it('should find default config files', () => {
      const configPath = path.join(tempDir, '.clean-code.json');
      const customConfig = { include: ['**/*.custom.ts'] };
      
      fs.writeFileSync(configPath, JSON.stringify(customConfig));
      
      // Change working directory to temp dir
      const originalCwd = process.cwd();
      process.chdir(tempDir);
      
      try {
        const config = ConfigManager.loadConfig();
        expect(config.include).toEqual(['**/*.custom.ts']);
      } finally {
        process.chdir(originalCwd);
      }
    });
    
    it('should throw error for invalid JSON', () => {
      const configPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(configPath, '{ invalid json }');
      
      expect(() => {
        ConfigManager.loadConfig(configPath);
      }).toThrow('Failed to load config');
    });
    
    it('should throw error for unsupported file format', () => {
      const configPath = path.join(tempDir, 'config.txt');
      fs.writeFileSync(configPath, 'some content');
      
      expect(() => {
        ConfigManager.loadConfig(configPath);
      }).toThrow('Unsupported config file format');
    });
  });
  
  describe('saveConfig', () => {
    it('should save JSON config file', () => {
      const configPath = path.join(tempDir, 'output.json');
      const config: AnalysisConfig = {
        ...DEFAULT_CONFIG,
        include: ['**/*.custom.ts']
      };
      
      ConfigManager.saveConfig(config, configPath);
      
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed.include).toEqual(['**/*.custom.ts']);
    });
    
    it('should save YAML config file', () => {
      const configPath = path.join(tempDir, 'output.yml');
      const config: AnalysisConfig = {
        ...DEFAULT_CONFIG,
        include: ['**/*.custom.ts']
      };
      
      ConfigManager.saveConfig(config, configPath);
      
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf8');
      expect(content).toContain('**/*.custom.ts');
    });
    
    it('should throw error for unsupported format', () => {
      const configPath = path.join(tempDir, 'config.txt');
      
      expect(() => {
        ConfigManager.saveConfig(DEFAULT_CONFIG, configPath);
      }).toThrow('Unsupported config file format');
    });
  });
  
  describe('validateConfig', () => {
    it('should return no errors for valid config', () => {
      const errors = ConfigManager.validateConfig(DEFAULT_CONFIG);
      expect(errors).toEqual([]);
    });
    
    it('should return error for empty include patterns', () => {
      const config = { ...DEFAULT_CONFIG, include: [] };
      const errors = ConfigManager.validateConfig(config);
      expect(errors).toContain('Config must specify at least one include pattern');
    });
    
    it('should return error for invalid complexity threshold', () => {
      const config = {
        ...DEFAULT_CONFIG,
        thresholds: { ...DEFAULT_CONFIG.thresholds, cyclomaticComplexity: 0 }
      };
      const errors = ConfigManager.validateConfig(config);
      expect(errors).toContain('Cyclomatic complexity threshold must be >= 1');
    });
    
    it('should return error for invalid function length threshold', () => {
      const config = {
        ...DEFAULT_CONFIG,
        thresholds: { ...DEFAULT_CONFIG.thresholds, functionLength: 0 }
      };
      const errors = ConfigManager.validateConfig(config);
      expect(errors).toContain('Function length threshold must be >= 1');
    });
    
    it('should return error for invalid concurrency', () => {
      const config = { ...DEFAULT_CONFIG, maxConcurrency: 0 };
      const errors = ConfigManager.validateConfig(config);
      expect(errors).toContain('Max concurrency must be >= 1');
    });
  });
});