#!/usr/bin/env node

/**
 * Standalone Git CLI for Clean Code Analyzer
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { GitService } from './git/git-service';
import { HookInstaller } from './git/hook-installer';
import { CommitMessageAnalyzer } from './git/commit-analyzer';
import { VERSION } from './index';

const program = new Command();

program
  .name('clean-code-git')
  .description('Git integration for Clean Code Analyzer')
  .version(VERSION);

// Install hooks command
program
  .command('install-hooks')
  .description('Install Git hooks for quality checks')
  .option('--pre-commit', 'Install pre-commit hook', true)
  .option('--commit-msg', 'Install commit-msg hook', true)
  .option('--pre-push', 'Install pre-push hook', false)
  .action(async (options) => {
    try {
      const gitService = new GitService();
      const installer = new HookInstaller(gitService);
      
      const config = {
        preCommit: { enabled: options.preCommit },
        commitMsg: { enabled: options.commitMsg },
        prePush: { enabled: options.prePush }
      } as any;
      
      await installer.installHooks(config);
      console.log(chalk.green('✅ Git hooks installed successfully'));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), `Failed to install hooks: ${errorMessage}`);
      process.exit(1);
    }
  });

// Uninstall hooks command
program
  .command('uninstall-hooks')
  .description('Uninstall Git hooks')
  .action(async () => {
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
  });

// Hook status command
program
  .command('hook-status')
  .description('Show Git hook installation status')
  .action(async () => {
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
  });

// Check commit message command
program
  .command('check-commit')
  .description('Check commit message quality')
  .argument('[message]', 'Commit message to check')
  .option('--conventional', 'Enforce conventional commit format', true)
  .option('--max-length <number>', 'Maximum subject length', '50')
  .action(async (message, options) => {
    try {
      let commitMessage = message;
      
      if (!commitMessage) {
        console.error(chalk.red('Error:'), 'No commit message provided');
        console.log(chalk.gray('Usage: clean-code-git check-commit "your commit message"'));
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
      
      if (analysis.score >= 80) {
        console.log(chalk.green('\n✅ Commit message quality is good!'));
      } else {
        console.log(chalk.yellow('\n⚠️ Commit message could be improved'));
        process.exit(1);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), `Failed to analyze commit message: ${errorMessage}`);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .description('Show Git integration information')
  .action(() => {
    console.log(chalk.bold.blue('Clean Code Analyzer - Git Integration'));
    console.log(chalk.gray('='.repeat(40)));
    console.log(`Version: ${chalk.cyan(VERSION)}`);
    console.log(`Node.js: ${chalk.cyan(process.version)}`);
    console.log(`Working Directory: ${chalk.cyan(process.cwd())}`);
    
    console.log(chalk.bold('\nAvailable Commands:'));
    console.log('  install-hooks    Install Git hooks for quality checks');
    console.log('  uninstall-hooks  Remove installed Git hooks');
    console.log('  hook-status      Show hook installation status');
    console.log('  check-commit     Analyze commit message quality');
    console.log('  info             Show this information');
    
    console.log(chalk.bold('\nSupported Git Hooks:'));
    console.log('  pre-commit       Quality checks on staged files');
    console.log('  commit-msg       Commit message analysis');
    console.log('  pre-push         Branch quality comparison');
  });

// Parse command line arguments
program.parse();