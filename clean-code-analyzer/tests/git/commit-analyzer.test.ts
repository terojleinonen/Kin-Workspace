/**
 * Tests for commit message analyzer
 */

import { CommitMessageAnalyzer, CommitType, DEFAULT_COMMIT_CONFIG } from '../../src/git/commit-analyzer';

describe('CommitMessageAnalyzer', () => {
  let analyzer: CommitMessageAnalyzer;

  beforeEach(() => {
    analyzer = new CommitMessageAnalyzer();
  });

  describe('analyzeMessage', () => {
    it('should analyze valid conventional commit', () => {
      const message = 'feat(auth): add user authentication system';
      const analysis = analyzer.analyzeMessage(message);

      expect(analysis.score).toBeGreaterThan(80);
      expect(analysis.type).toBe(CommitType.FEAT);
      expect(analysis.scope).toBe('auth');
      expect(analysis.description).toBe('add user authentication system');
      expect(analysis.issues).toHaveLength(0);
    });

    it('should detect non-conventional commit format', () => {
      const message = 'Add user authentication';
      const analysis = analyzer.analyzeMessage(message);

      expect(analysis.score).toBeLessThan(80);
      expect(analysis.issues.some(i => i.type === 'format')).toBe(true);
      expect(analysis.suggestions).toContain('Use format: type(scope): description');
    });

    it('should detect subject line too long', () => {
      const longMessage = 'feat: ' + 'a'.repeat(60);
      const analysis = analyzer.analyzeMessage(longMessage);

      expect(analysis.issues.some(i => i.type === 'length')).toBe(true);
    });

    it('should detect empty commit message', () => {
      const analysis = analyzer.analyzeMessage('');

      expect(analysis.score).toBe(0);
      expect(analysis.issues.some(i => i.message.includes('empty'))).toBe(true);
    });

    it('should detect period at end of subject', () => {
      const message = 'feat: add new feature.';
      const analysis = analyzer.analyzeMessage(message);

      expect(analysis.issues.some(i => i.message.includes('period'))).toBe(true);
    });

    it('should detect non-imperative mood', () => {
      const message = 'feat: added new feature';
      const analysis = analyzer.analyzeMessage(message);

      expect(analysis.issues.some(i => i.message.includes('imperative'))).toBe(true);
    });

    it('should detect vague descriptions', () => {
      const message = 'fix: fix';
      const analysis = analyzer.analyzeMessage(message);

      expect(analysis.issues.some(i => i.message.includes('vague'))).toBe(true);
    });

    it('should analyze commit with body', () => {
      const message = `feat(auth): add user authentication

This commit implements a complete user authentication system
with login, logout, and session management capabilities.

- Add login form component
- Implement JWT token handling
- Add session persistence`;

      const analysis = analyzer.analyzeMessage(message);

      expect(analysis.score).toBeGreaterThan(90);
      expect(analysis.issues).toHaveLength(0);
    });

    it('should detect body line too long', () => {
      const message = `feat: add feature

${'a'.repeat(80)}`;

      const analysis = analyzer.analyzeMessage(message);

      expect(analysis.issues.some(i => i.type === 'length' && i.line && i.line > 2)).toBe(true);
    });
  });

  describe('configuration options', () => {
    it('should respect custom max subject length', () => {
      const customAnalyzer = new CommitMessageAnalyzer({ maxSubjectLength: 30 });
      const message = 'feat: this is a longer subject line';
      const analysis = customAnalyzer.analyzeMessage(message);

      expect(analysis.issues.some(i => i.type === 'length')).toBe(true);
    });

    it('should allow disabling conventional commits', () => {
      const customAnalyzer = new CommitMessageAnalyzer({ enforceConventionalCommits: false });
      const message = 'Add user authentication';
      const analysis = customAnalyzer.analyzeMessage(message);

      expect(analysis.issues.some(i => i.type === 'format')).toBe(false);
    });

    it('should respect allowed types', () => {
      const customAnalyzer = new CommitMessageAnalyzer({ 
        allowedTypes: [CommitType.FEAT, CommitType.FIX] 
      });
      const message = 'docs: update readme';
      const analysis = customAnalyzer.analyzeMessage(message);

      expect(analysis.issues.some(i => i.message.includes('Invalid commit type'))).toBe(true);
    });

    it('should require scope when configured', () => {
      const customAnalyzer = new CommitMessageAnalyzer({ requireScope: true });
      const message = 'feat: add new feature';
      const analysis = customAnalyzer.analyzeMessage(message);

      expect(analysis.issues.some(i => i.message.includes('scope is required'))).toBe(true);
    });

    it('should validate allowed scopes', () => {
      const customAnalyzer = new CommitMessageAnalyzer({ 
        allowedScopes: ['auth', 'ui'] 
      });
      const message = 'feat(database): add new table';
      const analysis = customAnalyzer.analyzeMessage(message);

      expect(analysis.issues.some(i => i.message.includes('Invalid scope'))).toBe(true);
    });

    it('should respect subject case requirements', () => {
      const customAnalyzer = new CommitMessageAnalyzer({ subjectCase: 'sentence' });
      const message = 'feat: add new feature';
      const analysis = customAnalyzer.analyzeMessage(message);

      expect(analysis.issues.some(i => i.message.includes('uppercase'))).toBe(true);
    });
  });

  describe('getTemplate', () => {
    it('should generate basic template', () => {
      const template = analyzer.getTemplate();
      
      expect(template).toContain('type: brief description');
      expect(template).toContain('Explain what and why');
      expect(template).toContain('Closes #issue-number');
    });

    it('should generate template with specific type and scope', () => {
      const template = analyzer.getTemplate(CommitType.FEAT, 'auth');
      
      expect(template).toContain('feat(auth): brief description');
    });

    it('should include scope placeholder when required', () => {
      const customAnalyzer = new CommitMessageAnalyzer({ requireScope: true });
      const template = customAnalyzer.getTemplate();
      
      expect(template).toContain('type(scope): brief description');
    });
  });

  describe('edge cases', () => {
    it('should handle multiline subjects gracefully', () => {
      const message = `feat: first line
second line`;
      const analysis = analyzer.analyzeMessage(message);

      expect(analysis.score).toBeGreaterThan(0);
      expect(analysis.description).toBe('first line');
    });

    it('should handle messages with only whitespace', () => {
      const message = '   \n\n   ';
      const analysis = analyzer.analyzeMessage(message);

      expect(analysis.score).toBe(0);
      expect(analysis.issues.some(i => i.message.includes('empty'))).toBe(true);
    });

    it('should handle special characters in commit message', () => {
      const message = 'feat: add special chars !@#$%^&*()';
      const analysis = analyzer.analyzeMessage(message);

      expect(analysis.score).toBeGreaterThan(70);
    });
  });
});