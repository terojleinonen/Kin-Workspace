/**
 * File Parser - Handles TypeScript/JavaScript AST parsing and analysis
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import { ComplexityMetrics, CodeLocation } from '../types';

export interface FunctionInfo {
  name: string;
  location: CodeLocation;
  parameters: string[];
  complexity: ComplexityMetrics;
  isAsync: boolean;
  isExported: boolean;
}

export interface ClassInfo {
  name: string;
  location: CodeLocation;
  methods: FunctionInfo[];
  properties: string[];
  isExported: boolean;
}

export interface ImportInfo {
  module: string;
  imports: string[];
  location: CodeLocation;
}

export interface FileAnalysis {
  filePath: string;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  imports: ImportInfo[];
  complexity: ComplexityMetrics;
  lineCount: number;
  testCoverage?: number;
}

export interface BatchAnalysis {
  files: FileAnalysis[];
  totalFiles: number;
  overallComplexity: ComplexityMetrics;
}

export interface CodeAnalyzer {
  analyzeFile(filePath: string): Promise<FileAnalysis>;
  analyzeBatch(filePaths: string[]): Promise<BatchAnalysis>;
  getMetrics(analysis: FileAnalysis): ComplexityMetrics;
}

/**
 * TypeScript AST analyzer implementation
 */
export class TypeScriptAnalyzer implements CodeAnalyzer {
  private compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    strict: false, // Disable strict mode for analysis to avoid module resolution errors
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: false,
    noResolve: true // Don't resolve modules during analysis
  };

  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.ES2020,
      true
    );

    // Note: Syntax error checking is disabled for now to focus on AST parsing
    // This will be enhanced in future iterations

    const functions = this.extractFunctions(sourceFile);
    const classes = this.extractClasses(sourceFile);
    const imports = this.extractImports(sourceFile);
    const lineCount = sourceCode.trim() === '' ? 0 : sourceCode.split('\n').length;
    const complexity = this.calculateFileComplexity(sourceFile);

    return {
      filePath,
      functions,
      classes,
      imports,
      complexity,
      lineCount
    };
  }

  async analyzeBatch(filePaths: string[]): Promise<BatchAnalysis> {
    if (filePaths.length === 0) {
      return {
        files: [],
        totalFiles: 0,
        overallComplexity: {
          cyclomaticComplexity: 0,
          cognitiveComplexity: 0,
          nestingDepth: 0,
          lineCount: 0,
          parameterCount: 0
        }
      };
    }

    const files: FileAnalysis[] = [];
    
    for (const filePath of filePaths) {
      try {
        const analysis = await this.analyzeFile(filePath);
        files.push(analysis);
      } catch (error) {
        throw new Error(`Failed to analyze ${filePath}: ${error}`);
      }
    }

    const overallComplexity = this.aggregateComplexity(files);

    return {
      files,
      totalFiles: files.length,
      overallComplexity
    };
  }

  getMetrics(analysis: FileAnalysis): ComplexityMetrics {
    // This will be implemented in task 2.2
    return analysis.complexity;
  }

  private extractFunctions(sourceFile: ts.SourceFile): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        const functionInfo = this.analyzeFunctionNode(node, sourceFile);
        if (functionInfo) {
          functions.push(functionInfo);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return functions;
  }

  private extractClasses(sourceFile: ts.SourceFile): ClassInfo[] {
    const classes: ClassInfo[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
        const classInfo = this.analyzeClassNode(node, sourceFile);
        if (classInfo) {
          classes.push(classInfo);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return classes;
  }

  private extractImports(sourceFile: ts.SourceFile): ImportInfo[] {
    const imports: ImportInfo[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const importInfo = this.analyzeImportNode(node, sourceFile);
        if (importInfo) {
          imports.push(importInfo);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return imports;
  }

  private analyzeFunctionNode(node: ts.Node, sourceFile: ts.SourceFile): FunctionInfo | null {
    let name = 'anonymous';
    let parameters: string[] = [];
    let isAsync = false;
    let isExported = false;

    if (ts.isFunctionDeclaration(node)) {
      name = node.name?.text || 'anonymous';
      parameters = node.parameters.map(p => (p.name as ts.Identifier).text);
      isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;
      isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;
    } else if (ts.isMethodDeclaration(node)) {
      name = (node.name as ts.Identifier).text;
      parameters = node.parameters.map(p => (p.name as ts.Identifier).text);
      isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;
    } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      parameters = node.parameters.map(p => (p.name as ts.Identifier).text);
      isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;
    }

    const location = this.getNodeLocation(node, sourceFile);
    const complexity = this.calculateFunctionComplexity(node);

    return {
      name,
      location,
      parameters,
      complexity,
      isAsync,
      isExported
    };
  }

  private analyzeClassNode(node: ts.ClassDeclaration | ts.InterfaceDeclaration, sourceFile: ts.SourceFile): ClassInfo | null {
    const name = node.name?.text || 'anonymous';
    const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;
    const location = this.getNodeLocation(node, sourceFile);

    const methods: FunctionInfo[] = [];
    const properties: string[] = [];

    node.members?.forEach(member => {
      if (ts.isMethodDeclaration(member)) {
        const methodInfo = this.analyzeFunctionNode(member, sourceFile);
        if (methodInfo) {
          methods.push(methodInfo);
        }
      } else if (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) {
        const propName = (member.name as ts.Identifier).text;
        properties.push(propName);
      } else if (ts.isMethodSignature(member)) {
        // Handle interface method signatures
        const methodName = (member.name as ts.Identifier).text;
        const parameters = member.parameters.map(p => (p.name as ts.Identifier).text);
        const methodLocation = this.getNodeLocation(member, sourceFile);
        
        methods.push({
          name: methodName,
          location: methodLocation,
          parameters,
          complexity: {
            cyclomaticComplexity: 1,
            cognitiveComplexity: 1,
            nestingDepth: 0,
            lineCount: 1,
            parameterCount: parameters.length
          },
          isAsync: false,
          isExported: false
        });
      }
    });

    return {
      name,
      location,
      methods,
      properties,
      isExported
    };
  }

  private analyzeImportNode(node: ts.ImportDeclaration, sourceFile: ts.SourceFile): ImportInfo | null {
    const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
    const location = this.getNodeLocation(node, sourceFile);
    const imports: string[] = [];

    if (node.importClause) {
      // Default import
      if (node.importClause.name) {
        imports.push('default');
      }

      // Named imports
      if (node.importClause.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          // import * as name
          imports.push('*');
        } else if (ts.isNamedImports(node.importClause.namedBindings)) {
          // import { a, b, c }
          node.importClause.namedBindings.elements.forEach(element => {
            imports.push(element.name.text);
          });
        }
      }
    }

    return {
      module: moduleSpecifier,
      imports,
      location
    };
  }

  private getNodeLocation(node: ts.Node, sourceFile: ts.SourceFile): CodeLocation {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

    return {
      filePath: sourceFile.fileName,
      line: start.line + 1,
      column: start.character + 1,
      endLine: end.line + 1,
      endColumn: end.character + 1
    };
  }

  private calculateFunctionComplexity(node: ts.Node): ComplexityMetrics {
    let cyclomaticComplexity = 1; // Base complexity
    let cognitiveComplexity = 0;
    let nestingDepth = 0;
    let currentDepth = 0;
    let maxDepth = 0;
    let lineCount = 0;
    let parameterCount = 0;

    // Count parameters
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || 
        ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      parameterCount = node.parameters.length;
    }

    // Calculate line count
    const sourceFile = node.getSourceFile();
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    lineCount = end.line - start.line + 1;

    const visit = (node: ts.Node, depth: number = 0) => {
      currentDepth = depth;
      maxDepth = Math.max(maxDepth, currentDepth);

      // Cyclomatic complexity - decision points
      if (ts.isIfStatement(node) || ts.isConditionalExpression(node) ||
          ts.isWhileStatement(node) || ts.isForStatement(node) ||
          ts.isForInStatement(node) || ts.isForOfStatement(node) ||
          ts.isDoStatement(node) || ts.isSwitchStatement(node) ||
          ts.isCaseClause(node) || ts.isCatchClause(node)) {
        cyclomaticComplexity++;
        cognitiveComplexity += (depth + 1);
      }

      // Logical operators
      if (ts.isBinaryExpression(node) && 
          (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
           node.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
        cyclomaticComplexity++;
        cognitiveComplexity++;
      }

      // Increase nesting depth for certain constructs
      const shouldIncreaseDepth = ts.isIfStatement(node) || ts.isWhileStatement(node) ||
                                  ts.isForStatement(node) || ts.isForInStatement(node) ||
                                  ts.isForOfStatement(node) || ts.isDoStatement(node) ||
                                  ts.isTryStatement(node) || ts.isSwitchStatement(node);

      ts.forEachChild(node, child => visit(child, shouldIncreaseDepth ? depth + 1 : depth));
    };

    visit(node);
    nestingDepth = maxDepth;

    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      nestingDepth,
      lineCount,
      parameterCount
    };
  }

  private calculateFileComplexity(sourceFile: ts.SourceFile): ComplexityMetrics {
    let totalCyclomatic = 0;
    let totalCognitive = 0;
    let maxNesting = 0;
    const totalLines = sourceFile.text.trim() === '' ? 0 : sourceFile.text.split('\n').length;
    let totalParams = 0;
    let functionCount = 0;

    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || 
          ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        const complexity = this.calculateFunctionComplexity(node);
        totalCyclomatic += complexity.cyclomaticComplexity;
        totalCognitive += complexity.cognitiveComplexity;
        maxNesting = Math.max(maxNesting, complexity.nestingDepth);
        totalParams += complexity.parameterCount;
        functionCount++;
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return {
      cyclomaticComplexity: functionCount > 0 ? Math.round(totalCyclomatic / functionCount) : 0,
      cognitiveComplexity: functionCount > 0 ? Math.round(totalCognitive / functionCount) : 0,
      nestingDepth: maxNesting,
      lineCount: totalLines,
      parameterCount: functionCount > 0 ? Math.round(totalParams / functionCount) : 0
    };
  }

  private aggregateComplexity(files: FileAnalysis[]): ComplexityMetrics {
    if (files.length === 0) {
      return {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        nestingDepth: 0,
        lineCount: 0,
        parameterCount: 0
      };
    }

    const totalCyclomatic = files.reduce((sum, file) => sum + file.complexity.cyclomaticComplexity, 0);
    const totalCognitive = files.reduce((sum, file) => sum + file.complexity.cognitiveComplexity, 0);
    const maxNesting = Math.max(...files.map(file => file.complexity.nestingDepth));
    const totalLines = files.reduce((sum, file) => sum + file.complexity.lineCount, 0);
    const totalParams = files.reduce((sum, file) => sum + file.complexity.parameterCount, 0);

    return {
      cyclomaticComplexity: Math.round(totalCyclomatic / files.length),
      cognitiveComplexity: Math.round(totalCognitive / files.length),
      nestingDepth: maxNesting,
      lineCount: totalLines,
      parameterCount: Math.round(totalParams / files.length)
    };
  }
}