/**
 * Tests for file utility functions
 */

import { isCodeFile, countLines } from '../../src/utils/file-utils';

describe('File Utils', () => {
  describe('isCodeFile', () => {
    it('should identify TypeScript files', () => {
      expect(isCodeFile('test.ts')).toBe(true);
      expect(isCodeFile('component.tsx')).toBe(true);
    });

    it('should identify JavaScript files', () => {
      expect(isCodeFile('script.js')).toBe(true);
      expect(isCodeFile('component.jsx')).toBe(true);
    });

    it('should reject non-code files', () => {
      expect(isCodeFile('readme.md')).toBe(false);
      expect(isCodeFile('config.json')).toBe(false);
      expect(isCodeFile('styles.css')).toBe(false);
    });

    it('should handle file paths with directories', () => {
      expect(isCodeFile('src/components/Button.tsx')).toBe(true);
      expect(isCodeFile('/absolute/path/to/file.ts')).toBe(true);
    });
  });

  describe('countLines', () => {
    it('should count lines correctly', () => {
      const content = 'line 1\nline 2\nline 3';
      expect(countLines(content)).toBe(3);
    });

    it('should handle empty content', () => {
      expect(countLines('')).toBe(1);
    });

    it('should handle single line', () => {
      expect(countLines('single line')).toBe(1);
    });

    it('should handle content with trailing newline', () => {
      const content = 'line 1\nline 2\n';
      expect(countLines(content)).toBe(3);
    });
  });
});