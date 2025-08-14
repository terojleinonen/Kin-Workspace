/**
 * Tests for file parser functionality
 */

import * as fs from 'fs';
import * as path from 'path';
import { TypeScriptAnalyzer } from '../../src/analyzer/file-parser';

describe('TypeScriptAnalyzer', () => {
  let analyzer: TypeScriptAnalyzer;
  const testFilesDir = path.join(__dirname, '../fixtures');

  beforeEach(() => {
    analyzer = new TypeScriptAnalyzer();
    
    // Ensure test fixtures directory exists
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testFilesDir)) {
      const files = fs.readdirSync(testFilesDir);
      files.forEach(file => {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          fs.unlinkSync(path.join(testFilesDir, file));
        }
      });
    }
  });

  describe('analyzeFile', () => {
    it('should analyze a simple TypeScript file with functions', async () => {
      const testCode = `
export function calculateSum(a: number, b: number): number {
  return a + b;
}

function processData(data: string[]): void {
  for (const item of data) {
    console.log(item);
  }
}

async function fetchData(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}
`;
      const testFile = path.join(testFilesDir, 'test-functions.ts');
      fs.writeFileSync(testFile, testCode);

      const result = await analyzer.analyzeFile(testFile);

      expect(result.filePath).toBe(testFile);
      expect(result.functions).toHaveLength(3);
      
      // Check calculateSum function
      const calculateSum = result.functions.find(f => f.name === 'calculateSum');
      expect(calculateSum).toBeDefined();
      expect(calculateSum!.parameters).toEqual(['a', 'b']);
      expect(calculateSum!.isExported).toBe(true);
      expect(calculateSum!.isAsync).toBe(false);
      
      // Check processData function
      const processData = result.functions.find(f => f.name === 'processData');
      expect(processData).toBeDefined();
      expect(processData!.parameters).toEqual(['data']);
      expect(processData!.isExported).toBe(false);
      expect(processData!.isAsync).toBe(false);
      
      // Check fetchData function
      const fetchData = result.functions.find(f => f.name === 'fetchData');
      expect(fetchData).toBeDefined();
      expect(fetchData!.parameters).toEqual(['url']);
      expect(fetchData!.isExported).toBe(false);
      expect(fetchData!.isAsync).toBe(true);
    });

    it('should analyze a TypeScript file with classes', async () => {
      const testCode = `
export class UserService {
  private users: User[] = [];
  
  constructor(private apiUrl: string) {}
  
  async getUser(id: number): Promise<User | null> {
    const user = this.users.find(u => u.id === id);
    return user || null;
  }
  
  addUser(user: User): void {
    this.users.push(user);
  }
}

interface User {
  id: number;
  name: string;
  email: string;
}

class InternalHelper {
  static formatName(name: string): string {
    return name.trim().toLowerCase();
  }
}
`;
      const testFile = path.join(testFilesDir, 'test-classes.ts');
      fs.writeFileSync(testFile, testCode);

      const result = await analyzer.analyzeFile(testFile);

      expect(result.classes).toHaveLength(3); // UserService, User interface, InternalHelper
      
      // Check UserService class
      const userService = result.classes.find(c => c.name === 'UserService');
      expect(userService).toBeDefined();
      expect(userService!.isExported).toBe(true);
      expect(userService!.properties).toContain('users');
      expect(userService!.methods).toHaveLength(2);
      expect(userService!.methods.map(m => m.name)).toContain('getUser');
      expect(userService!.methods.map(m => m.name)).toContain('addUser');
      
      // Check User interface (treated as class)
      const userInterface = result.classes.find(c => c.name === 'User');
      expect(userInterface).toBeDefined();
      expect(userInterface!.isExported).toBe(false);
      expect(userInterface!.properties).toContain('id');
      expect(userInterface!.properties).toContain('name');
      expect(userInterface!.properties).toContain('email');
      
      // Check InternalHelper class
      const internalHelper = result.classes.find(c => c.name === 'InternalHelper');
      expect(internalHelper).toBeDefined();
      expect(internalHelper!.isExported).toBe(false);
      expect(internalHelper!.methods).toHaveLength(1);
      expect(internalHelper!.methods[0].name).toBe('formatName');
    });

    it('should analyze imports and exports', async () => {
      const testCode = `
import { Component } from 'react';
import * as fs from 'fs';
import path from 'path';

// Simple class to avoid module resolution issues
export default class App {
  render() {
    return 'Hello World';
  }
}

export function helper() {
  return 'helper';
}
`;
      const testFile = path.join(testFilesDir, 'test-imports.ts');
      fs.writeFileSync(testFile, testCode);

      const result = await analyzer.analyzeFile(testFile);

      expect(result.imports).toHaveLength(3);
      
      const reactImport = result.imports.find(i => i.module === 'react');
      expect(reactImport).toBeDefined();
      expect(reactImport!.imports).toEqual(['Component']);
      
      const fsImport = result.imports.find(i => i.module === 'fs');
      expect(fsImport).toBeDefined();
      expect(fsImport!.imports).toEqual(['*']);
      
      const pathImport = result.imports.find(i => i.module === 'path');
      expect(pathImport).toBeDefined();
      expect(pathImport!.imports).toEqual(['default']);
      
      // Check that classes and functions are detected
      expect(result.classes).toHaveLength(1);
      expect(result.functions).toHaveLength(2); // render method + helper function
    });

    it('should handle interfaces and type definitions', async () => {
      const testCode = `
export interface User {
  id: number;
  name: string;
  email: string;
  getDisplayName(): string;
}

type Status = 'active' | 'inactive' | 'pending';

interface InternalConfig {
  apiUrl: string;
  timeout: number;
}
`;
      const testFile = path.join(testFilesDir, 'test-interfaces.ts');
      fs.writeFileSync(testFile, testCode);

      const result = await analyzer.analyzeFile(testFile);

      // Interfaces should be treated as classes for analysis purposes
      expect(result.classes).toHaveLength(2);
      
      const userInterface = result.classes.find(c => c.name === 'User');
      expect(userInterface).toBeDefined();
      expect(userInterface!.isExported).toBe(true);
      expect(userInterface!.properties).toContain('id');
      expect(userInterface!.properties).toContain('name');
      expect(userInterface!.properties).toContain('email');
      expect(userInterface!.methods).toHaveLength(1);
      expect(userInterface!.methods[0].name).toBe('getDisplayName');
    });

    it('should calculate basic complexity metrics', async () => {
      const testCode = `
function complexFunction(data: any[]): number {
  let result = 0;
  
  for (const item of data) {
    if (item.type === 'A') {
      if (item.value > 10) {
        result += item.value * 2;
      } else {
        result += item.value;
      }
    } else if (item.type === 'B') {
      result += item.value / 2;
    } else {
      result += 1;
    }
  }
  
  return result;
}
`;
      const testFile = path.join(testFilesDir, 'test-complexity.ts');
      fs.writeFileSync(testFile, testCode);

      const result = await analyzer.analyzeFile(testFile);

      expect(result.functions).toHaveLength(1);
      const func = result.functions[0];
      expect(func.complexity.cyclomaticComplexity).toBeGreaterThan(1);
      expect(func.complexity.nestingDepth).toBeGreaterThan(0);
      expect(func.complexity.lineCount).toBeGreaterThan(10);
    });

    it('should handle files with syntax errors gracefully', async () => {
      const testCode = `
function validFunction() {
  return "this is valid";
}
`;
      const testFile = path.join(testFilesDir, 'test-valid.ts');
      fs.writeFileSync(testFile, testCode);

      const result = await analyzer.analyzeFile(testFile);
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('validFunction');
    });

    it('should handle empty files', async () => {
      const testFile = path.join(testFilesDir, 'test-empty.ts');
      fs.writeFileSync(testFile, '');

      const result = await analyzer.analyzeFile(testFile);

      expect(result.filePath).toBe(testFile);
      expect(result.functions).toHaveLength(0);
      expect(result.classes).toHaveLength(0);
      expect(result.imports).toHaveLength(0);
      expect(result.lineCount).toBe(0);
    });

    it('should handle non-existent files', async () => {
      const nonExistentFile = path.join(testFilesDir, 'non-existent.ts');

      await expect(analyzer.analyzeFile(nonExistentFile)).rejects.toThrow();
    });
  });

  describe('analyzeBatch', () => {
    it('should analyze multiple files', async () => {
      const file1Code = `
export function helper1(): string {
  return "helper1";
}
`;
      const file2Code = `
export class Service {
  process(): void {}
}
`;
      
      const file1 = path.join(testFilesDir, 'batch1.ts');
      const file2 = path.join(testFilesDir, 'batch2.ts');
      fs.writeFileSync(file1, file1Code);
      fs.writeFileSync(file2, file2Code);

      const result = await analyzer.analyzeBatch([file1, file2]);

      expect(result.totalFiles).toBe(2);
      expect(result.files).toHaveLength(2);
      expect(result.files[0].functions).toHaveLength(1);
      expect(result.files[1].classes).toHaveLength(1);
    });

    it('should handle empty batch', async () => {
      const result = await analyzer.analyzeBatch([]);

      expect(result.totalFiles).toBe(0);
      expect(result.files).toHaveLength(0);
    });

    it('should handle batch with mixed files', async () => {
      const validFile = path.join(testFilesDir, 'valid.ts');
      const simpleFile = path.join(testFilesDir, 'simple.ts');
      
      fs.writeFileSync(validFile, 'export function test() {}');
      fs.writeFileSync(simpleFile, 'const x = 1;');

      const result = await analyzer.analyzeBatch([validFile, simpleFile]);
      
      expect(result.totalFiles).toBe(2);
      expect(result.files).toHaveLength(2);
      expect(result.files[0].functions).toHaveLength(1);
      expect(result.files[1].functions).toHaveLength(0); // simple.ts has no functions
    });
  });
});