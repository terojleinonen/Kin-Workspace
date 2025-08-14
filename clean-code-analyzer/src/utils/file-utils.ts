/**
 * File system utilities for code analysis
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Check if a file is a TypeScript or JavaScript file
 */
export function isCodeFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
}

/**
 * Recursively find all code files in a directory
 */
export async function findCodeFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  
  async function traverse(dir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !shouldSkipDirectory(entry.name)) {
        await traverse(fullPath);
      } else if (entry.isFile() && isCodeFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  
  await traverse(directory);
  return files;
}

/**
 * Check if a directory should be skipped during analysis
 */
function shouldSkipDirectory(dirName: string): boolean {
  const skipDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '.nuxt'
  ];
  
  return skipDirs.includes(dirName) || dirName.startsWith('.');
}

/**
 * Read file content safely
 */
export async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Count lines in a file
 */
export function countLines(content: string): number {
  return content.split('\n').length;
}