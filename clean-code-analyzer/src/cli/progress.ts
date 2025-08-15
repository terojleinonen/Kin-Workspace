/**
 * Progress indicators and logging for CLI operations
 */

import ora from 'ora';
import chalk from 'chalk';

export interface ProgressOptions {
  verbose: boolean;
  silent: boolean;
}

export class ProgressIndicator {
  private spinner: ora.Ora | null = null;
  private options: ProgressOptions;
  private startTime: number = 0;
  
  constructor(options: ProgressOptions = { verbose: false, silent: false }) {
    this.options = options;
  }
  
  /**
   * Start a spinner with message
   */
  start(message: string): void {
    if (this.options.silent) return;
    
    this.startTime = Date.now();
    this.spinner = ora({
      text: message,
      color: 'blue'
    }).start();
  }
  
  /**
   * Update spinner text
   */
  update(message: string): void {
    if (this.options.silent || !this.spinner) return;
    
    this.spinner.text = message;
  }
  
  /**
   * Mark operation as successful
   */
  succeed(message?: string): void {
    if (this.options.silent || !this.spinner) return;
    
    const duration = Date.now() - this.startTime;
    const finalMessage = message || this.spinner.text;
    
    this.spinner.succeed(`${finalMessage} ${chalk.gray(`(${duration}ms)`)}`);
    this.spinner = null;
  }
  
  /**
   * Mark operation as failed
   */
  fail(message?: string): void {
    if (this.options.silent || !this.spinner) return;
    
    const finalMessage = message || this.spinner.text;
    this.spinner.fail(finalMessage);
    this.spinner = null;
  }
  
  /**
   * Stop spinner without status
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
  
  /**
   * Log info message
   */
  info(message: string): void {
    if (this.options.silent) return;
    
    console.log(chalk.blue('ℹ'), message);
  }
  
  /**
   * Log success message
   */
  success(message: string): void {
    if (this.options.silent) return;
    
    console.log(chalk.green('✓'), message);
  }
  
  /**
   * Log warning message
   */
  warn(message: string): void {
    if (this.options.silent) return;
    
    console.log(chalk.yellow('⚠'), message);
  }
  
  /**
   * Log error message
   */
  error(message: string): void {
    if (this.options.silent) return;
    
    console.log(chalk.red('✗'), message);
  }
  
  /**
   * Log verbose message (only if verbose mode is enabled)
   */
  verbose(message: string): void {
    if (this.options.silent || !this.options.verbose) return;
    
    console.log(chalk.gray('→'), message);
  }
  
  /**
   * Create a progress bar for batch operations
   */
  createProgressBar(total: number): BatchProgress {
    return new BatchProgress(total, this.options);
  }
}

export class BatchProgress {
  private current: number = 0;
  private total: number;
  private options: ProgressOptions;
  private startTime: number;
  
  constructor(total: number, options: ProgressOptions) {
    this.total = total;
    this.options = options;
    this.startTime = Date.now();
  }
  
  /**
   * Update progress
   */
  update(current: number, message?: string): void {
    if (this.options.silent) return;
    
    this.current = current;
    const percentage = Math.round((current / this.total) * 100);
    const elapsed = Date.now() - this.startTime;
    const rate = current / (elapsed / 1000);
    const eta = current > 0 ? Math.round((this.total - current) / rate) : 0;
    
    const progressBar = this.createProgressBar(percentage);
    const statusMessage = message || `Processing files`;
    
    process.stdout.write(
      `\r${statusMessage} ${progressBar} ${current}/${this.total} (${percentage}%) ETA: ${eta}s`
    );
  }
  
  /**
   * Complete the progress bar
   */
  complete(message?: string): void {
    if (this.options.silent) return;
    
    const elapsed = Date.now() - this.startTime;
    const finalMessage = message || 'Processing complete';
    
    process.stdout.write(`\r${chalk.green('✓')} ${finalMessage} (${elapsed}ms)\n`);
  }
  
  /**
   * Create visual progress bar
   */
  private createProgressBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }
}