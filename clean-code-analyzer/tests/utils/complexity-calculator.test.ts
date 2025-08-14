/**
 * Tests for complexity calculation utilities
 */

import { 
  calculateComplexity, 
  estimateCyclomaticComplexity, 
  calculateNestingDepth 
} from '../../src/utils/complexity-calculator';

describe('Complexity Calculator', () => {
  describe('calculateComplexity', () => {
    it('should calculate basic metrics for simple code', () => {
      const code = `function test() {
  return true;
}`;
      const metrics = calculateComplexity(code);
      
      expect(metrics.lineCount).toBe(3);
      expect(metrics.cyclomaticComplexity).toBe(1);
      expect(metrics.cognitiveComplexity).toBe(1);
    });

    it('should handle empty code', () => {
      const metrics = calculateComplexity('');
      expect(metrics.lineCount).toBe(0);
    });

    it('should ignore empty lines', () => {
      const code = `function test() {

  return true;

}`;
      const metrics = calculateComplexity(code);
      expect(metrics.lineCount).toBe(3);
    });
  });

  describe('estimateCyclomaticComplexity', () => {
    it('should return 1 for simple function', () => {
      const code = 'function simple() { return true; }';
      expect(estimateCyclomaticComplexity(code)).toBe(1);
    });

    it('should count if statements', () => {
      const code = `
        if (condition) {
          return true;
        }
        if (another) {
          return false;
        }
      `;
      expect(estimateCyclomaticComplexity(code)).toBe(3); // 1 base + 2 if statements
    });

    it('should count logical operators', () => {
      const code = 'if (a && b || c) { return true; }';
      expect(estimateCyclomaticComplexity(code)).toBe(4); // 1 base + 1 if + 1 && + 1 ||
    });

    it('should count loops', () => {
      const code = `
        for (let i = 0; i < 10; i++) {
          while (condition) {
            break;
          }
        }
      `;
      expect(estimateCyclomaticComplexity(code)).toBe(3); // 1 base + 1 for + 1 while
    });
  });

  describe('calculateNestingDepth', () => {
    it('should return 0 for flat code', () => {
      const code = `function test() {
return true;
}`;
      expect(calculateNestingDepth(code)).toBe(0);
    });

    it('should calculate depth correctly', () => {
      const code = `function test() {
  if (condition) {
    for (let i = 0; i < 10; i++) {
      if (nested) {
        return true;
      }
    }
  }
}`;
      expect(calculateNestingDepth(code)).toBe(4); // function(1) + if(2) + for(3) + if(4)
    });

    it('should handle mixed indentation', () => {
      const code = `function test() {
  const a = 1;
    const b = 2;
      const c = 3;
}`;
      expect(calculateNestingDepth(code)).toBe(3);
    });
  });
});