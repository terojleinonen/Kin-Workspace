/**
 * Tests for Git service functionality
 */

import { GitService } from '../../src/git/git-service';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('GitService', () => {
  let tempDir: string;
  let gitService: GitService;

  beforeEach(() => {
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(__dirname, 'temp-git-'));
    
    // Initialize git repository
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });
    
    gitService = new GitService(tempDir);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should initialize with valid git repository', () => {
      expect(() => new GitService(tempDir)).not.toThrow();
    });

    it('should throw error for non-git directory', () => {
      const nonGitDir = fs.mkdtempSync(path.join(__dirname, 'temp-non-git-'));
      
      expect(() => new GitService(nonGitDir)).toThrow('Not a Git repository');
      
      fs.rmSync(nonGitDir, { recursive: true, force: true });
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', () => {
      // Create initial commit to establish branch
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test content');
      execSync('git add test.txt', { cwd: tempDir });
      execSync('git commit -m "Initial commit"', { cwd: tempDir });
      
      const branch = gitService.getCurrentBranch();
      expect(branch).toBe('main');
    });
  });

  describe('getBranches', () => {
    beforeEach(() => {
      // Create initial commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test content');
      execSync('git add test.txt', { cwd: tempDir });
      execSync('git commit -m "Initial commit"', { cwd: tempDir });
    });

    it('should return list of branches', () => {
      const branches = gitService.getBranches();
      expect(branches).toHaveLength(1);
      expect(branches[0].name).toBe('main');
      expect(branches[0].current).toBe(true);
    });

    it('should include new branches', () => {
      execSync('git checkout -b feature-branch', { cwd: tempDir });
      
      const branches = gitService.getBranches();
      expect(branches.length).toBeGreaterThan(1);
      expect(branches.some(b => b.name === 'feature-branch')).toBe(true);
    });
  });

  describe('getStagedFiles', () => {
    it('should return empty array when no files staged', () => {
      const stagedFiles = gitService.getStagedFiles();
      expect(stagedFiles).toEqual([]);
    });

    it('should return staged files', () => {
      fs.writeFileSync(path.join(tempDir, 'staged.txt'), 'staged content');
      execSync('git add staged.txt', { cwd: tempDir });
      
      const stagedFiles = gitService.getStagedFiles();
      expect(stagedFiles).toContain('staged.txt');
    });
  });

  describe('getModifiedFiles', () => {
    beforeEach(() => {
      // Create initial commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'initial content');
      execSync('git add test.txt', { cwd: tempDir });
      execSync('git commit -m "Initial commit"', { cwd: tempDir });
    });

    it('should return empty array when no files modified', () => {
      const modifiedFiles = gitService.getModifiedFiles();
      expect(modifiedFiles).toEqual([]);
    });

    it('should return modified files', () => {
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'modified content');
      
      const modifiedFiles = gitService.getModifiedFiles();
      expect(modifiedFiles).toContain('test.txt');
    });
  });

  describe('getChangedFiles', () => {
    beforeEach(() => {
      // Create initial commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'initial content');
      execSync('git add test.txt', { cwd: tempDir });
      execSync('git commit -m "Initial commit"', { cwd: tempDir });
    });

    it('should return files changed between commits', () => {
      // Create second commit
      fs.writeFileSync(path.join(tempDir, 'new.txt'), 'new content');
      execSync('git add new.txt', { cwd: tempDir });
      execSync('git commit -m "Add new file"', { cwd: tempDir });
      
      const changedFiles = gitService.getChangedFiles('HEAD~1', 'HEAD');
      expect(changedFiles).toContain('new.txt');
    });
  });

  describe('getCommit', () => {
    beforeEach(() => {
      // Create initial commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'initial content');
      execSync('git add test.txt', { cwd: tempDir });
      execSync('git commit -m "Test commit message"', { cwd: tempDir });
    });

    it('should return commit information', () => {
      const commit = gitService.getCommit();
      
      expect(commit.author).toBe('Test User');
      expect(commit.message).toBe('Test commit message');
      expect(commit.hash).toMatch(/^[a-f0-9]{40}$/);
      expect(commit.date).toBeInstanceOf(Date);
    });
  });

  describe('hasUncommittedChanges', () => {
    it('should return false when no changes', () => {
      const hasChanges = gitService.hasUncommittedChanges();
      expect(hasChanges).toBe(false);
    });

    it('should return true when files are modified', () => {
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test content');
      
      const hasChanges = gitService.hasUncommittedChanges();
      expect(hasChanges).toBe(true);
    });
  });

  describe('getRepoRoot', () => {
    it('should return repository root path', () => {
      const repoRoot = gitService.getRepoRoot();
      expect(repoRoot).toBe(tempDir);
    });
  });

  describe('branchExists', () => {
    beforeEach(() => {
      // Create initial commit
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'initial content');
      execSync('git add test.txt', { cwd: tempDir });
      execSync('git commit -m "Initial commit"', { cwd: tempDir });
    });

    it('should return true for existing branch', () => {
      const exists = gitService.branchExists('main');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing branch', () => {
      const exists = gitService.branchExists('non-existent-branch');
      expect(exists).toBe(false);
    });
  });
});