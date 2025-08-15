/**
 * Configuration management for CLI
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CleanCodePrinciple, Severity } from '../types';

export interface AnalysisConfig {
  // File patterns to include/exclude
  include: string[];
  exclude: string[];
  
  // Analysis settings
  principles: CleanCodePrinciple[];
  minSeverity: Severity;
  
  // Complexity thresholds
  thresholds: {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    functionLength: number;
    parameterCount: number;
    nestingDepth: number;
  };
  
  // Output settings
  output: {
    format: 'json' | 'csv' | 'html' | 'console';
    file?: string;
    verbose: boolean;
  };
  
  // Parallel processing
  maxConcurrency: number;
}

export const DEFAULT_CONFIG: AnalysisConfig = {
  include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  exclude: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.*', '**/*.spec.*'],
  
  principles: Object.values(CleanCodePrinciple),
  minSeverity: Severity.LOW,
  
  thresholds: {
    cyclomaticComplexity: 10,
    cognitiveComplexity: 15,
    functionLength: 20,
    parameterCount: 3,
    nestingDepth: 4
  },
  
  output: {
    format: 'console',
    verbose: false
  },
  
  maxConcurrency: 4
};

export class ConfigManager {
  /**
   * Load configuration from file
   */
  static loadConfig(configPath?: string): AnalysisConfig {
    if (!configPath) {
      // Look for default config files
      const defaultPaths = [
        '.clean-code.json',
        '.clean-code.yml',
        '.clean-code.yaml',
        'clean-code.config.json',
        'clean-code.config.yml'
      ];
      
      for (const defaultPath of defaultPaths) {
        if (fs.existsSync(defaultPath)) {
          configPath = defaultPath;
          break;
        }
      }
    }
    
    if (!configPath || !fs.existsSync(configPath)) {
      return DEFAULT_CONFIG;
    }
    
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const ext = path.extname(configPath).toLowerCase();
      
      let config: Partial<AnalysisConfig>;
      
      if (ext === '.json') {
        config = JSON.parse(content);
      } else if (ext === '.yml' || ext === '.yaml') {
        config = yaml.load(content) as Partial<AnalysisConfig>;
      } else {
        throw new Error(`Unsupported config file format: ${ext}`);
      }
      
      return this.mergeConfig(DEFAULT_CONFIG, config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load config from ${configPath}: ${errorMessage}`);
    }
  }
  
  /**
   * Merge user config with defaults
   */
  private static mergeConfig(defaults: AnalysisConfig, userConfig: Partial<AnalysisConfig>): AnalysisConfig {
    return {
      ...defaults,
      ...userConfig,
      thresholds: {
        ...defaults.thresholds,
        ...userConfig.thresholds
      },
      output: {
        ...defaults.output,
        ...userConfig.output
      }
    };
  }
  
  /**
   * Save configuration to file
   */
  static saveConfig(config: AnalysisConfig, configPath: string): void {
    try {
      const ext = path.extname(configPath).toLowerCase();
      let content: string;
      
      if (ext === '.json') {
        content = JSON.stringify(config, null, 2);
      } else if (ext === '.yml' || ext === '.yaml') {
        content = yaml.dump(config);
      } else {
        throw new Error(`Unsupported config file format: ${ext}`);
      }
      
      fs.writeFileSync(configPath, content, 'utf8');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save config to ${configPath}: ${errorMessage}`);
    }
  }
  
  /**
   * Validate configuration
   */
  static validateConfig(config: AnalysisConfig): string[] {
    const errors: string[] = [];
    
    if (!config.include || config.include.length === 0) {
      errors.push('Config must specify at least one include pattern');
    }
    
    if (config.thresholds.cyclomaticComplexity < 1) {
      errors.push('Cyclomatic complexity threshold must be >= 1');
    }
    
    if (config.thresholds.functionLength < 1) {
      errors.push('Function length threshold must be >= 1');
    }
    
    if (config.maxConcurrency < 1) {
      errors.push('Max concurrency must be >= 1');
    }
    
    return errors;
  }
}