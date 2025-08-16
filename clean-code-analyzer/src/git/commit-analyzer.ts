/**
 * Commit message analyzer for quality assessment
 */

export interface CommitMessageAnalysis {
  score: number;
  issues: CommitMessageIssue[];
  suggestions: string[];
  type?: CommitType;
  scope?: string;
  description: string;
}

export interface CommitMessageIssue {
  type: 'length' | 'format' | 'content' | 'style';
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
}

export enum CommitType {
  FEAT = 'feat',
  FIX = 'fix',
  DOCS = 'docs',
  STYLE = 'style',
  REFACTOR = 'refactor',
  TEST = 'test',
  CHORE = 'chore',
  PERF = 'perf',
  CI = 'ci',
  BUILD = 'build',
  REVERT = 'revert'
}

export interface CommitAnalysisConfig {
  enforceConventionalCommits: boolean;
  maxSubjectLength: number;
  maxBodyLineLength: number;
  requireBody: boolean;
  requireScope: boolean;
  allowedTypes: CommitType[];
  allowedScopes: string[];
  subjectCase: 'lower' | 'sentence' | 'any';
}

export const DEFAULT_COMMIT_CONFIG: CommitAnalysisConfig = {
  enforceConventionalCommits: true,
  maxSubjectLength: 50,
  maxBodyLineLength: 72,
  requireBody: false,
  requireScope: false,
  allowedTypes: Object.values(CommitType),
  allowedScopes: [],
  subjectCase: 'lower'
};

export class CommitMessageAnalyzer {
  private config: CommitAnalysisConfig;

  constructor(config: Partial<CommitAnalysisConfig> = {}) {
    this.config = { ...DEFAULT_COMMIT_CONFIG, ...config };
  }

  /**
   * Analyze commit message quality
   */
  analyzeMessage(message: string): CommitMessageAnalysis {
    const lines = message.split('\n');
    const subject = lines[0] || '';
    const body = lines.slice(2).join('\n').trim();

    const issues: CommitMessageIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Handle empty or whitespace-only messages
    if (message.trim().length === 0) {
      issues.push({
        type: 'length',
        severity: 'error',
        message: 'Commit message cannot be empty',
        line: 1
      });
      return {
        score: 0,
        issues,
        suggestions: ['Provide a meaningful commit message'],
        description: ''
      };
    }

    // Parse conventional commit format
    const conventionalMatch = this.parseConventionalCommit(subject);
    let type: CommitType | undefined;
    let scope: string | undefined;
    let description = subject;

    if (this.config.enforceConventionalCommits) {
      if (conventionalMatch) {
        type = conventionalMatch.type;
        scope = conventionalMatch.scope;
        description = conventionalMatch.description;
      } else {
        issues.push({
          type: 'format',
          severity: 'error',
          message: 'Commit message does not follow conventional commit format',
          line: 1
        });
        suggestions.push('Use format: type(scope): description');
        score -= 30;
      }
    }

    // Analyze subject line
    const subjectIssues = this.analyzeSubject(subject, type, scope, description);
    issues.push(...subjectIssues);
    score -= subjectIssues.length * 10;

    // Analyze body if present
    if (body) {
      const bodyIssues = this.analyzeBody(body);
      issues.push(...bodyIssues);
      score -= bodyIssues.length * 5;
    } else if (this.config.requireBody) {
      issues.push({
        type: 'content',
        severity: 'warning',
        message: 'Commit message should include a body explaining the changes'
      });
      suggestions.push('Add a body after a blank line to explain what and why');
      score -= 15;
    }

    // Generate suggestions based on issues
    this.generateSuggestions(issues, suggestions);

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
      type,
      scope,
      description
    };
  }

  /**
   * Parse conventional commit format
   */
  private parseConventionalCommit(subject: string): { type: CommitType; scope?: string; description: string } | null {
    const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?: (.+)$/;
    const match = subject.match(conventionalRegex);

    if (!match) return null;

    const [, typeStr, scope, description] = match;
    const type = Object.values(CommitType).find(t => t === typeStr.toLowerCase()) as CommitType;

    if (!type) return null;

    return { type, scope, description };
  }

  /**
   * Analyze subject line
   */
  private analyzeSubject(subject: string, type?: CommitType, scope?: string, description?: string): CommitMessageIssue[] {
    const issues: CommitMessageIssue[] = [];

    // Check length
    if (subject.trim().length === 0) {
      issues.push({
        type: 'length',
        severity: 'error',
        message: 'Commit message cannot be empty',
        line: 1
      });
      return issues;
    }

    if (subject.length > this.config.maxSubjectLength) {
      issues.push({
        type: 'length',
        severity: 'warning',
        message: `Subject line too long (${subject.length}/${this.config.maxSubjectLength} characters)`,
        line: 1
      });
    }

    // Check conventional commit components
    if (this.config.enforceConventionalCommits && type) {
      // Check allowed types
      if (!this.config.allowedTypes.includes(type)) {
        issues.push({
          type: 'format',
          severity: 'error',
          message: `Invalid commit type: ${type}. Allowed types: ${this.config.allowedTypes.join(', ')}`,
          line: 1
        });
      }

      // Check scope if required
      if (this.config.requireScope && !scope) {
        issues.push({
          type: 'format',
          severity: 'warning',
          message: 'Commit scope is required',
          line: 1
        });
      }

      // Check allowed scopes
      if (scope && this.config.allowedScopes.length > 0 && !this.config.allowedScopes.includes(scope)) {
        issues.push({
          type: 'format',
          severity: 'warning',
          message: `Invalid scope: ${scope}. Allowed scopes: ${this.config.allowedScopes.join(', ')}`,
          line: 1
        });
      }

      // Check description
      if (description) {
        this.analyzeDescription(description, issues);
      }
    } else if (!this.config.enforceConventionalCommits) {
      this.analyzeDescription(subject, issues);
    }

    return issues;
  }

  /**
   * Analyze description part
   */
  private analyzeDescription(description: string, issues: CommitMessageIssue[]): void {
    // Check case
    if (this.config.subjectCase === 'lower' && description[0] !== description[0].toLowerCase()) {
      issues.push({
        type: 'style',
        severity: 'warning',
        message: 'Description should start with lowercase letter',
        line: 1
      });
    } else if (this.config.subjectCase === 'sentence' && description[0] !== description[0].toUpperCase()) {
      issues.push({
        type: 'style',
        severity: 'warning',
        message: 'Description should start with uppercase letter',
        line: 1
      });
    }

    // Check for period at end
    if (description.endsWith('.')) {
      issues.push({
        type: 'style',
        severity: 'info',
        message: 'Description should not end with a period',
        line: 1
      });
    }

    // Check for imperative mood
    if (!this.isImperativeMood(description)) {
      issues.push({
        type: 'content',
        severity: 'warning',
        message: 'Use imperative mood (e.g., "add feature" not "added feature")',
        line: 1
      });
    }

    // Check for meaningful content
    if (this.isVagueDescription(description)) {
      issues.push({
        type: 'content',
        severity: 'warning',
        message: 'Description is too vague, be more specific about what changed',
        line: 1
      });
    }
  }

  /**
   * Analyze body content
   */
  private analyzeBody(body: string): CommitMessageIssue[] {
    const issues: CommitMessageIssue[] = [];
    const lines = body.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 3; // Account for subject and blank line

      // Check line length
      if (line.length > this.config.maxBodyLineLength) {
        issues.push({
          type: 'length',
          severity: 'warning',
          message: `Body line too long (${line.length}/${this.config.maxBodyLineLength} characters)`,
          line: lineNumber
        });
      }
    });

    // Check for meaningful content
    if (body.trim().length < 10) {
      issues.push({
        type: 'content',
        severity: 'warning',
        message: 'Body should provide more detailed explanation of changes'
      });
    }

    return issues;
  }

  /**
   * Check if description uses imperative mood
   */
  private isImperativeMood(description: string): boolean {
    const pastTenseIndicators = [
      /ed\s/, /ing\s/, /added/, /fixed/, /updated/, /changed/, /removed/, /deleted/
    ];
    
    return !pastTenseIndicators.some(pattern => pattern.test(description.toLowerCase()));
  }

  /**
   * Check if description is too vague
   */
  private isVagueDescription(description: string): boolean {
    const vagueTerms = [
      'fix', 'update', 'change', 'modify', 'improve', 'refactor', 'cleanup',
      'misc', 'various', 'stuff', 'things', 'work', 'wip'
    ];
    
    const words = description.toLowerCase().split(/\s+/);
    return words.length <= 2 || vagueTerms.some(term => words.includes(term));
  }

  /**
   * Generate helpful suggestions
   */
  private generateSuggestions(issues: CommitMessageIssue[], suggestions: string[]): void {
    const hasLengthIssues = issues.some(i => i.type === 'length');
    const hasFormatIssues = issues.some(i => i.type === 'format');
    const hasContentIssues = issues.some(i => i.type === 'content');

    if (hasLengthIssues) {
      suggestions.push('Keep subject line under 50 characters');
      suggestions.push('Use body for detailed explanations');
    }

    if (hasFormatIssues && this.config.enforceConventionalCommits) {
      suggestions.push('Follow conventional commit format: type(scope): description');
      suggestions.push(`Available types: ${this.config.allowedTypes.join(', ')}`);
    }

    if (hasContentIssues) {
      suggestions.push('Be specific about what changed and why');
      suggestions.push('Use imperative mood (add, fix, update)');
      suggestions.push('Explain the motivation behind the change');
    }
  }

  /**
   * Get commit message template
   */
  getTemplate(type?: CommitType, scope?: string): string {
    const typeStr = type || 'type';
    const scopeStr = scope ? `(${scope})` : this.config.requireScope ? '(scope)' : '';
    
    return `${typeStr}${scopeStr}: brief description

Explain what and why vs. how. Keep lines under ${this.config.maxBodyLineLength} characters.

- Detail 1
- Detail 2

Closes #issue-number`;
  }
}