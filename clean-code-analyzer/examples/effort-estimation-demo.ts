#!/usr/bin/env ts-node

/**
 * Effort Estimation Demo
 * Demonstrates the new effort estimation capabilities of the Clean Code Recommendation Engine
 */

import { 
  CleanCodeRecommendationEngine, 
  EffortEstimationContext 
} from '../src/analyzer/recommendation-engine';
import { 
  Recommendation, 
  RefactoringType, 
  CleanCodePrinciple, 
  EffortLevel, 
  ImpactLevel 
} from '../src/types';

function createSampleRecommendations(): Recommendation[] {
  return [
    {
      id: 'rec-1',
      type: RefactoringType.RENAME,
      description: 'Rename variable "x" to "currentUser"',
      beforeCode: 'const x = getUser();',
      afterCode: 'const currentUser = getUser();',
      principle: CleanCodePrinciple.NAMING,
      effort: EffortLevel.SMALL,
      impact: ImpactLevel.MEDIUM,
      dependencies: []
    },
    {
      id: 'rec-2',
      type: RefactoringType.EXTRACT_METHOD,
      description: 'Extract validation logic from processUserData function',
      beforeCode: 'function processUserData(data) { /* 50 lines of mixed logic */ }',
      afterCode: 'function processUserData(data) { validateData(data); transformData(data); }',
      principle: CleanCodePrinciple.FUNCTIONS,
      effort: EffortLevel.MEDIUM,
      impact: ImpactLevel.HIGH,
      dependencies: []
    },
    {
      id: 'rec-3',
      type: RefactoringType.SPLIT_CLASS,
      description: 'Split UserManager into UserRepository and UserService',
      beforeCode: 'class UserManager { /* 20 methods handling CRUD, auth, notifications */ }',
      afterCode: 'class UserRepository { /* CRUD */ } class UserService { /* business logic */ }',
      principle: CleanCodePrinciple.CLASSES,
      effort: EffortLevel.LARGE,
      impact: ImpactLevel.HIGH,
      dependencies: []
    }
  ];
}

function createLowRiskContext(): EffortEstimationContext {
  return {
    fileAnalysis: {
      filePath: 'src/user-service.ts',
      functions: [
        {
          name: 'processUserData',
          location: { filePath: 'src/user-service.ts', line: 10, column: 1 },
          parameters: ['userData'],
          complexity: {
            cyclomaticComplexity: 8,
            cognitiveComplexity: 12,
            nestingDepth: 3,
            lineCount: 25,
            parameterCount: 1
          },
          isAsync: false,
          isExported: true
        }
      ],
      classes: [],
      imports: [],
      complexity: {
        cyclomaticComplexity: 8,
        cognitiveComplexity: 12,
        nestingDepth: 3,
        lineCount: 150,
        parameterCount: 1
      },
      lineCount: 150
    },
    testCoverage: {
      overallCoverage: 0.85,
      fileCoverage: new Map([['src/user-service.ts', 0.85]]),
      functionCoverage: new Map([['processUserData', 0.90]])
    },
    usageFrequency: {
      functionCallCounts: new Map([['processUserData', 25]]),
      classUsageCounts: new Map(),
      fileAccessCounts: new Map([['src/user-service.ts', 40]])
    },
    dependencyGraph: {
      fileDependencies: new Map([['src/user-service.ts', ['src/user-model.ts', 'src/validation.ts']]]),
      functionDependencies: new Map(),
      classDependencies: new Map()
    },
    codebaseMetrics: {
      totalFiles: 50,
      totalLines: 15000,
      averageComplexity: 6,
      hotspotFiles: []
    }
  };
}

function createHighRiskContext(): EffortEstimationContext {
  return {
    fileAnalysis: {
      filePath: 'src/legacy-user-manager.ts',
      functions: Array(15).fill(null).map((_, i) => ({
        name: `method${i}`,
        location: { filePath: 'src/legacy-user-manager.ts', line: i * 20 + 1, column: 1 },
        parameters: Array(5).fill('param'),
        complexity: {
          cyclomaticComplexity: 15,
          cognitiveComplexity: 25,
          nestingDepth: 6,
          lineCount: 40,
          parameterCount: 5
        },
        isAsync: true,
        isExported: true
      })),
      classes: [
        {
          name: 'LegacyUserManager',
          location: { filePath: 'src/legacy-user-manager.ts', line: 1, column: 1 },
          methods: [],
          properties: Array(12).fill('property'),
          isExported: true
        }
      ],
      imports: [],
      complexity: {
        cyclomaticComplexity: 25,
        cognitiveComplexity: 40,
        nestingDepth: 8,
        lineCount: 800,
        parameterCount: 5
      },
      lineCount: 800
    },
    testCoverage: {
      overallCoverage: 0.25,
      fileCoverage: new Map([['src/legacy-user-manager.ts', 0.15]]),
      functionCoverage: new Map()
    },
    usageFrequency: {
      functionCallCounts: new Map([['processUserData', 200]]),
      classUsageCounts: new Map([['LegacyUserManager', 150]]),
      fileAccessCounts: new Map([['src/legacy-user-manager.ts', 300]])
    },
    dependencyGraph: {
      fileDependencies: new Map([
        ['src/legacy-user-manager.ts', Array(15).fill('dependency')],
        // Simulate circular dependency
        ['src/dependency1.ts', ['src/legacy-user-manager.ts']]
      ]),
      functionDependencies: new Map(),
      classDependencies: new Map()
    },
    codebaseMetrics: {
      totalFiles: 200,
      totalLines: 100000,
      averageComplexity: 12,
      hotspotFiles: ['src/legacy-user-manager.ts']
    }
  };
}

function main() {
  console.log('🔧 Clean Code Effort Estimation Demo\n');
  
  const engine = new CleanCodeRecommendationEngine();
  const recommendations = createSampleRecommendations();
  
  console.log('📋 Sample Recommendations:');
  recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec.description}`);
    console.log(`     Type: ${rec.type}, Impact: ${rec.impact}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 EFFORT ESTIMATION COMPARISON');
  console.log('='.repeat(80));
  
  // Scenario 1: Low Risk Context
  console.log('\n🟢 LOW RISK SCENARIO (Well-tested, small codebase, good coverage)');
  console.log('-'.repeat(60));
  
  const lowRiskContext = createLowRiskContext();
  recommendations.forEach((rec, index) => {
    const estimate = engine.estimateEffort(rec, lowRiskContext);
    console.log(`\n${index + 1}. ${rec.description}`);
    console.log(`   ⏱️  Time: ${estimate.timeHours} hours`);
    console.log(`   🔧 Complexity: ${estimate.complexity}`);
    console.log(`   ⚠️  Risk: ${estimate.riskLevel}`);
    console.log(`   📋 Prerequisites: ${estimate.prerequisites.slice(0, 2).join(', ')}${estimate.prerequisites.length > 2 ? '...' : ''}`);
  });
  
  // Scenario 2: High Risk Context
  console.log('\n\n🔴 HIGH RISK SCENARIO (Legacy code, low coverage, complex dependencies)');
  console.log('-'.repeat(60));
  
  const highRiskContext = createHighRiskContext();
  recommendations.forEach((rec, index) => {
    const estimate = engine.estimateEffort(rec, highRiskContext);
    console.log(`\n${index + 1}. ${rec.description}`);
    console.log(`   ⏱️  Time: ${estimate.timeHours} hours`);
    console.log(`   🔧 Complexity: ${estimate.complexity}`);
    console.log(`   ⚠️  Risk: ${estimate.riskLevel}`);
    console.log(`   📋 Prerequisites: ${estimate.prerequisites.slice(0, 3).join(', ')}${estimate.prerequisites.length > 3 ? '...' : ''}`);
  });
  
  // Scenario 3: No Context (Baseline)
  console.log('\n\n⚪ BASELINE SCENARIO (No context information)');
  console.log('-'.repeat(60));
  
  recommendations.forEach((rec, index) => {
    const estimate = engine.estimateEffort(rec);
    console.log(`\n${index + 1}. ${rec.description}`);
    console.log(`   ⏱️  Time: ${estimate.timeHours} hours`);
    console.log(`   🔧 Complexity: ${estimate.complexity}`);
    console.log(`   ⚠️  Risk: ${estimate.riskLevel}`);
    console.log(`   📋 Prerequisites: ${estimate.prerequisites.slice(0, 2).join(', ')}${estimate.prerequisites.length > 2 ? '...' : ''}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 PRIORITIZED IMPLEMENTATION PLAN');
  console.log('='.repeat(80));
  
  const plan = engine.prioritizeRecommendations(recommendations);
  console.log(`\n📊 Total Effort: ${plan.totalEffort.timeHours} hours`);
  console.log(`🔧 Overall Complexity: ${plan.totalEffort.complexity}`);
  console.log(`⚠️  Overall Risk: ${plan.totalEffort.riskLevel}`);
  
  console.log('\n📋 Implementation Phases:');
  plan.phases.forEach((phase, index) => {
    console.log(`\n${index + 1}. ${phase.name}`);
    console.log(`   ⏱️  Estimated Effort: ${phase.estimatedEffort.timeHours} hours`);
    console.log(`   📝 Recommendations: ${phase.recommendations.length}`);
    if (phase.dependencies.length > 0) {
      console.log(`   🔗 Dependencies: ${phase.dependencies.join(', ')}`);
    }
  });
  
  console.log('\n✅ Demo completed! The effort estimation system considers:');
  console.log('   • Base effort by refactoring type');
  console.log('   • Code complexity multipliers');
  console.log('   • Usage frequency impact');
  console.log('   • Test coverage risk assessment');
  console.log('   • Dependency analysis');
  console.log('   • Codebase size and hotspot detection');
}

if (require.main === module) {
  main();
}