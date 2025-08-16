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
import { GitService, HookInstaller, BranchComparator, CommitMessageAnalyzer, PRReporter, HookConfig } from '../git';

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
    
    // Git commands
    const gitCmd = this.program
      .command('git')
      .description('Git integration commands');

    gitCmd
      .command('install-hooks')
      .description('Install Git hooks for quality checks')
      .option('--pre-commit', 'Install pre-commit hook', true)
      .option('--commit-msg', 'Install commit-msg hook', true)
      .option('--pre-push', 'Install pre-push hook', false)
      .option('--config <path>', 'Hook configuration file')
      .action(async (options) => {
        await this.handleInstallHooks(options);
      });

    gitCmd
      .command('uninstall-hooks')
      .description('Uninstall Git hooks')
      .action(async () => {
        await this.handleUninstallHooks();
      });

    gitCmd
      .command('hook-status')
      .description('Show Git hook installation status')
      .action(async () => {
        await this.handleHookStatus();
      });

    gitCmd
      .command('check-commit')
      .description('Check commit message quality')
      .argument('[message]', 'Commit message to check (reads from stdin if not provided)')
      .option('--conventional', 'Enforce conventional commit format', true)
      .option('--max-length <number>', 'Maximum subject length', '50')
      .action(async (message, options) => {
        await this.handleCheckCommit(message, options);
      });

    gitCmd
      .command('compare-branches')
      .description('Compare code quality between branches')
      .argument('<base>', 'Base branch name')
      .argument('[target]', 'Target branch name (default: current branch)')
      .option('-f, --format <format>', 'Output format (console, json, markdown)', 'console')
      .option('-o, --output <file>', 'Output file path')
      .action(async (base, target, options) => {
        await this.handleCompareBranches(base, target, options);
      });

    gitCmd
      .command('pr-report')
      .description('Generate pull request quality report')
      .argument('<base>', 'Base branch name')
      .argument('[head]', 'Head branch name (default: current branch)')
      .option('--title <title>', 'Pull request title')
      .option('--number <number>', 'Pull request number')
      .option('-f, --format <format>', 'Output format (github, gitlab, json, text)', 'github')
      .option('-o, --output <file>', 'Output file path')
      .action(async (base, head, options) => {
        await this.handlePRReport(base, head, options);
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
   * Handle install hooks command
   */
  private async handleInstallHooks(options: any): Promise<void> {
    try {
      const gitService = new GitService();
      const installer = new HookInstaller(gitService);
      
      const config = {
        preCommit: { enabled: options.preCommit },
        commitMsg: { enabled: options.commitMsg },
        prePush: { enabled: options.prePush }
      } as Partial<HookConfig>;
      
      await installer.installHooks(config);
      console.log(chalk.green('✅ Git hooks installed successfully'));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), `Failed to install hooks: ${errorMessage}`);
      process.exit(1);
    }
  }

  /**
   * Handle uninstall hooks command
   */
  private async handleUninstallHooks(): Promise<void> {
    try {
      const gitService = new GitService();
      const installer = new HookInstaller(gitService);
      
      await installer.uninstallHooks();
      console.log(chalk.green('✅ Git hooks uninstalled successfully'));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), `Failed to uninstall hooks: ${errorMessage}`);
      process.exit(1);
    }
  }

  /**
   * Handle hook status command
   */
  private async handleHookStatus(): Promise<void> {
    try {
      const gitService = new GitService();
      const installer = new HookInstaller(gitService);
      
      const status = installer.getHookStatus();
      
      console.log(chalk.bold('Git Hook Status:'));
      console.log(chalk.gray('='.repeat(20)));
      
      Object.entries(status).forEach(([hook, installed]) => {
        const icon = installed ? chalk.green('✅') : chalk.red('❌');
        const statusText = installed ? 'Installed' : 'Not installed';
        console.log(`${icon} ${hook}: ${statusText}`);
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), `Failed to check hook status: ${errorMessage}`);
      process.exit(1);
    }
  }

  /**
   * Handle check commit command
   */
  private async handleCheckCommit(message: string | undefined, options: any): Promise<void> {
    try {
      let commitMessage = message;
      
      // Read from stdin if no message provided
      if (!commitMessage) {
        const stdin = process.stdin;
        stdin.setEncoding('utf8');
        
        let data = '';
        for await (const chunk of stdin) {
          data += chunk;
        }
        commitMessage = data.trim();
      }
      
      if (!commitMessage) {
        console.error(chalk.red('Error:'), 'No commit message provided');
        process.exit(1);
      }
      
      const analyzer = new CommitMessageAnalyzer({
        enforceConventionalCommits: options.conventional,
        maxSubjectLength: parseInt(options.maxLength, 10)
      });
      
      const analysis = analyzer.analyzeMessage(commitMessage);
      
      console.log(chalk.bold('Commit Message Analysis:'));
      console.log(chalk.gray('='.repeat(30)));
      console.log(`Score: ${chalk.cyan(analysis.score)}/100`);
      
      if (analysis.type) {
        console.log(`Type: ${chalk.cyan(analysis.type)}`);
      }
      if (analysis.scope) {
        console.log(`Scope: ${chalk.cyan(analysis.scope)}`);
      }
      
      if (analysis.issues.length > 0) {
        console.log(chalk.bold('\nIssues:'));
        analysis.issues.forEach(issue => {
          const icon = issue.severity === 'error' ? chalk.red('❌') : 
                      issue.severity === 'warning' ? chalk.yellow('⚠️') : chalk.blue('ℹ️');
          console.log(`${icon} ${issue.message}`);
        });
      }
      
      if (analysis.suggestions.length > 0) {
        console.log(chalk.bold('\nSuggestions:'));
        analysis.suggestions.forEach(suggestion => {
          console.log(`${chalk.blue('💡')} ${suggestion}`);
        });
      }
      
      if (analysis.score < 80) {
        process.exit(1);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), `Failed to analyze commit message: ${errorMessage}`);
      process.exit(1);
    }
  }

  /**
   * Handle compare branches command
   */
  private async handleCompareBranches(base: string, target: string | undefined, options: any): Promise<void> {
    try {
      const gitService = new GitService();
      const config = this.loadConfig();
      const comparator = new BranchComparator(gitService, config);
      
      const targetBranch = target || gitService.getCurrentBranch();
      
      console.log(chalk.blue('🔍'), `Comparing ${chalk.cyan(targetBranch)} with ${chalk.cyan(base)}...`);
      
      const comparison = await comparator.compareBranches(base, targetBranch);
      
      if (options.format === 'json') {
        const output = JSON.stringify(comparison, null, 2);
        if (options.output) {
          require('fs').writeFileSync(options.output, output);
          console.log(chalk.green('✅'), `Report saved to ${options.output}`);
        } else {
          console.log(output);
        }
      } else if (options.format === 'markdown') {
        const report = comparator.generateComparisonReport(comparison);
        if (options.output) {
          require('fs').writeFileSync(options.output, report);
          console.log(chalk.green('✅'), `Report saved to ${options.output}`);
        } else {
          console.log(report);
        }
      } else {
        // Console format
        console.log(comparator.generateComparisonReport(comparison));
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), `Failed to compare branches: ${errorMessage}`);
      process.exit(1);
    }
  }

  /**
   * Handle PR report command
   */
  private async handlePRReport(base: string, head: string | undefined, options: any): Promise<void> {
    try {
      const gitService = new GitService();
      const config = this.loadConfig();
      const comparator = new BranchComparator(gitService, config);
      const reporter = new PRReporter(comparator);
      
      const headBranch = head || gitService.getCurrentBranch();
      
      console.log(chalk.blue('📊'), `Generating PR report for ${chalk.cyan(headBranch)} → ${chalk.cyan(base)}...`);
      
      const report = await reporter.generateReport(base, headBranch, options.title, options.number);
      
      let output: string;
      switch (options.format) {
        case 'github':
          output = reporter.formatForGitHub(report);
          break;
        case 'gitlab':
          output = reporter.formatForGitLab(report);
          break;
        case 'json':
          output = reporter.formatAsJSON(report);
          break;
        case 'text':
          output = reporter.formatAsText(report);
          break;
        default:
          output = reporter.formatForGitHub(report);
      }
      
      if (options.output) {
        require('fs').writeFileSync(options.output, output);
        console.log(chalk.green('✅'), `PR report saved to ${options.output}`);
      } else {
        console.log(output);
      }
      
      // Exit with error code if blocked
      if (report.approvalStatus === 'blocked') {
        process.exit(1);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), `Failed to generate PR report: ${errorMessage}`);
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
    
    console.log(chalk.bold('\nGit Integration:'));
    console.log('  - Pre-commit quality checks');
    console.log('  - Commit message analysis');
    console.log('  - Branch quality comparison');
    console.log('  - Pull request reports');
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