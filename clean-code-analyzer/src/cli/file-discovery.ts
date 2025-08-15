/**
 * File discovery and filtering utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { minimatch } from 'minimatch';

export interface FileDiscoveryOptions {
  include: string[];
  exclude: string[];
  directories: string[];
}

export class FileDiscovery {
  /**
   * Discover files matching the given patterns
   */
  static async discoverFiles(options: FileDiscoveryOptions): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const directory of options.directories) {
      const files = await this.walkDirectory(directory);
      allFiles.push(...files);
    }
    
    return this.filterFiles(allFiles, options.include, options.exclude);
  }
  
  /**
   * Recursively walk directory and collect all files
   */
  private static async walkDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.walkDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Cannot read directory ${dir}: ${errorMessage}`);
    }
    
    return files;
  }
  
  /**
   * Filter files based on include/exclude patterns
   */
  private static filterFiles(files: string[], include: string[], exclude: string[]): string[] {
    return files.filter(file => {
      // Normalize path separators for cross-platform compatibility
      const normalizedFile = file.replace(/\\/g, '/');
      
      // Check if file matches any include pattern
      const isIncluded = include.some(pattern => minimatch(normalizedFile, pattern));
      if (!isIncluded) {
        return false;
      }
      
      // Check if file matches any exclude pattern
      const isExcluded = exclude.some(pattern => minimatch(normalizedFile, pattern));
      return !isExcluded;
    });
  }
  
  /**
   * Validate that directories exist
   */
  static validateDirectories(directories: string[]): string[] {
    const errors: string[] = [];
    
    for (const dir of directories) {
      try {
        const stat = fs.statSync(dir);
        if (!stat.isDirectory()) {
          errors.push(`Path is not a directory: ${dir}`);
        }
      } catch (error) {
        errors.push(`Directory does not exist: ${dir}`);
      }
    }
    
    return errors;
  }
}