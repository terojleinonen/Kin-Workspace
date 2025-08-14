/**
 * Naming Analysis Demo
 * 
 * This script demonstrates the naming analysis capabilities of the Clean Code Analyzer.
 * It analyzes a sample TypeScript file and shows various naming violations and suggestions.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TypeScriptAnalyzer } from '../src/analyzer/file-parser';
import { NamingIntegration } from '../src/utils/naming-integration';

// Create a sample file with various naming issues
const sampleCode = `
// Sample TypeScript file with naming issues
const btn = document.getElementById('submit-button'); // abbreviation
const str = 'Hello World'; // abbreviation
const a = 42; // single letter
const data = getUserData(); // meaningless
const UserName = 'john'; // wrong casing for variable
const user_email = 'john@example.com'; // snake_case instead of camelCase

function getUserData() {
  return { name: 'John', email: 'john@example.com' };
}

function btn_click() { // snake_case function name
  console.log('Button clicked');
}

class userService { // wrong casing for class
  private usr: string; // abbreviation
  private data: any; // meaningless
  
  constructor(user: string) {
    this.usr = user;
  }
  
  getData() {
    return this.data;
  }
  
  processUser(u: string) { // single letter parameter
    return u.toUpperCase();
  }
}

interface UserInterface {
  name: string;
  email: string;
  info: any; // meaningless
}

// Good examples
const userName = 'john'; // good camelCase
const userAccountManager = new UserService('john'); // descriptive name
const isUserAuthenticated = true; // boolean with clear meaning

function calculateUserAccountBalance(accountId: string, includeInterest: boolean) {
  // Good parameter names
  return 0;
}

class UserAccountService {
  private userRepository: any;
  
  constructor(repository: any) {
    this.userRepository = repository;
  }
  
  async findUserByEmail(emailAddress: string) {
    return this.userRepository.findByEmail(emailAddress);
  }
}
`;

async function runNamingAnalysisDemo() {
  console.log('🔍 Clean Code Analyzer - Naming Analysis Demo\n');
  
  // Create temporary file
  const tempFilePath = path.join(__dirname, 'temp-sample.ts');
  fs.writeFileSync(tempFilePath, sampleCode);
  
  try {
    // Analyze the file
    console.log('📁 Analyzing file:', tempFilePath);
    
    const analyzer = new TypeScriptAnalyzer();
    const fileAnalysis = await analyzer.analyzeFile(tempFilePath);
    const analysisWithNaming = await NamingIntegration.analyzeFileWithNaming(tempFilePath, fileAnalysis);
    
    // Display results
    console.log('\n📊 Naming Analysis Results:');
    console.log('=' .repeat(50));
    
    // Metrics
    const metrics = NamingIntegration.getNamingMetrics(analysisWithNaming);
    console.log('\n📈 Naming Metrics:');
    console.log(`  Total names analyzed: ${metrics.totalNames}`);
    console.log(`  Violations found: ${metrics.violationCount}`);
    console.log(`  Average descriptiveness: ${(metrics.averageDescriptiveness * 100).toFixed(1)}%`);
    console.log(`  Consistency score: ${(metrics.consistencyScore * 100).toFixed(1)}%`);
    console.log(`  Searchability score: ${(metrics.searchabilityScore * 100).toFixed(1)}%`);
    console.log(`  Abbreviations count: ${metrics.abbreviationCount}`);
    
    // Quality score
    const qualityScore = NamingIntegration.calculateNamingQualityScore(analysisWithNaming);
    console.log(`\n🎯 Overall Naming Quality Score: ${(qualityScore * 100).toFixed(1)}%`);
    
    // Violations
    const violations = NamingIntegration.extractNamingViolations(analysisWithNaming);
    console.log(`\n⚠️  Naming Violations (${violations.length} found):`);
    
    // Group violations by type
    const violationsByType = new Map<string, any[]>();
    violations.forEach(violation => {
      const type = violation.description.split(':')[0];
      if (!violationsByType.has(type)) {
        violationsByType.set(type, []);
      }
      violationsByType.get(type)!.push(violation);
    });
    
    violationsByType.forEach((typeViolations, type) => {
      console.log(`\n  ${type}:`);
      typeViolations.slice(0, 3).forEach(violation => { // Show first 3 of each type
        console.log(`    • Line ${violation.location.line}: "${violation.actualName}" - ${violation.suggestion}`);
        if (violation.suggestedName) {
          console.log(`      Suggested: "${violation.suggestedName}"`);
        }
      });
      if (typeViolations.length > 3) {
        console.log(`    ... and ${typeViolations.length - 3} more`);
      }
    });
    
    // Suggestions
    const suggestions = NamingIntegration.getNamingSuggestions(analysisWithNaming);
    console.log(`\n💡 Improvement Suggestions:`);
    suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`);
    });
    
    // Summary
    const summary = NamingIntegration.generateNamingSummary(analysisWithNaming);
    console.log(`\n📋 Summary: ${summary}`);
    
    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

// Run the demo
if (require.main === module) {
  runNamingAnalysisDemo().catch(console.error);
}

export { runNamingAnalysisDemo };