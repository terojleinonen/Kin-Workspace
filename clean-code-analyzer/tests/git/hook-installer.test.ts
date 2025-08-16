/**
 * Tests for Git hook installer
 */

import { HookInstaller, DEFAULT_HOOK_CONFIG } from '../../src/git/hook-installer';
import { GitService } from '../../src/git/git-service';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('HookInstaller', () => {
  let tempDir: string;
  let gitService: GitService;
  let installer: HookInstaller;

  beforeEach(() => {
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(__dirname, 'temp-hooks-'));
    
    // Initialize git repository
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });
    
    gitService = new GitService(tempDir);
    installer = new HookInstaller(gitService);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('installHooks', () => {
    it('should install pre-commit hook when enabled', async () => {
      const config = {
        preCommit: { enabled: true },
        commitMsg: { enabled: false },
        prePush: { enabled: false }
      } as Partial<HookConfig>;

      await installer.installHooks(config);

      const hookPath = path.join(tempDir, '.git', 'hooks', 'pre-commit');
      expect(fs.existsSync(hookPath)).toBe(true);
      
      const hookContent = fs.readFileSync(hookPath, 'utf8');
      expect(hookContent).toContain('Clean Code Analyzer Pre-commit Hook');
      
      // Check if hook is executable
      const stats = fs.statSync(hookPath);
      expect(stats.mode & parseInt('755', 8)).toBeTruthy();
    });

    it('should install commit-msg hook when enabled', async () => {
      const config = {
        preCommit: { enabled: false },
        commitMsg: { enabled: true },
        prePush: { enabled: false }
      } as Partial<HookConfig>;

      await installer.installHooks(config);

      const hookPath = path.join(tempDir, '.git', 'hooks', 'commit-msg');
      expect(fs.existsSync(hookPath)).toBe(true);
      
      const hookContent = fs.readFileSync(hookPath, 'utf8');
      expect(hookContent).toContain('Clean Code Analyzer Commit Message Hook');
    });

    it('should install pre-push hook when enabled', async () => {
      const config = {
        preCommit: { enabled: false },
        commitMsg: { enabled: false },
        prePush: { enabled: true }
      } as Partial<HookConfig>;

      await installer.installHooks(config);

      const hookPath = path.join(tempDir, '.git', 'hooks', 'pre-push');
      expect(fs.existsSync(hookPath)).toBe(true);
      
      const hookContent = fs.readFileSync(hookPath, 'utf8');
      expect(hookContent).toContain('Clean Code Analyzer Pre-push Hook');
    });

    it('should install all hooks when all enabled', async () => {
      const config = {
        preCommit: { enabled: true },
        commitMsg: { enabled: true },
        prePush: { enabled: true }
      } as Partial<HookConfig>;

      await installer.installHooks(config);

      const hooksDir = path.join(tempDir, '.git', 'hooks');
      expect(fs.existsSync(path.join(hooksDir, 'pre-commit'))).toBe(true);
      expect(fs.existsSync(path.join(hooksDir, 'commit-msg'))).toBe(true);
      expect(fs.existsSync(path.join(hooksDir, 'pre-push'))).toBe(true);
    });

    it('should save configuration file', async () => {
      const config = {
        preCommit: { enabled: true, minScore: 80 },
        commitMsg: { enabled: true },
        prePush: { enabled: false }
      } as Partial<HookConfig>;

      await installer.installHooks(config);

      const configPath = path.join(tempDir, '.clean-code-hooks.json');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      expect(savedConfig.preCommit.minScore).toBe(80);
    });
  });

  describe('uninstallHooks', () => {
    beforeEach(async () => {
      // Install hooks first
      await installer.installHooks({
        preCommit: { enabled: true },
        commitMsg: { enabled: true },
        prePush: { enabled: true }
      } as Partial<HookConfig>);
    });

    it('should remove all installed hooks', async () => {
      await installer.uninstallHooks();

      const hooksDir = path.join(tempDir, '.git', 'hooks');
      expect(fs.existsSync(path.join(hooksDir, 'pre-commit'))).toBe(false);
      expect(fs.existsSync(path.join(hooksDir, 'commit-msg'))).toBe(false);
      expect(fs.existsSync(path.join(hooksDir, 'pre-push'))).toBe(false);
    });

    it('should remove configuration file', async () => {
      await installer.uninstallHooks();

      const configPath = path.join(tempDir, '.clean-code-hooks.json');
      expect(fs.existsSync(configPath)).toBe(false);
    });

    it('should not remove non-analyzer hooks', async () => {
      // Create a custom hook
      const customHookPath = path.join(tempDir, '.git', 'hooks', 'pre-commit');
      fs.writeFileSync(customHookPath, '#!/bin/sh\necho "Custom hook"');

      await installer.uninstallHooks();

      // Custom hook should still exist
      expect(fs.existsSync(customHookPath)).toBe(true);
      const content = fs.readFileSync(customHookPath, 'utf8');
      expect(content).toContain('Custom hook');
    });
  });

  describe('getHookStatus', () => {
    it('should return false for all hooks when none installed', () => {
      const status = installer.getHookStatus();

      expect(status['pre-commit']).toBe(false);
      expect(status['commit-msg']).toBe(false);
      expect(status['pre-push']).toBe(false);
    });

    it('should return correct status for installed hooks', async () => {
      await installer.installHooks({
        preCommit: { enabled: true },
        commitMsg: { enabled: false },
        prePush: { enabled: true }
      } as Partial<HookConfig>);

      const status = installer.getHookStatus();

      expect(status['pre-commit']).toBe(true);
      expect(status['commit-msg']).toBe(false);
      expect(status['pre-push']).toBe(true);
    });

    it('should return false for non-analyzer hooks', () => {
      // Create a custom hook
      const customHookPath = path.join(tempDir, '.git', 'hooks', 'pre-commit');
      fs.mkdirSync(path.dirname(customHookPath), { recursive: true });
      fs.writeFileSync(customHookPath, '#!/bin/sh\necho "Custom hook"');

      const status = installer.getHookStatus();

      expect(status['pre-commit']).toBe(false);
    });
  });

  describe('loadHookConfig', () => {
    it('should return default config when no config file exists', () => {
      const config = installer.loadHookConfig();

      expect(config).toEqual(DEFAULT_HOOK_CONFIG);
    });

    it('should load saved configuration', async () => {
      const customConfig = {
        preCommit: { enabled: true, minScore: 90 },
        commitMsg: { enabled: true, maxSubjectLength: 60 },
        prePush: { enabled: false }
      } as Partial<HookConfig>;

      await installer.installHooks(customConfig);
      const loadedConfig = installer.loadHookConfig();

      expect(loadedConfig.preCommit.minScore).toBe(90);
      expect(loadedConfig.commitMsg.maxSubjectLength).toBe(60);
    });

    it('should merge with defaults for partial config', async () => {
      const partialConfig = {
        preCommit: { minScore: 85 }
      };

      const configPath = path.join(tempDir, '.clean-code-hooks.json');
      fs.writeFileSync(configPath, JSON.stringify(partialConfig));

      const loadedConfig = installer.loadHookConfig();

      expect(loadedConfig.preCommit.minScore).toBe(85);
      expect(loadedConfig.preCommit.enabled).toBe(DEFAULT_HOOK_CONFIG.preCommit.enabled);
      expect(loadedConfig.commitMsg).toEqual(DEFAULT_HOOK_CONFIG.commitMsg);
    });

    it('should use defaults when config file is corrupted', () => {
      const configPath = path.join(tempDir, '.clean-code-hooks.json');
      fs.writeFileSync(configPath, 'invalid json');

      const config = installer.loadHookConfig();

      expect(config).toEqual(DEFAULT_HOOK_CONFIG);
    });
  });

  describe('hook script generation', () => {
    it('should generate pre-commit script with correct configuration', async () => {
      const config = {
        preCommit: { 
          enabled: true, 
          minScore: 85, 
          maxViolations: 3,
          skipPatterns: ['*.test.ts', '*.spec.js']
        }
      } as Partial<HookConfig>;

      await installer.installHooks(config);

      const hookPath = path.join(tempDir, '.git', 'hooks', 'pre-commit');
      const hookContent = fs.readFileSync(hookPath, 'utf8');

      expect(hookContent).toContain('85'); // minScore
      expect(hookContent).toContain('3'); // maxViolations
      expect(hookContent).toContain('*.test.ts'); // skipPatterns
      expect(hookContent).toContain('*.spec.js');
    });

    it('should generate commit-msg script with correct configuration', async () => {
      const config = {
        commitMsg: { 
          enabled: true, 
          enforceConventional: false,
          maxSubjectLength: 60,
          minScore: 75
        }
      } as Partial<HookConfig>;

      await installer.installHooks(config);

      const hookPath = path.join(tempDir, '.git', 'hooks', 'commit-msg');
      const hookContent = fs.readFileSync(hookPath, 'utf8');

      expect(hookContent).toContain('false'); // enforceConventional
      expect(hookContent).toContain('60'); // maxSubjectLength
      expect(hookContent).toContain('75'); // minScore
    });

    it('should generate pre-push script with correct configuration', async () => {
      const config = {
        prePush: { 
          enabled: true, 
          baseBranch: 'develop',
          qualityGates: {
            maxNewViolations: 2
          }
        }
      } as Partial<HookConfig>;

      await installer.installHooks(config);

      const hookPath = path.join(tempDir, '.git', 'hooks', 'pre-push');
      const hookContent = fs.readFileSync(hookPath, 'utf8');

      expect(hookContent).toContain('develop'); // baseBranch
      expect(hookContent).toContain('2'); // maxNewViolations
    });
  });
});