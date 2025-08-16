/**
 * Git hook installer and manager
 */

import * as fs from 'fs';
import * as path from 'path';
import { GitService } from './git-service';

export interface HookConfig {
  preCommit: PreCommitConfig;
  commitMsg: CommitMsgConfig;
  prePush: PrePushConfig;
}

export interface PreCommitConfig {
  enabled: boolean;
  checkStagedFiles: boolean;
  failOnViolations: boolean;
  minScore: number;
  maxViolations: number;
  skipPatterns: string[];
}

export interface CommitMsgConfig {
  enabled: boolean;
  enforceConventional: boolean;
  minScore: number;
  maxSubjectLength: number;
}

export interface PrePushConfig {
  enabled: boolean;
  compareBranches: boolean;
  baseBranch: string;
  qualityGates: {
    minScoreImprovement: number;
    maxNewViolations: number;
  };
}

export const DEFAULT_HOOK_CONFIG: HookConfig = {
  preCommit: {
    enabled: true,
    checkStagedFiles: true,
    failOnViolations: true,
    minScore: 70,
    maxViolations: 5,
    skipPatterns: ['*.test.ts', '*.spec.ts', '*.d.ts']
  },
  commitMsg: {
    enabled: true,
    enforceConventional: true,
    minScore: 80,
    maxSubjectLength: 50
  },
  prePush: {
    enabled: false,
    compareBranches: true,
    baseBranch: 'main',
    qualityGates: {
      minScoreImprovement: 0,
      maxNewViolations: 0
    }
  }
};

export class HookInstaller {
  private gitService: GitService;
  private repoRoot: string;
  private hooksDir: string;

  constructor(gitService: GitService) {
    this.gitService = gitService;
    this.repoRoot = gitService.getRepoRoot();
    this.hooksDir = path.join(this.repoRoot, '.git', 'hooks');
  }

  /**
   * Install all configured hooks
   */
  async installHooks(config: Partial<HookConfig> = {}): Promise<void> {
    const fullConfig = this.mergeConfig(config);
    
    // Ensure hooks directory exists
    if (!fs.existsSync(this.hooksDir)) {
      fs.mkdirSync(this.hooksDir, { recursive: true });
    }

    // Install individual hooks
    if (fullConfig.preCommit.enabled) {
      await this.installPreCommitHook(fullConfig.preCommit);
    }

    if (fullConfig.commitMsg.enabled) {
      await this.installCommitMsgHook(fullConfig.commitMsg);
    }

    if (fullConfig.prePush.enabled) {
      await this.installPrePushHook(fullConfig.prePush);
    }

    // Save configuration
    await this.saveHookConfig(fullConfig);
  }

  /**
   * Install pre-commit hook
   */
  private async installPreCommitHook(config: PreCommitConfig): Promise<void> {
    const hookPath = path.join(this.hooksDir, 'pre-commit');
    const hookScript = this.generatePreCommitScript(config);
    
    fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });
    console.log('✅ Pre-commit hook installed');
  }

  /**
   * Install commit-msg hook
   */
  private async installCommitMsgHook(config: CommitMsgConfig): Promise<void> {
    const hookPath = path.join(this.hooksDir, 'commit-msg');
    const hookScript = this.generateCommitMsgScript(config);
    
    fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });
    console.log('✅ Commit-msg hook installed');
  }

  /**
   * Install pre-push hook
   */
  private async installPrePushHook(config: PrePushConfig): Promise<void> {
    const hookPath = path.join(this.hooksDir, 'pre-push');
    const hookScript = this.generatePrePushScript(config);
    
    fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });
    console.log('✅ Pre-push hook installed');
  }

  /**
   * Generate pre-commit hook script
   */
  private generatePreCommitScript(config: PreCommitConfig): string {
    return `#!/bin/sh
# Clean Code Analyzer Pre-commit Hook
# Generated automatically - do not edit manually

set -e

echo "🔍 Running Clean Code Analysis on staged files..."

# Get the path to the analyzer CLI
ANALYZER_CLI="npx clean-code-analyzer"

# Check if analyzer is available
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(ts|tsx|js|jsx)$' || true)

if [ -z "$STAGED_FILES" ]; then
    echo "✅ No TypeScript/JavaScript files staged for commit"
    exit 0
fi

# Skip patterns
${config.skipPatterns.map(pattern => `STAGED_FILES=$(echo "$STAGED_FILES" | grep -v '${pattern}' || true)`).join('\n')}

if [ -z "$STAGED_FILES" ]; then
    echo "✅ All staged files are in skip patterns"
    exit 0
fi

echo "📁 Analyzing $(echo "$STAGED_FILES" | wc -l) staged files..."

# Create temporary config for hook
TEMP_CONFIG=$(mktemp)
cat > "$TEMP_CONFIG" << EOF
{
  "minSeverity": "low",
  "output": {
    "format": "json",
    "verbose": false
  },
  "analysis": {
    "complexity": true,
    "naming": true,
    "functions": true,
    "classes": true
  }
}
EOF

# Run analysis on staged files
ANALYSIS_RESULT=$(echo "$STAGED_FILES" | xargs $ANALYZER_CLI analyze --config "$TEMP_CONFIG" --format json 2>/dev/null || echo '{"summary":{"averageScore":0,"totalViolations":999}}')

# Clean up temp config
rm -f "$TEMP_CONFIG"

# Parse results
SCORE=$(echo "$ANALYSIS_RESULT" | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
console.log(data.summary?.averageScore || 0);
")

VIOLATIONS=$(echo "$ANALYSIS_RESULT" | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
console.log(data.summary?.totalViolations || 0);
")

echo "📊 Quality Score: $SCORE/100"
echo "⚠️  Total Violations: $VIOLATIONS"

# Check quality gates
${config.failOnViolations ? `
if [ "$SCORE" -lt "${config.minScore}" ]; then
    echo "❌ Quality score ($SCORE) is below minimum required (${config.minScore})"
    echo "💡 Run 'clean-code-analyzer analyze' to see detailed issues"
    exit 1
fi

if [ "$VIOLATIONS" -gt "${config.maxViolations}" ]; then
    echo "❌ Too many violations ($VIOLATIONS), maximum allowed: ${config.maxViolations}"
    echo "💡 Fix violations before committing"
    exit 1
fi
` : ''}

echo "✅ Code quality checks passed!"
exit 0
`;
  }

  /**
   * Generate commit-msg hook script
   */
  private generateCommitMsgScript(config: CommitMsgConfig): string {
    return `#!/bin/sh
# Clean Code Analyzer Commit Message Hook
# Generated automatically - do not edit manually

set -e

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

echo "📝 Analyzing commit message..."

# Create temporary script for commit message analysis
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << 'EOF'
const { CommitMessageAnalyzer } = require('clean-code-analyzer/dist/git/commit-analyzer');

const config = {
  enforceConventionalCommits: ${config.enforceConventional},
  maxSubjectLength: ${config.maxSubjectLength},
  subjectCase: 'lower'
};

const analyzer = new CommitMessageAnalyzer(config);
const message = process.argv[1];
const analysis = analyzer.analyzeMessage(message);

console.log(\`📊 Commit Message Score: \${analysis.score}/100\`);

if (analysis.issues.length > 0) {
  console.log('\\n⚠️  Issues found:');
  analysis.issues.forEach(issue => {
    const icon = issue.severity === 'error' ? '❌' : 
                 issue.severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(\`  \${icon} \${issue.message}\`);
  });
}

if (analysis.suggestions.length > 0) {
  console.log('\\n💡 Suggestions:');
  analysis.suggestions.forEach(suggestion => {
    console.log(\`  • \${suggestion}\`);
  });
}

if (analysis.score < ${config.minScore}) {
  console.log(\`\\n❌ Commit message score (\${analysis.score}) is below minimum (${config.minScore})\`);
  process.exit(1);
}

console.log('\\n✅ Commit message quality check passed!');
EOF

# Run the analysis
node "$TEMP_SCRIPT" "$COMMIT_MSG"
RESULT=$?

# Clean up
rm -f "$TEMP_SCRIPT"

exit $RESULT
`;
  }

  /**
   * Generate pre-push hook script
   */
  private generatePrePushScript(config: PrePushConfig): string {
    return `#!/bin/sh
# Clean Code Analyzer Pre-push Hook
# Generated automatically - do not edit manually

set -e

echo "🚀 Running quality comparison before push..."

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
BASE_BRANCH="${config.baseBranch}"

echo "📊 Comparing $CURRENT_BRANCH with $BASE_BRANCH..."

# Check if base branch exists
if ! git rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
    echo "⚠️  Base branch '$BASE_BRANCH' not found, skipping comparison"
    exit 0
fi

# Get changed files
CHANGED_FILES=$(git diff --name-only "$BASE_BRANCH"..."$CURRENT_BRANCH" | grep -E '\\.(ts|tsx|js|jsx)$' || true)

if [ -z "$CHANGED_FILES" ]; then
    echo "✅ No source files changed"
    exit 0
fi

echo "📁 Found $(echo "$CHANGED_FILES" | wc -l) changed source files"

# Run comparison (this would use the branch comparator)
# For now, we'll do a simple analysis
ANALYZER_CLI="npx clean-code-analyzer"

echo "🔍 Analyzing current branch..."
CURRENT_RESULT=$($ANALYZER_CLI analyze --format json 2>/dev/null || echo '{"summary":{"averageScore":0,"totalViolations":999}}')

CURRENT_SCORE=$(echo "$CURRENT_RESULT" | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
console.log(data.summary?.averageScore || 0);
")

CURRENT_VIOLATIONS=$(echo "$CURRENT_RESULT" | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
console.log(data.summary?.totalViolations || 0);
")

echo "📊 Current Quality Score: $CURRENT_SCORE/100"
echo "⚠️  Current Violations: $CURRENT_VIOLATIONS"

# Quality gates
${config.qualityGates.maxNewViolations > 0 ? `
if [ "$CURRENT_VIOLATIONS" -gt "${config.qualityGates.maxNewViolations}" ]; then
    echo "❌ Too many violations ($CURRENT_VIOLATIONS), maximum allowed: ${config.qualityGates.maxNewViolations}"
    exit 1
fi
` : ''}

echo "✅ Quality gates passed!"
exit 0
`;
  }

  /**
   * Uninstall hooks
   */
  async uninstallHooks(): Promise<void> {
    const hooks = ['pre-commit', 'commit-msg', 'pre-push'];
    
    for (const hook of hooks) {
      const hookPath = path.join(this.hooksDir, hook);
      if (fs.existsSync(hookPath)) {
        // Check if it's our hook
        const content = fs.readFileSync(hookPath, 'utf8');
        if (content.includes('Clean Code Analyzer')) {
          fs.unlinkSync(hookPath);
          console.log(`✅ Removed ${hook} hook`);
        }
      }
    }

    // Remove config file
    const configPath = path.join(this.repoRoot, '.clean-code-hooks.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }

  /**
   * Check hook status
   */
  getHookStatus(): { [key: string]: boolean } {
    const hooks = ['pre-commit', 'commit-msg', 'pre-push'];
    const status: { [key: string]: boolean } = {};
    
    for (const hook of hooks) {
      const hookPath = path.join(this.hooksDir, hook);
      status[hook] = fs.existsSync(hookPath) && 
        fs.readFileSync(hookPath, 'utf8').includes('Clean Code Analyzer');
    }
    
    return status;
  }

  /**
   * Merge configuration with defaults
   */
  private mergeConfig(config: Partial<HookConfig>): HookConfig {
    return {
      preCommit: { ...DEFAULT_HOOK_CONFIG.preCommit, ...(config.preCommit || {}) },
      commitMsg: { ...DEFAULT_HOOK_CONFIG.commitMsg, ...(config.commitMsg || {}) },
      prePush: { ...DEFAULT_HOOK_CONFIG.prePush, ...(config.prePush || {}) }
    };
  }

  /**
   * Save hook configuration
   */
  private async saveHookConfig(config: HookConfig): Promise<void> {
    const configPath = path.join(this.repoRoot, '.clean-code-hooks.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Load hook configuration
   */
  loadHookConfig(): HookConfig {
    const configPath = path.join(this.repoRoot, '.clean-code-hooks.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return this.mergeConfig(config);
      } catch (error) {
        console.warn('Failed to load hook config, using defaults');
      }
    }
    
    return DEFAULT_HOOK_CONFIG;
  }
}