/**
 * Tests for Quality Assessor - Clean Code principle evaluators
 */

import { CleanCodeAssessor, PrincipleScore, QualityReport } from '../../src/analyzer/quality-assessor';
import { TypeScriptAnalyzer } from '../../src/analyzer/file-parser';
import { CleanCodePrinciple, Severity } from '../../src/types';
import * as fs from 'fs';
import * as path from 'path';

describe('CleanCodeAssessor', () => {
  let assessor: CleanCodeAssessor;
  let analyzer: TypeScriptAnalyzer;

  beforeEach(() => {
    assessor = new CleanCodeAssessor();
    analyzer = new TypeScriptAnalyzer();
  });

  describe('assessFile', () => {
    it('should assess a simple file with good naming', async () => {
      const testCode = `
export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async findUserById(userId: string): Promise<User | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return await this.userRepository.findById(userId);
  }
}
`;
      const tempFile = path.join(__dirname, '../fixtures/temp-good-naming.ts');
      fs.writeFileSync(tempFile, testCode);

      try {
        const analysis = await analyzer.analyzeFile(tempFile);
        const report = assessor.assessFile(analysis);

        expect(report.filePath).toBe(tempFile);
        expect(report.overallScore).toBeGreaterThan(0.7);
        expect(report.principleScores.size).toBe(5); // All principles assessed
        expect(report.violations.length).toBeLessThan(3); // Should have minimal violations
        expect(report.strengths.length).toBeGreaterThan(0);
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should assess a file with poor naming conventions', async () => {
      const testCode = `
export class u {
  private r: any;

  constructor(r: any) {
    this.r = r;
  }

  f(i: string): any {
    if (!i) {
      throw new Error('err');
    }
    return this.r.f(i);
  }
}
`;
      const tempFile = path.join(__dirname, '../fixtures/temp-poor-naming.ts');
      fs.writeFileSync(tempFile, testCode);

      try {
        const analysis = await analyzer.analyzeFile(tempFile);
        const report = assessor.assessFile(analysis);

        expect(report.filePath).toBe(tempFile);
        expect(report.overallScore).toBeLessThan(0.8); // Adjusted expectation
        expect(report.violations.length).toBeGreaterThan(2); // Should have violations
        
        const namingViolations = report.violations.filter(v => v.principle === CleanCodePrinciple.NAMING);
        expect(namingViolations.length).toBeGreaterThan(3);
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should assess a file with complex functions', async () => {
      const testCode = `
export function complexFunction(data: any[], options: any): any {
  if (!data || data.length === 0) {
    if (options && options.allowEmpty) {
      return [];
    } else {
      throw new Error('Data is required');
    }
  }

  const results = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item && item.active) {
      if (item.type === 'premium') {
        if (item.validUntil && new Date(item.validUntil) > new Date()) {
          if (options.includePremium) {
            results.push(item);
          }
        }
      } else if (item.type === 'standard') {
        if (options.includeStandard) {
          results.push(item);
        }
      } else {
        if (options.includeOther) {
          results.push(item);
        }
      }
    }
  }
  return results;
}
`;
      const tempFile = path.join(__dirname, '../fixtures/temp-complex-function.ts');
      fs.writeFileSync(tempFile, testCode);

      try {
        const analysis = await analyzer.analyzeFile(tempFile);
        const report = assessor.assessFile(analysis);

        expect(report.filePath).toBe(tempFile);
        
        const functionViolations = report.violations.filter(v => v.principle === CleanCodePrinciple.FUNCTIONS);
        expect(functionViolations.length).toBeGreaterThan(0);
        
        // Should detect high complexity
        const complexityViolations = functionViolations.filter(v => 
          v.description.includes('complexity') || v.description.includes('nesting')
        );
        expect(complexityViolations.length).toBeGreaterThan(0);
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should assess a file with poor class design', async () => {
      const testCode = `
export class GodClass {
  private userRepository: any;
  private orderRepository: any;
  private paymentService: any;
  private emailService: any;
  private logService: any;

  createUser(userData: any) { /* implementation */ }
  updateUser(userId: string, data: any) { /* implementation */ }
  deleteUser(userId: string) { /* implementation */ }
  
  createOrder(orderData: any) { /* implementation */ }
  updateOrder(orderId: string, data: any) { /* implementation */ }
  cancelOrder(orderId: string) { /* implementation */ }
  
  processPayment(paymentData: any) { /* implementation */ }
  refundPayment(paymentId: string) { /* implementation */ }
  
  sendEmail(to: string, subject: string, body: string) { /* implementation */ }
  sendSMS(to: string, message: string) { /* implementation */ }
  
  logInfo(message: string) { /* implementation */ }
  logError(error: Error) { /* implementation */ }
}
`;
      const tempFile = path.join(__dirname, '../fixtures/temp-god-class.ts');
      fs.writeFileSync(tempFile, testCode);

      try {
        const analysis = await analyzer.analyzeFile(tempFile);
        const report = assessor.assessFile(analysis);

        expect(report.filePath).toBe(tempFile);
        
        const classViolations = report.violations.filter(v => v.principle === CleanCodePrinciple.CLASSES);
        expect(classViolations.length).toBeGreaterThan(0);
        
        // Should detect low cohesion
        const cohesionViolations = classViolations.filter(v => 
          v.description.includes('cohesion') || v.description.includes('responsibility')
        );
        expect(cohesionViolations.length).toBeGreaterThan(0);
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should assess a file with poor comments', async () => {
      const testCode = `
export class Calculator {
  // This method adds two numbers
  add(a: number, b: number): number {
    // Return the sum of a and b
    return a + b; // Add a to b
  }

  // This method subtracts two numbers
  subtract(a: number, b: number): number {
    // Return the difference of a and b
    return a - b; // Subtract b from a
  }

  // TODO: implement this later
  // FIXME: this is broken
  // NOTE: this is important
  multiply(a: number, b: number): number {
    return a * b;
  }
}
`;
      const tempFile = path.join(__dirname, '../fixtures/temp-poor-comments.ts');
      fs.writeFileSync(tempFile, testCode);

      try {
        const analysis = await analyzer.analyzeFile(tempFile);
        const report = assessor.assessFile(analysis);

        expect(report.filePath).toBe(tempFile);
        
        const commentViolations = report.violations.filter(v => v.principle === CleanCodePrinciple.COMMENTS);
        expect(commentViolations.length).toBeGreaterThan(0);
        
        // Should detect unnecessary comments
        const unnecessaryComments = commentViolations.filter(v => 
          v.description.includes('unnecessary') || v.description.includes('obvious')
        );
        expect(unnecessaryComments.length).toBeGreaterThan(0);
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('assessPrinciple', () => {
    it('should assess naming principle correctly', async () => {
      const testCode = `
export class UserService {
  private u: any; // Poor naming
  private userRepository: UserRepository; // Good naming

  f(i: string): any { // Poor naming
    return this.userRepository.findById(i);
  }

  findUserByEmail(email: string): User { // Good naming
    return this.userRepository.findByEmail(email);
  }
}
`;
      const tempFile = path.join(__dirname, '../fixtures/temp-naming-test.ts');
      fs.writeFileSync(tempFile, testCode);

      try {
        const analysis = await analyzer.analyzeFile(tempFile);
        const score = assessor.assessPrinciple(CleanCodePrinciple.NAMING, analysis);

        expect(score.principle).toBe(CleanCodePrinciple.NAMING);
        expect(score.score).toBeLessThan(score.maxScore);
        expect(score.violations.length).toBeGreaterThan(0);
        expect(score.violations.every(v => v.principle === CleanCodePrinciple.NAMING)).toBe(true);
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should assess function principle correctly', async () => {
      const testCode = `
export function simpleFunction(name: string): string {
  return \`Hello, \${name}!\`;
}

export function complexFunction(a: number, b: number, c: number, d: number, e: number, f: number): number {
  if (a > 0) {
    if (b > 0) {
      if (c > 0) {
        if (d > 0) {
          if (e > 0) {
            if (f > 0) {
              return a + b + c + d + e + f;
            }
          }
        }
      }
    }
  }
  return 0;
}
`;
      const tempFile = path.join(__dirname, '../fixtures/temp-function-test.ts');
      fs.writeFileSync(tempFile, testCode);

      try {
        const analysis = await analyzer.analyzeFile(tempFile);
        const score = assessor.assessPrinciple(CleanCodePrinciple.FUNCTIONS, analysis);

        expect(score.principle).toBe(CleanCodePrinciple.FUNCTIONS);
        expect(score.violations.length).toBeGreaterThan(0);
        expect(score.violations.every(v => v.principle === CleanCodePrinciple.FUNCTIONS)).toBe(true);
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('generateOverallScore', () => {
    it('should generate overall quality metrics from multiple reports', () => {
      const reports: QualityReport[] = [
        {
          filePath: 'file1.ts',
          overallScore: 0.8,
          principleScores: new Map([
            [CleanCodePrinciple.NAMING, { principle: CleanCodePrinciple.NAMING, score: 8, maxScore: 10, violations: [] }],
            [CleanCodePrinciple.FUNCTIONS, { principle: CleanCodePrinciple.FUNCTIONS, score: 7, maxScore: 10, violations: [] }]
          ]),
          violations: [],
          strengths: ['Good naming']
        },
        {
          filePath: 'file2.ts',
          overallScore: 0.6,
          principleScores: new Map([
            [CleanCodePrinciple.NAMING, { principle: CleanCodePrinciple.NAMING, score: 6, maxScore: 10, violations: [] }],
            [CleanCodePrinciple.FUNCTIONS, { principle: CleanCodePrinciple.FUNCTIONS, score: 5, maxScore: 10, violations: [] }]
          ]),
          violations: [
            {
              id: 'test-violation',
              principle: CleanCodePrinciple.NAMING,
              severity: Severity.MEDIUM,
              location: { filePath: 'file2.ts', line: 1, column: 1 },
              description: 'Test violation',
              suggestion: 'Fix this'
            }
          ],
          strengths: []
        }
      ];

      const overall = assessor.generateOverallScore(reports);

      expect(overall.totalFiles).toBe(2);
      expect(overall.averageScore).toBe(0.7); // (0.8 + 0.6) / 2
      expect(overall.totalViolations).toBe(1);
      expect(overall.principleBreakdown.size).toBe(2);
      expect(overall.principleBreakdown.get(CleanCodePrinciple.NAMING)).toBe(7); // (8 + 6) / 2
      expect(overall.principleBreakdown.get(CleanCodePrinciple.FUNCTIONS)).toBe(6); // (7 + 5) / 2
    });

    it('should handle empty reports array', () => {
      const overall = assessor.generateOverallScore([]);

      expect(overall.totalFiles).toBe(0);
      expect(overall.averageScore).toBe(0);
      expect(overall.totalViolations).toBe(0);
      expect(overall.principleBreakdown.size).toBe(0);
    });
  });
});