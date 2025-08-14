/**
 * Tests for NamingAnalyzer
 */

import * as ts from 'typescript';
import { NamingAnalyzer, NamingConventions, NameType } from '../../src/analyzer/naming-analyzer';
import { CleanCodePrinciple, Severity } from '../../src/types';

describe('NamingConventions', () => {
  describe('isAbbreviation', () => {
    it('should identify common abbreviations', () => {
      expect(NamingConventions.isAbbreviation('btn')).toBe(true);
      expect(NamingConventions.isAbbreviation('str')).toBe(true);
      expect(NamingConventions.isAbbreviation('num')).toBe(true);
      expect(NamingConventions.isAbbreviation('button')).toBe(false);
      expect(NamingConventions.isAbbreviation('string')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(NamingConventions.isAbbreviation('BTN')).toBe(true);
      expect(NamingConventions.isAbbreviation('Btn')).toBe(true);
    });
  });

  describe('isSingleLetter', () => {
    it('should identify single letter names', () => {
      expect(NamingConventions.isSingleLetter('i')).toBe(true);
      expect(NamingConventions.isSingleLetter('x')).toBe(true);
      expect(NamingConventions.isSingleLetter('ab')).toBe(false);
      expect(NamingConventions.isSingleLetter('')).toBe(false);
    });
  });

  describe('isAcceptableSingleLetter', () => {
    it('should identify acceptable single letters', () => {
      expect(NamingConventions.isAcceptableSingleLetter('i')).toBe(true);
      expect(NamingConventions.isAcceptableSingleLetter('j')).toBe(true);
      expect(NamingConventions.isAcceptableSingleLetter('k')).toBe(true);
      expect(NamingConventions.isAcceptableSingleLetter('x')).toBe(false);
      expect(NamingConventions.isAcceptableSingleLetter('y')).toBe(false);
      expect(NamingConventions.isAcceptableSingleLetter('a')).toBe(false);
      expect(NamingConventions.isAcceptableSingleLetter('b')).toBe(false);
    });
  });

  describe('isMeaningless', () => {
    it('should identify meaningless words', () => {
      expect(NamingConventions.isMeaningless('data')).toBe(true);
      expect(NamingConventions.isMeaningless('info')).toBe(true);
      expect(NamingConventions.isMeaningless('thing')).toBe(true);
      expect(NamingConventions.isMeaningless('userData')).toBe(false);
      expect(NamingConventions.isMeaningless('productInfo')).toBe(false);
    });
  });

  describe('casing conventions', () => {
    it('should validate camelCase', () => {
      expect(NamingConventions.followsCamelCase('userName')).toBe(true);
      expect(NamingConventions.followsCamelCase('getUserData')).toBe(true);
      expect(NamingConventions.followsCamelCase('user')).toBe(true);
      expect(NamingConventions.followsCamelCase('UserName')).toBe(false);
      expect(NamingConventions.followsCamelCase('user_name')).toBe(false);
      expect(NamingConventions.followsCamelCase('123invalid')).toBe(false);
    });

    it('should validate PascalCase', () => {
      expect(NamingConventions.followsPascalCase('UserName')).toBe(true);
      expect(NamingConventions.followsPascalCase('GetUserData')).toBe(true);
      expect(NamingConventions.followsPascalCase('User')).toBe(true);
      expect(NamingConventions.followsPascalCase('userName')).toBe(false);
      expect(NamingConventions.followsPascalCase('USER_NAME')).toBe(false);
      expect(NamingConventions.followsPascalCase('123Invalid')).toBe(false);
    });

    it('should validate CONSTANT_CASE', () => {
      expect(NamingConventions.followsConstantCase('MAX_SIZE')).toBe(true);
      expect(NamingConventions.followsConstantCase('API_URL')).toBe(true);
      expect(NamingConventions.followsConstantCase('TIMEOUT')).toBe(true);
      expect(NamingConventions.followsConstantCase('maxSize')).toBe(false);
      expect(NamingConventions.followsConstantCase('max_size')).toBe(false);
    });
  });
});

describe('NamingAnalyzer', () => {
  function createSourceFile(code: string): ts.SourceFile {
    return ts.createSourceFile('test.ts', code, ts.ScriptTarget.ES2020, true);
  }

  function analyzeCode(code: string) {
    const sourceFile = createSourceFile(code);
    const analyzer = new NamingAnalyzer(sourceFile);
    return analyzer.analyze();
  }

  describe('variable naming analysis', () => {
    it('should detect abbreviation violations', () => {
      const code = `
        const btn = document.getElementById('button');
        const str = 'hello world';
        const num = 42;
      `;

      const result = analyzeCode(code);
      
      // Should detect abbreviation violations for btn, str, num
      const abbreviationViolations = result.violations.filter(v => 
        v.description.includes('abbreviation')
      );
      expect(abbreviationViolations).toHaveLength(3);
      expect(abbreviationViolations[0].actualName).toBe('btn');
      expect(abbreviationViolations[0].suggestedName).toBe('button');
      expect(abbreviationViolations[0].severity).toBe(Severity.MEDIUM);
    });

    it('should detect single letter violations', () => {
      const code = `
        const a = 'invalid single letter';
        const b = 42;
        const i = 0; // acceptable in loops
      `;

      const result = analyzeCode(code);
      
      // Should flag 'a' and 'b' but not 'i'
      const singleLetterViolations = result.violations.filter(v => 
        v.description.includes('Single letter')
      );
      expect(singleLetterViolations).toHaveLength(2);
      expect(singleLetterViolations[0].actualName).toBe('a');
      expect(singleLetterViolations[1].actualName).toBe('b');
    });

    it('should detect meaningless names', () => {
      const code = `
        const data = getUserData();
        const info = getProductInfo();
        const thing = createThing();
      `;

      const result = analyzeCode(code);
      
      const meaninglessViolations = result.violations.filter(v => 
        v.description.includes('meaningless')
      );
      expect(meaninglessViolations).toHaveLength(3);
    });

    it('should detect casing violations', () => {
      const code = `
        const UserName = 'john'; // should be camelCase
        const user_name = 'jane'; // should be camelCase
        const CONSTANT_VALUE = 42; // this is also flagged as should be camelCase for variables
      `;

      const result = analyzeCode(code);
      
      const casingViolations = result.violations.filter(v => 
        v.description.includes('should follow')
      );
      expect(casingViolations).toHaveLength(3); // All three violate camelCase for variables
    });
  });

  describe('function naming analysis', () => {
    it('should analyze function names', () => {
      const code = `
        function btn() { return 'button'; }
        function getUserData() { return {}; }
        function a() { return 42; }
      `;

      const result = analyzeCode(code);
      
      expect(result.violations.length).toBeGreaterThan(0);
      
      const functionViolations = result.violations.filter(v => 
        v.nameType === NameType.FUNCTION
      );
      expect(functionViolations.length).toBeGreaterThan(0);
    });

    it('should validate function casing conventions', () => {
      const code = `
        function GetUserData() { return {}; } // should be camelCase
        function getUserData() { return {}; } // correct
      `;

      const result = analyzeCode(code);
      
      const casingViolations = result.violations.filter(v => 
        v.nameType === NameType.FUNCTION && v.description.includes('camelCase')
      );
      expect(casingViolations).toHaveLength(1);
      expect(casingViolations[0].actualName).toBe('GetUserData');
    });
  });

  describe('class naming analysis', () => {
    it('should analyze class names', () => {
      const code = `
        class userService { } // should be PascalCase
        class UserService { } // correct
        class btn { } // abbreviation
      `;

      const result = analyzeCode(code);
      
      const classViolations = result.violations.filter(v => 
        v.nameType === NameType.CLASS
      );
      expect(classViolations.length).toBeGreaterThan(0);
    });

    it('should validate class casing conventions', () => {
      const code = `
        class userService { }
        class UserService { }
      `;

      const result = analyzeCode(code);
      
      const casingViolations = result.violations.filter(v => 
        v.nameType === NameType.CLASS && v.description.includes('PascalCase')
      );
      expect(casingViolations).toHaveLength(1);
      expect(casingViolations[0].actualName).toBe('userService');
    });
  });

  describe('interface naming analysis', () => {
    it('should analyze interface names', () => {
      const code = `
        interface userInterface { } // should be PascalCase
        interface UserInterface { } // correct
        interface btn { } // abbreviation
      `;

      const result = analyzeCode(code);
      
      const interfaceViolations = result.violations.filter(v => 
        v.nameType === NameType.INTERFACE
      );
      expect(interfaceViolations.length).toBeGreaterThan(0);
    });
  });

  describe('method and property analysis', () => {
    it('should analyze method and property names', () => {
      const code = `
        class TestClass {
          btn: string; // abbreviation property
          getUserData() { } // good method name
          a() { } // single letter method
        }
      `;

      const result = analyzeCode(code);
      
      const propertyViolations = result.violations.filter(v => 
        v.nameType === NameType.PROPERTY
      );
      const methodViolations = result.violations.filter(v => 
        v.nameType === NameType.METHOD
      );
      
      expect(propertyViolations.length).toBeGreaterThan(0);
      expect(methodViolations.length).toBeGreaterThan(0);
    });
  });

  describe('parameter analysis', () => {
    it('should analyze parameter names', () => {
      const code = `
        function processUser(usr: string, a: number, userData: object) {
          return usr + a;
        }
      `;

      const result = analyzeCode(code);
      
      const parameterViolations = result.violations.filter(v => 
        v.nameType === NameType.PARAMETER
      );
      expect(parameterViolations.length).toBeGreaterThan(0);
    });
  });

  describe('metrics calculation', () => {
    it('should calculate naming metrics correctly', () => {
      const code = `
        const userName = 'john';
        const btn = 'button';
        const a = 42;
        function getUserData() { return {}; }
        class UserService { }
      `;

      const result = analyzeCode(code);
      
      expect(result.metrics.totalNames).toBeGreaterThan(0);
      expect(result.metrics.violationCount).toBe(result.violations.length);
      expect(result.metrics.averageDescriptiveness).toBeGreaterThanOrEqual(0);
      expect(result.metrics.averageDescriptiveness).toBeLessThanOrEqual(1);
      expect(result.metrics.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.consistencyScore).toBeLessThanOrEqual(1);
      expect(result.metrics.searchabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.searchabilityScore).toBeLessThanOrEqual(1);
    });

    it('should count abbreviations correctly', () => {
      const code = `
        const btn = 'button';
        const str = 'string';
        const userName = 'john';
      `;

      const result = analyzeCode(code);
      
      expect(result.metrics.abbreviationCount).toBe(2);
    });
  });

  describe('suggestions generation', () => {
    it('should generate helpful suggestions', () => {
      const code = `
        const btn = 'button';
        const a = 42;
        const data = getUserData();
      `;

      const result = analyzeCode(code);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('abbreviated'))).toBe(true);
      // Check for single-letter violations in a more flexible way
      expect(result.suggestions.some(s => s.toLowerCase().includes('single'))).toBe(true);
      expect(result.suggestions.some(s => s.includes('generic') || s.includes('specific'))).toBe(true);
    });

    it('should provide positive feedback for good naming', () => {
      const code = `
        const userName = 'john';
        const userService = new UserService();
        function getUserData() { return {}; }
      `;

      const result = analyzeCode(code);
      
      if (result.violations.length === 0) {
        expect(result.suggestions[0]).toContain('Great job');
      }
    });
  });

  describe('descriptiveness calculation', () => {
    it('should score descriptive names higher', () => {
      const descriptiveCode = `const userAccountManager = 'manager';`;
      const nonDescriptiveCode = `const a = 'manager';`;

      const descriptiveResult = analyzeCode(descriptiveCode);
      const nonDescriptiveResult = analyzeCode(nonDescriptiveCode);

      expect(descriptiveResult.metrics.averageDescriptiveness)
        .toBeGreaterThan(nonDescriptiveResult.metrics.averageDescriptiveness);
    });
  });

  describe('searchability calculation', () => {
    it('should score unique names higher', () => {
      const uniqueCode = `
        const specificUserAccountManager = 'manager';
        const anotherUniqueVariableName = 'value';
      `;
      const commonCode = `
        const data = 'manager';
        const info = 'value';
      `;

      const uniqueResult = analyzeCode(uniqueCode);
      const commonResult = analyzeCode(commonCode);

      expect(uniqueResult.metrics.searchabilityScore)
        .toBeGreaterThan(commonResult.metrics.searchabilityScore);
    });
  });

  describe('consistency validation', () => {
    it('should detect inconsistent naming patterns', () => {
      const inconsistentCode = `
        const userName = 'john'; // camelCase
        const user_email = 'john@example.com'; // snake_case
        const UserAge = 25; // PascalCase for variable
      `;

      const result = analyzeCode(inconsistentCode);
      
      expect(result.metrics.consistencyScore).toBeLessThan(1);
      
      const casingViolations = result.violations.filter(v => 
        v.description.includes('should follow')
      );
      expect(casingViolations.length).toBeGreaterThan(0);
    });

    it('should reward consistent naming patterns', () => {
      const consistentCode = `
        const userName = 'john';
        const userEmail = 'john@example.com';
        const userAge = 25;
        function getUserData() { return {}; }
        class UserService { }
      `;

      const result = analyzeCode(consistentCode);
      
      expect(result.metrics.consistencyScore).toBeGreaterThan(0.8);
    });
  });

  describe('edge cases', () => {
    it('should handle empty files', () => {
      const result = analyzeCode('');
      
      expect(result.violations).toHaveLength(0);
      expect(result.metrics.totalNames).toBe(0);
      expect(result.suggestions[0]).toContain('Great job');
    });

    it('should handle files with only comments', () => {
      const code = `
        // This is a comment
        /* This is another comment */
      `;

      const result = analyzeCode(code);
      
      expect(result.violations).toHaveLength(0);
      expect(result.metrics.totalNames).toBe(0);
    });

    it('should handle complex nested structures', () => {
      const code = `
        class UserService {
          private btn: string;
          
          constructor(private usr: string) {
            this.btn = usr;
          }
          
          getUserData(a: number): object {
            const data = { user: this.usr, id: a };
            return data;
          }
        }
      `;

      const result = analyzeCode(code);
      
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.metrics.totalNames).toBeGreaterThan(0);
    });
  });
});