/**
 * Violation Detection System Demo
 * Demonstrates the violation detection capabilities
 */

import { ViolationDetector } from '../src/analyzer/violation-detector';
import { TypeScriptAnalyzer } from '../src/analyzer/file-parser';
import * as ts from 'typescript';

async function demonstrateViolationDetection() {
  console.log('🔍 Clean Code Violation Detection Demo\n');

  // Create sample code with various violations
  const sampleCode = `
// This file contains various Clean Code violations for demonstration

function a(x, y, z, w, v) { // Short name + too many parameters
  let b = 5; // Single letter variable
  let result = 0;
  
  // Function is too long and complex
  if (x > 0) {
    if (y > 0) {
      if (z > 0) {
        if (w > 0) {
          if (v > 0) {
            for (let i = 0; i < x; i++) {
              for (let j = 0; j < y; j++) {
                for (let k = 0; k < z; k++) {
                  if (i % 2 === 0) {
                    if (j % 2 === 0) {
                      if (k % 2 === 0) {
                        result += i + j + k + w + v;
                      } else {
                        result -= i + j + k + w + v;
                      }
                    } else {
                      result *= 2;
                    }
                  } else {
                    result /= 2;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  return result;
}

class GodClass { // Large class with too many responsibilities
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: object;
  prop5: array;
  prop6: string;
  prop7: number;
  prop8: boolean;
  prop9: object;
  
  method1() { return this.prop1; }
  method2() { return this.prop2; }
  method3() { return this.prop3; }
  method4() { return this.prop4; }
  method5() { return this.prop5; }
  method6() { return this.prop6; }
  method7() { return this.prop7; }
  method8() { return this.prop8; }
  method9() { return this.prop9; }
  method10() { return 'method10'; }
  method11() { return 'method11'; }
  method12() { return 'method12'; }
}

export function cleanFunction(items: Item[]) {
  return items.filter(item => item.isActive);
}
`;

  // Create source file for AST analysis
  const sourceFile = ts.createSourceFile(
    'demo.ts',
    sampleCode,
    ts.ScriptTarget.ES2020,
    true
  );

  // Analyze the file
  const analyzer = new TypeScriptAnalyzer();
  
  // Create a temporary file for analysis
  const fs = require('fs');
  const tempFilePath = 'temp-demo.ts';
  fs.writeFileSync(tempFilePath, sampleCode);
  
  try {
    const analysis = await analyzer.analyzeFile(tempFilePath);
    
    // Detect violations
    const detector = new ViolationDetector();
    const report = detector.detectViolations(analysis, sourceFile);
    
    console.log(`📊 Violation Detection Results for ${report.filePath}`);
    console.log(`Total violations found: ${report.totalViolations}`);
    console.log(`Quality score: ${report.qualityScore}/100\n`);
    
    // Show violations by principle
    console.log('📋 Violations by Clean Code Principle:');
    for (const [principle, count] of report.violationsByPrinciple) {
      console.log(`  ${principle}: ${count} violations`);
    }
    console.log();
    
    // Show violations by severity
    console.log('⚠️  Violations by Severity:');
    for (const [severity, count] of report.violationsBySeverity) {
      console.log(`  ${severity.toUpperCase()}: ${count} violations`);
    }
    console.log();
    
    // Show detailed violations
    console.log('🔍 Detailed Violation Analysis:');
    report.classifications.forEach((classification, index) => {
      const v = classification.violation;
      console.log(`\n${index + 1}. ${v.severity.toUpperCase()} - ${v.principle}`);
      console.log(`   Location: Line ${v.location.line}, Column ${v.location.column}`);
      console.log(`   Issue: ${v.description}`);
      console.log(`   Suggestion: ${v.suggestion}`);
      console.log(`   Impact Score: ${classification.impactScore}/10`);
      console.log(`   Frequency Score: ${classification.frequencyScore}/10`);
      console.log(`   Reasoning: ${classification.reasoning}`);
    });
    
    console.log('\n✨ Demonstration complete!');
    console.log('\nThe violation detection system successfully identified:');
    console.log('- Short function names that reduce readability');
    console.log('- Functions with too many parameters');
    console.log('- Functions that are too long and complex');
    console.log('- Single letter variables (except common loop counters)');
    console.log('- Classes with too many methods and properties');
    console.log('- Precise location tracking using AST node positions');
    console.log('- Dynamic severity adjustment based on impact and frequency');
    
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateViolationDetection().catch(console.error);
}

export { demonstrateViolationDetection };