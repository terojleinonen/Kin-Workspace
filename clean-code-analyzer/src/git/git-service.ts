/**
 * Git service for repository operations
 */

import { execSync, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface GitCommit {
  hash: string;
  author: string;
  date: Date;
  message: string;
  files: string[];
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  changes: number;
}

export class GitService {
  private repoPath: string;

  constructor(repoPath: string = process.cwd()) {
    this.repoPath = repoPath;
    this.validateGitRepo();
  }

  /**
   * Validate that the directory is a Git repository
   */
  private validateGitRepo(): void {
    const gitDir = path.join(this.repoPath, '.git');
    if (!fs.existsSync(gitDir)) {
      throw new Error(`Not a Git repository: ${this.repoPath}`);
    }
  }

  /**
   * Execute Git command
   */
  private execGit(command: string): string {
    try {
      return execSync(`git ${command}`, {
        cwd: this.repoPath,
        encoding: 'utf8'
      }).trim();
    } catch (error) {
      throw new Error(`Git command failed: git ${command}\n${error}`);
    }
  }

  /**
   * Get current branch name
   */
  getCurrentBranch(): string {
    return this.execGit('rev-parse --abbrev-ref HEAD');
  }

  /**
   * Get all branches
   */
  getBranches(): GitBranch[] {
    const output = this.execGit('branch -a');
    const lines = output.split('\n').filter(line => line.trim());
    
    return lines.map(line => {
      const current = line.startsWith('*');
      const name = line.replace(/^\*?\s+/, '').replace(/^remotes\/[^\/]+\//, '');
      const remote = line.includes('remotes/') ? line.match(/remotes\/([^\/]+)\//)?.[1] : undefined;
      
      return {
        name,
        current,
        remote
      };
    });
  }

  /**
   * Get staged files
   */
  getStagedFiles(): string[] {
    const output = this.execGit('diff --cached --name-only');
    return output ? output.split('\n').filter(file => file.trim()) : [];
  }

  /**
   * Get modified files
   */
  getModifiedFiles(): string[] {
    const output = this.execGit('diff --name-only');
    return output ? output.split('\n').filter(file => file.trim()) : [];
  }

  /**
   * Get files changed between commits/branches
   */
  getChangedFiles(from: string, to: string = 'HEAD'): string[] {
    const output = this.execGit(`diff --name-only ${from}..${to}`);
    return output ? output.split('\n').filter(file => file.trim()) : [];
  }

  /**
   * Get commit information
   */
  getCommit(hash: string = 'HEAD'): GitCommit {
    const format = '--pretty=format:%H|%an|%ad|%s';
    const output = this.execGit(`log -1 "${format}" --date=iso ${hash}`);
    const [hashPart, author, dateStr, message] = output.split('|');
    
    const files = this.getChangedFiles(`${hash}~1`, hash);
    
    return {
      hash: hashPart,
      author,
      date: new Date(dateStr),
      message,
      files
    };
  }

  /**
   * Get commits between two references
   */
  getCommitsBetween(from: string, to: string = 'HEAD'): GitCommit[] {
    const format = '--pretty=format:%H|%an|%ad|%s';
    const output = this.execGit(`log "${format}" --date=iso ${from}..${to}`);
    
    if (!output) return [];
    
    return output.split('\n').map(line => {
      const [hash, author, dateStr, message] = line.split('|');
      const files = this.getChangedFiles(`${hash}~1`, hash);
      
      return {
        hash,
        author,
        date: new Date(dateStr),
        message,
        files
      };
    });
  }

  /**
   * Get diff statistics between commits/branches
   */
  getDiffStats(from: string, to: string = 'HEAD'): GitDiff[] {
    const output = this.execGit(`diff --numstat ${from}..${to}`);
    
    if (!output) return [];
    
    return output.split('\n').map(line => {
      const [additions, deletions, file] = line.split('\t');
      return {
        file,
        additions: parseInt(additions) || 0,
        deletions: parseInt(deletions) || 0,
        changes: (parseInt(additions) || 0) + (parseInt(deletions) || 0)
      };
    });
  }

  /**
   * Check if repository has uncommitted changes
   */
  hasUncommittedChanges(): boolean {
    try {
      const status = this.execGit('status --porcelain');
      return status.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get repository root path
   */
  getRepoRoot(): string {
    return this.execGit('rev-parse --show-toplevel');
  }

  /**
   * Check if branch exists
   */
  branchExists(branchName: string): boolean {
    try {
      this.execGit(`rev-parse --verify ${branchName}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get remote URL
   */
  getRemoteUrl(remote: string = 'origin'): string | null {
    try {
      return this.execGit(`remote get-url ${remote}`);
    } catch {
      return null;
    }
  }

  /**
   * Get last commit hash
   */
  getLastCommitHash(): string {
    return this.execGit('rev-parse HEAD');
  }

  /**
   * Get commit message
   */
  getCommitMessage(hash: string = 'HEAD'): string {
    return this.execGit(`log -1 "--pretty=format:%s" ${hash}`);
  }
}