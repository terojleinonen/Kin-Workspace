/**
 * Tests for complexity calculation utilities
 */

import { 
  calculateComplexity, 
  estimateCyclomaticComplexity, 
  calculateNestingDepth,
  calculateASTComplexity,
  calculateCognitiveComplexity,
  calculateFunctionSize,
  calculateNestingDepthFromAST
} from '../../src/utils/complexity-calculator';

describe('Complexity Calculator', () => {
  describe('calculateComplexity', () => {
    it('should calculate basic metrics for simple code', () => {
      const code = `function test() {
  return true;
}`;
      const metrics = calculateComplexity(code, 'test.ts');
      
      expect(metrics.lineCount).toBe(3);
      expect(metrics.cyclomaticComplexity).toBe(1);
      expect(metrics.cognitiveComplexity).toBe(0);
    });

    it('should handle empty code', () => {
      const metrics = calculateComplexity('', 'test.ts');
      expect(metrics.lineCount).toBe(0);
    });

    it('should calculate metrics for code with complexity', () => {
      const code = `function test() {
  if (condition) {
    return true;
  }
  return false;
}`;
      const metrics = calculateComplexity(code, 'test.ts');
      expect(metrics.lineCount).toBe(6);
      expect(metrics.cyclomaticComplexity).toBe(2); // 1 base + 1 if
      expect(metrics.cognitiveComplexity).toBe(1); // 1 for if statement
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

  describe('calculateASTComplexity', () => {
    it('should calculate cyclomatic complexity from AST', () => {
      const code = `function test(a, b) {
  if (a > 0) {
    return a + b;
  } else if (b > 0) {
    return b;
  }
  return 0;
}`;
      const metrics = calculateASTComplexity(code, 'test.ts');
      expect(metrics.cyclomaticComplexity).toBe(3); // 1 base + 2 decision points
      expect(metrics.parameterCount).toBe(2);
    });

    it('should calculate cognitive complexity with nesting penalties', () => {
      const code = `function complex() {
  if (condition1) {          // +1
    for (let i = 0; i < 10; i++) {  // +2 (nested)
      if (condition2) {      // +3 (double nested)
        return true;
      }
    }
  }
  return false;
}`;
      const metrics = calculateASTComplexity(code, 'test.ts');
      expect(metrics.cognitiveComplexity).toBeGreaterThan(metrics.cyclomaticComplexity);
    });

    it('should handle logical operators correctly', () => {
      const code = `function test() {
  if (a && b || c && d) {
    return true;
  }
  return false;
}`;
      const metrics = calculateASTComplexity(code, 'test.ts');
      expect(metrics.cyclomaticComplexity).toBe(5); // 1 base + 1 if + 3 logical operators (&&, ||, &&)
    });

    it('should calculate nesting depth from AST', () => {
      const code = `function test() {
  if (condition) {
    try {
      for (let item of items) {
        if (item.valid) {
          return item;
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}`;
      const metrics = calculateASTComplexity(code, 'test.ts');
      expect(metrics.nestingDepth).toBe(4); // if -> try -> for -> if
    });

    it('should handle arrow functions', () => {
      const code = `const test = (a, b, c) => {
  if (a > b) {
    return a + c;
  }
  return b + c;
};`;
      const metrics = calculateASTComplexity(code, 'test.ts');
      expect(metrics.parameterCount).toBe(3);
      expect(metrics.cyclomaticComplexity).toBe(2);
    });

    it('should handle async functions', () => {
      const code = `async function fetchData(url, options) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error('Network error');
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}`;
      const metrics = calculateASTComplexity(code, 'test.ts');
      expect(metrics.parameterCount).toBe(2);
      expect(metrics.cyclomaticComplexity).toBe(3); // 1 base + 1 if + 1 catch
    });

    it('should handle switch statements', () => {
      const code = `function handleAction(action) {
  switch (action.type) {
    case 'ADD':
      return state + 1;
    case 'SUBTRACT':
      return state - 1;
    case 'MULTIPLY':
      if (action.value) {
        return state * action.value;
      }
      return state;
    default:
      return state;
  }
}`;
      const metrics = calculateASTComplexity(code, 'test.ts');
      expect(metrics.cyclomaticComplexity).toBe(5); // 1 base + 3 cases + 1 if
    });
  });

  describe('calculateCognitiveComplexity', () => {
    it('should apply nesting penalties correctly', () => {
      const code = `function nested() {
  if (level1) {           // +1
    if (level2) {         // +2 (nested)
      if (level3) {       // +3 (double nested)
        return true;
      }
    }
  }
}`;
      const complexity = calculateCognitiveComplexity(code, 'test.ts');
      expect(complexity).toBe(6); // 1 + 2 + 3
    });

    it('should handle loops with nesting', () => {
      const code = `function loops() {
  for (let i = 0; i < 10; i++) {    // +1
    while (condition) {             // +2 (nested)
      if (check) {                  // +3 (double nested)
        break;
      }
    }
  }
}`;
      const complexity = calculateCognitiveComplexity(code, 'test.ts');
      expect(complexity).toBe(6); // 1 + 2 + 3
    });
  });

  describe('calculateFunctionSize', () => {
    it('should count function lines accurately', () => {
      const code = `function test() {
  const a = 1;
  const b = 2;
  
  return a + b;
}`;
      const size = calculateFunctionSize(code, 'test.ts');
      expect(size.lineCount).toBe(6);
      expect(size.parameterCount).toBe(0);
    });

    it('should count parameters correctly', () => {
      const code = `function test(a, b, c, options = {}) {
  return a + b + c;
}`;
      const size = calculateFunctionSize(code, 'test.ts');
      expect(size.parameterCount).toBe(4);
    });
  });

  describe('calculateNestingDepthFromAST', () => {
    it('should calculate maximum nesting depth', () => {
      const code = `function test() {
  if (a) {
    for (let i = 0; i < 10; i++) {
      try {
        if (b) {
          return true;
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
}`;
      const depth = calculateNestingDepthFromAST(code, 'test.ts');
      expect(depth).toBe(4); // if -> for -> try -> if
    });

    it('should handle different control structures', () => {
      const code = `function test() {
  switch (type) {
    case 'A':
      if (condition) {
        while (loop) {
          return true;
        }
      }
      break;
  }
}`;
      const depth = calculateNestingDepthFromAST(code, 'test.ts');
      expect(depth).toBe(3); // switch -> if -> while
    });
  });
});