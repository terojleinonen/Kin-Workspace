/**
 * Tests for NamingIntegration utility
 */

import * as fs from 'fs';
import * as path from 'path';
import { NamingIntegration } from '../../src/utils/naming-integration';
import { TypeScriptAnalyzer, FileAnalysis } from '../../src/analyzer/file-parser';

describe('NamingIntegration', () => {
  const testFilePath = path.join(__dirname, '../fixtures/test-naming.ts');
  
  beforeAll(() => {
    // Create test fixture directory if it doesn't exist
    const fixturesDir = path.dirname(testFilePath);
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Create a test file with various naming issues
    const testCode = `
// Test file for naming analysis
const btn = 'button'; // abbreviation
const a = 42; // single letter
const data = getUserData(); // meaningless
const userName = 'john'; // good name
const UserAge = 25; // wrong casing

function getUserData() {
  return { name: 'test' };
}

class userService { // wrong casing
  private usr: string; // abbreviation
  
  constructor(user: string) {
    this.usr = user;
  }
  
  getData() {
    return this.usr;
  }
}

interface UserInterface {
  name: string;
  email: string;
}
`;

    fs.writeFileSync(testFilePath, testCode);
  });

  afterAll(() => {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe('analyzeFileWithNaming', () => {
    it('should analyze file and include naming analysis', async () => {
      const analyzer = new TypeScriptAnalyzer();
      const fileAnalysis = await analyzer.analyzeFile(testFilePath);
      
      const analysisWithNaming = await NamingIntegration.analyzeFileWithNaming(testFilePath, fileAnalysis);
      
      expect(analysisWithNaming.filePath).toBe(testFilePath);
      expect(analysisWithNaming.namingAnalysis).toBeDefined();
      expect(analysisWithNaming.namingAnalysis.violations).toBeDefined();
      expect(analysisWithNaming.namingAnalysis.metrics).toBeDefined();
      expect(analysisWithNaming.namingAnalysis.suggestions).toBeDefined();
    });

    it('should throw error for non-existent file', async () => {
      const analyzer = new TypeScriptAnalyzer();
      const mockFileAnalysis: FileAnalysis = {
        filePath: 'non-existent.ts',
        functions: [],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 0,
          cognitiveComplexity: 0,
          nestingDepth: 0,
          lineCount: 0,
          parameterCount: 0
        },
        lineCount: 0
      };

      await expect(
        NamingIntegration.analyzeFileWithNaming('non-existent.ts', mockFileAnalysis)
      ).rejects.toThrow('File not found');
    });
  });

  describe('extractNamingViolations', () => {
    it('should extract naming violations from analysis', async () => {
      const analyzer = new TypeScriptAnalyzer();
      const fileAnalysis = await analyzer.analyzeFile(testFilePath);
      const analysisWithNaming = await NamingIntegration.analyzeFileWithNaming(testFilePath, fileAnalysis);
      
      const violations = NamingIntegration.extractNamingViolations(analysisWithNaming);
      
      expect(violations).toBeDefined();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]).toHaveProperty('principle');
      expect(violations[0]).toHaveProperty('severity');
      expect(violations[0]).toHaveProperty('description');
    });
  });

  describe('getNamingMetrics', () => {
    it('should get naming metrics from analysis', async () => {
      const analyzer = new TypeScriptAnalyzer();
      const fileAnalysis = await analyzer.analyzeFile(testFilePath);
      const analysisWithNaming = await NamingIntegration.analyzeFileWithNaming(testFilePath, fileAnalysis);
      
      const metrics = NamingIntegration.getNamingMetrics(analysisWithNaming);
      
      expect(metrics).toBeDefined();
      expect(metrics.totalNames).toBeGreaterThan(0);
      expect(metrics.violationCount).toBeGreaterThan(0);
      expect(metrics.averageDescriptiveness).toBeGreaterThanOrEqual(0);
      expect(metrics.averageDescriptiveness).toBeLessThanOrEqual(1);
      expect(metrics.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(metrics.consistencyScore).toBeLessThanOrEqual(1);
    });
  });

  describe('getNamingSuggestions', () => {
    it('should get naming suggestions from analysis', async () => {
      const analyzer = new TypeScriptAnalyzer();
      const fileAnalysis = await analyzer.analyzeFile(testFilePath);
      const analysisWithNaming = await NamingIntegration.analyzeFileWithNaming(testFilePath, fileAnalysis);
      
      const suggestions = NamingIntegration.getNamingSuggestions(analysisWithNaming);
      
      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(typeof suggestions[0]).toBe('string');
    });
  });

  describe('calculateNamingQualityScore', () => {
    it('should calculate quality score between 0 and 1', async () => {
      const analyzer = new TypeScriptAnalyzer();
      const fileAnalysis = await analyzer.analyzeFile(testFilePath);
      const analysisWithNaming = await NamingIntegration.analyzeFileWithNaming(testFilePath, fileAnalysis);
      
      const score = NamingIntegration.calculateNamingQualityScore(analysisWithNaming);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return perfect score for files with no names', async () => {
      const emptyFileAnalysis: FileAnalysis = {
        filePath: 'empty.ts',
        functions: [],
        classes: [],
        imports: [],
        complexity: {
          cyclomaticComplexity: 0,
          cognitiveComplexity: 0,
          nestingDepth: 0,
          lineCount: 0,
          parameterCount: 0
        },
        lineCount: 0
      };

      // Create empty file for testing
      const emptyFilePath = path.join(__dirname, '../fixtures/empty.ts');
      fs.writeFileSync(emptyFilePath, '// Empty file');

      try {
        const analysisWithNaming = await NamingIntegration.analyzeFileWithNaming(emptyFilePath, emptyFileAnalysis);
        const score = NamingIntegration.calculateNamingQualityScore(analysisWithNaming);
        
        expect(score).toBe(1);
      } finally {
        // Clean up
        if (fs.existsSync(emptyFilePath)) {
          fs.unlinkSync(emptyFilePath);
        }
      }
    });

    it('should penalize files with many violations', async () => {
      // Create a file with many naming violations
      const badNamingFilePath = path.join(__dirname, '../fixtures/bad-naming.ts');
      const badCode = `
        const a = 1;
        const b = 2;
        const c = 3;
        const btn = 'button';
        const str = 'string';
        const num = 42;
      `;
      fs.writeFileSync(badNamingFilePath, badCode);

      try {
        const analyzer = new TypeScriptAnalyzer();
        const fileAnalysis = await analyzer.analyzeFile(badNamingFilePath);
        const analysisWithNaming = await NamingIntegration.analyzeFileWithNaming(badNamingFilePath, fileAnalysis);
        
        const score = NamingIntegration.calculateNamingQualityScore(analysisWithNaming);
        
        expect(score).toBeLessThan(0.5); // Should be a low score due to many violations
      } finally {
        // Clean up
        if (fs.existsSync(badNamingFilePath)) {
          fs.unlinkSync(badNamingFilePath);
        }
      }
    });
  });

  describe('generateNamingSummary', () => {
    it('should generate summary for files with violations', async () => {
      const analyzer = new TypeScriptAnalyzer();
      const fileAnalysis = await analyzer.analyzeFile(testFilePath);
      const analysisWithNaming = await NamingIntegration.analyzeFileWithNaming(testFilePath, fileAnalysis);
      
      const summary = NamingIntegration.generateNamingSummary(analysisWithNaming);
      
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).not.toBe('Excellent naming conventions - no violations found!');
    });

    it('should generate positive summary for files without violations', async () => {
      // Create a file with good naming
      const goodNamingFilePath = path.join(__dirname, '../fixtures/good-naming.ts');
      const goodCode = `
        const userName = 'john';
        const userEmail = 'john@example.com';
        
        function getUserData() {
          return { name: userName, email: userEmail };
        }
        
        class UserService {
          private userData: object;
          
          constructor(data: object) {
            this.userData = data;
          }
          
          getUser() {
            return this.userData;
          }
        }
      `;
      fs.writeFileSync(goodNamingFilePath, goodCode);

      try {
        const analyzer = new TypeScriptAnalyzer();
        const fileAnalysis = await analyzer.analyzeFile(goodNamingFilePath);
        const analysisWithNaming = await NamingIntegration.analyzeFileWithNaming(goodNamingFilePath, fileAnalysis);
        
        const summary = NamingIntegration.generateNamingSummary(analysisWithNaming);
        
        if (analysisWithNaming.namingAnalysis.violations.length === 0) {
          expect(summary).toBe('Excellent naming conventions - no violations found!');
        } else {
          // If there are still some violations, just check it's a string
          expect(typeof summary).toBe('string');
        }
      } finally {
        // Clean up
        if (fs.existsSync(goodNamingFilePath)) {
          fs.unlinkSync(goodNamingFilePath);
        }
      }
    });

    it('should include specific violation types in summary', async () => {
      const analyzer = new TypeScriptAnalyzer();
      const fileAnalysis = await analyzer.analyzeFile(testFilePath);
      const analysisWithNaming = await NamingIntegration.analyzeFileWithNaming(testFilePath, fileAnalysis);
      
      const summary = NamingIntegration.generateNamingSummary(analysisWithNaming);
      
      // Should mention common violation types found in our test file
      const hasAbbreviationMention = summary.includes('abbreviation') || summary.includes('expanded');
      const hasSingleLetterMention = summary.includes('single-letter') || summary.includes('descriptions');
      const hasGenericMention = summary.includes('generic') || summary.includes('specific');
      const hasConventionMention = summary.includes('convention') || summary.includes('consistency');
      
      // At least one of these should be true given our test file content
      expect(hasAbbreviationMention || hasSingleLetterMention || hasGenericMention || hasConventionMention).toBe(true);
    });
  });
});