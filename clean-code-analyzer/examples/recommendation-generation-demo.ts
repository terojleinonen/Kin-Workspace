/**
 * Demonstration of the Recommendation Generation System
 * Shows how violations are converted into actionable refactoring recommendations
 */

import { TypeScriptAnalyzer } from '../src/analyzer/file-parser';
import { ViolationDetector } from '../src/analyzer/violation-detector';
import { CleanCodeRecommendationEngine } from '../src/analyzer/recommendation-engine';
import { RefactoringType, EffortLevel, ImpactLevel } from '../src/types';

async function demonstrateRecommendationGeneration() {
  console.log('🔧 Clean Code Recommendation Generation Demo');
  console.log('='.repeat(50));

  // Sample TypeScript code with various Clean Code violations
  const sampleCode = `
// Poor naming and function design
function fn(x, y, z, a, b, c, d) {
  let result = 0;
  
  // Long function with high complexity
  if (x > 0) {
    if (y > 0) {
      if (z > 0) {
        if (a > 0) {
          if (b > 0) {
            if (c > 0) {
              result = x * y * z * a * b * c * d;
            } else {
              result = x * y * z * a * b;
            }
          } else {
            result = x * y * z * a;
          }
        } else {
          result = x * y * z;
        }
      } else {
        result = x * y;
      }
    } else {
      result = x;
    }
  }
  
  // More processing...
  for (let i = 0; i < 10; i++) {
    const temp = result + i;
    result = temp * 2;
  }
  
  return result;
}

// Large class with too many responsibilities
class UserManager {
  users: any[] = [];
  
  // User CRUD operations
  createUser() {}
  updateUser() {}
  deleteUser() {}
  getUser() {}
  
  // Authentication
  login() {}
  logout() {}
  validatePassword() {}
  
  // Email operations
  sendEmail() {}
  sendWelcomeEmail() {}
  sendPasswordResetEmail() {}
  
  // File operations
  uploadAvatar() {}
  deleteAvatar() {}
  
  // Reporting
  generateUserReport() {}
  exportUsers() {}
}
`;

  try {
    // Step 1: Parse the code
    console.log('\n📝 Step 1: Parsing sample code...');
    
    // Write sample code to temporary file
    const fs = require('fs');
    const tempFile = 'temp-demo.ts';
    fs.writeFileSync(tempFile, sampleCode);
    
    const parser = new TypeScriptAnalyzer();
    const analysis = await parser.analyzeFile(tempFile);
    
    // Clean up temporary file
    fs.unlinkSync(tempFile);
    
    console.log(`   Functions found: ${analysis.functions.length}`);
    console.log(`   Classes found: ${analysis.classes.length}`);

    // Step 2: Detect violations
    console.log('\n🔍 Step 2: Detecting Clean Code violations...');
    const detector = new ViolationDetector();
    const violationReport = detector.detectViolations(analysis);
    
    console.log(`   Total violations: ${violationReport.totalViolations}`);
    console.log(`   Quality score: ${violationReport.qualityScore.toFixed(1)}/100`);
    
    // Show violations by severity
    console.log('\n   Violations by severity:');
    for (const [severity, count] of violationReport.violationsBySeverity) {
      console.log(`     ${severity.toUpperCase()}: ${count}`);
    }

    // Step 3: Generate recommendations
    console.log('\n💡 Step 3: Generating refactoring recommendations...');
    const engine = new CleanCodeRecommendationEngine();
    const violations = violationReport.classifications.map(c => c.violation);
    const recommendations = engine.generateRecommendations(violations);
    
    console.log(`   Generated ${recommendations.length} recommendations`);

    // Step 4: Prioritize recommendations
    console.log('\n📋 Step 4: Creating prioritized implementation plan...');
    const plan = engine.prioritizeRecommendations(recommendations);
    
    console.log(`   Total estimated effort: ${plan.totalEffort.timeHours} hours`);
    console.log(`   Overall complexity: ${plan.totalEffort.complexity}`);
    console.log(`   Risk level: ${plan.totalEffort.riskLevel}`);
    console.log(`   Implementation phases: ${plan.phases.length}`);

    // Step 5: Display detailed recommendations
    console.log('\n🎯 Step 5: Detailed Recommendations');
    console.log('-'.repeat(50));
    
    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      console.log(`\n${i + 1}. ${rec.description}`);
      console.log(`   Type: ${rec.type}`);
      console.log(`   Principle: ${rec.principle}`);
      console.log(`   Effort: ${rec.effort} | Impact: ${rec.impact}`);
      
      if (rec.beforeCode && rec.afterCode) {
        console.log('\n   Before:');
        console.log('   ' + rec.beforeCode.split('\n').slice(0, 3).join('\n   '));
        console.log('\n   After:');
        console.log('   ' + rec.afterCode.split('\n').slice(0, 3).join('\n   '));
      }
    }

    // Step 6: Show implementation phases
    console.log('\n📅 Step 6: Implementation Phases');
    console.log('-'.repeat(50));
    
    for (const phase of plan.phases) {
      console.log(`\n${phase.name}`);
      console.log(`   Recommendations: ${phase.recommendations.length}`);
      console.log(`   Estimated effort: ${phase.estimatedEffort.timeHours} hours`);
      console.log(`   Dependencies: ${phase.dependencies.length > 0 ? phase.dependencies.join(', ') : 'None'}`);
      
      console.log('   Tasks:');
      for (const rec of phase.recommendations) {
        console.log(`     • ${rec.description} (${rec.effort} effort, ${rec.impact} impact)`);
      }
    }

    // Step 7: Show prerequisites
    if (plan.totalEffort.prerequisites.length > 0) {
      console.log('\n⚠️  Prerequisites:');
      for (const prerequisite of plan.totalEffort.prerequisites) {
        console.log(`   • ${prerequisite}`);
      }
    }

    // Step 8: Summary statistics
    console.log('\n📊 Summary Statistics');
    console.log('-'.repeat(50));
    
    const recommendationsByType = new Map<RefactoringType, number>();
    const recommendationsByEffort = new Map<EffortLevel, number>();
    const recommendationsByImpact = new Map<ImpactLevel, number>();
    
    for (const rec of recommendations) {
      recommendationsByType.set(rec.type, (recommendationsByType.get(rec.type) || 0) + 1);
      recommendationsByEffort.set(rec.effort, (recommendationsByEffort.get(rec.effort) || 0) + 1);
      recommendationsByImpact.set(rec.impact, (recommendationsByImpact.get(rec.impact) || 0) + 1);
    }
    
    console.log('\nRecommendations by type:');
    for (const [type, count] of recommendationsByType) {
      console.log(`   ${type}: ${count}`);
    }
    
    console.log('\nRecommendations by effort:');
    for (const [effort, count] of recommendationsByEffort) {
      console.log(`   ${effort}: ${count}`);
    }
    
    console.log('\nRecommendations by impact:');
    for (const [impact, count] of recommendationsByImpact) {
      console.log(`   ${impact}: ${count}`);
    }

    console.log('\n✅ Recommendation generation demo completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review and approve the recommendations');
    console.log('2. Start with Phase 1 (Quick Wins) for immediate improvements');
    console.log('3. Ensure prerequisites are met before major refactoring');
    console.log('4. Track progress and measure quality improvements');

  } catch (error) {
    console.error('❌ Error during recommendation generation:', error);
    throw error;
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateRecommendationGeneration()
    .then(() => {
      console.log('\n🎉 Demo completed successfully!');
    })
    .catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateRecommendationGeneration };