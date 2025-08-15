/**
 * Main CLI application
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { ConfigManager, AnalysisConfig, DEFAULT_CONFIG } from './config';
import { FileDiscovery } from './file-discovery';
import { ProgressIndicator } from './progress';
import { BatchProcessor } from './batch-processor';
import { createFormatter } from './formatters';
import { VERSION } from '../index';

export class CliApp {
  private program: Command;
  
  constructor() {
    this.program = new Command();
    this.setupCommands();
  }
  
  /**
   * Run the CLI application
   */
  async run(argv: string[]): Promise<void> {
    try {
      await this.program.parseAsync(argv);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), errorMessage);
      process.exit(1);
    }
  }
  
  /**
   * Setup CLI commands
   */
  private setupCommands(): void {
    this.program
      .name('clean-code-analyzer')
      .description('Analyze code quality according to Clean Code principles')
      .version(VERSION);
    
    // Main analyze command
    this.program
      .command('analyze')
      .description('Analyze code quality in specified directories')
      .argument('[directories...]', 'Directories to analyze', ['.'])
      .option('-c, --config <path>', 'Configuration file path')
      .option('-f, --format <format>', 'Output format (console, json, csv, html)', 'console')
      .option('-o, --output <file>', 'Output file path')
      .option('-v, --verbose', 'Verbose output', false)
      .option('-s, --silent', 'Silent mode (no progress indicators)', false)
      .option('--min-severity <severity>', 'Minimum severity level (low, medium, high, critical)', 'low')
      .option('--max-concurrency <number>', 'Maximum concurrent file processing', '4')
      .action(async (directories, options) => {
        await this.handleAnalyze(directories, options);
      });
    
    // Config commands
    const configCmd = this.program
      .command('config')
      .description('Configuration management');
    
    configCmd
      .command('init')
      .description('Initialize configuration file')
      .option('-f, --format <format>', 'Config file format (json, yaml)', 'json')
      .option('-o, --output <file>', 'Config file path', '.clean-code.json')
      .action(async (options) => {
        await this.handleConfigInit(options);
      });
    
    configCmd
      .command('validate')
      .description('Validate configuration file')
      .option('-c, --config <path>', 'Configuration file path')
      .action(async (options) => {
        await this.handleConfigValidate(options);
      });
    
    // Info command
    this.program
      .command('info')
      .description('Show system information')
      .action(() => {
        this.handleInfo();
      });
  }
  
  /**
   * Handle analyze command
   */
  private async handleAnalyze(directories: string[], options: any): Promise<void> {
    const progress = new ProgressIndicator({
      verbose: options.verbose,
      silent: options.silent
    });
    
    try {
      // Validate directories
      const dirErrors = FileDiscovery.validateDirectories(directories);
      if (dirErrors.length > 0) {
        for (const error of dirErrors) {
          progress.error(error);
        }
        process.exit(1);
      }
      
      // Load configuration
      progress.start('Loading configuration...');
      const config = this.loadConfig(options.config, options);
      progress.succeed('Configuration loaded');
      
      // Validate configuration
      const configErrors = ConfigManager.validateConfig(config);
      if (configErrors.length > 0) {
        progress.fail('Configuration validation failed');
        for (const error of configErrors) {
          progress.error(error);
        }
        process.exit(1);
      }
      
      // Run analysis
      const processor = new BatchProcessor(config, progress);
      const result = await processor.processBatch(directories);
      
      // Format and output results
      const formatter = createFormatter(options.format, {
        verbose: options.verbose,
        outputFile: options.output
      });
      
      await formatter.output(result);
      
      // Exit with appropriate code
      const exitCode = result.summary.totalViolations > 0 ? 1 : 0;
      process.exit(exitCode);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      progress.fail(`Analysis failed: ${errorMessage}`);
      process.exit(1);
    }
  }
  
  /**
   * Handle config init command
   */
  private async handleConfigInit(options: any): Promise<void> {
    try {
      const configPath = options.output;
      const format = options.format.toLowerCase();
      
      if (format !== 'json' && format !== 'yaml') {
        throw new Error('Config format must be json or yaml');
      }
      
      const extension = format === 'yaml' ? '.yml' : '.json';
      const finalPath = configPath.endsWith(extension) ? configPath : `${configPath}${extension}`;
      
      ConfigManager.saveConfig(DEFAULT_CONFIG, finalPath);
      
      console.log(chalk.green('✓'), `Configuration file created: ${finalPath}`);
      console.log(chalk.gray('  Edit the file to customize analysis settings'));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), `Failed to create config: ${errorMessage}`);
      process.exit(1);
    }
  }
  
  /**
   * Handle config validate command
   */
  private async handleConfigValidate(options: any): Promise<void> {
    try {
      const config = ConfigManager.loadConfig(options.config);
      const errors = ConfigManager.validateConfig(config);
      
      if (errors.length === 0) {
        console.log(chalk.green('✓'), 'Configuration is valid');
      } else {
        console.log(chalk.red('✗'), 'Configuration validation failed:');
        for (const error of errors) {
          console.log(chalk.red('  -'), error);
        }
        process.exit(1);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), `Config validation failed: ${errorMessage}`);
      process.exit(1);
    }
  }
  
  /**
   * Handle info command
   */
  private handleInfo(): void {
    console.log(chalk.bold.blue('Clean Code Analyzer'));
    console.log(chalk.gray('='.repeat(30)));
    console.log(`Version: ${chalk.cyan(VERSION)}`);
    console.log(`Node.js: ${chalk.cyan(process.version)}`);
    console.log(`Platform: ${chalk.cyan(process.platform)}`);
    console.log(`Architecture: ${chalk.cyan(process.arch)}`);
    console.log(`Working Directory: ${chalk.cyan(process.cwd())}`);
    
    console.log(chalk.bold('\nSupported File Types:'));
    console.log('  - TypeScript (.ts, .tsx)');
    console.log('  - JavaScript (.js, .jsx)');
    
    console.log(chalk.bold('\nOutput Formats:'));
    console.log('  - console (default)');
    console.log('  - json');
    console.log('  - csv');
    console.log('  - html');
  }
  
  /**
   * Load configuration with command line overrides
   */
  private loadConfig(configPath?: string, options: any = {}): AnalysisConfig {
    const config = ConfigManager.loadConfig(configPath);
    
    // Apply command line overrides
    if (options.minSeverity) {
      config.minSeverity = options.minSeverity;
    }
    
    if (options.maxConcurrency) {
      config.maxConcurrency = parseInt(options.maxConcurrency, 10);
    }
    
    if (options.verbose !== undefined) {
      config.output.verbose = options.verbose;
    }
    
    if (options.format) {
      config.output.format = options.format;
    }
    
    if (options.output) {
      config.output.file = options.output;
    }
    
    return config;
  }
}