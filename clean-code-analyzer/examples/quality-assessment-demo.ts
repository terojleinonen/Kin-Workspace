/**
 * Demo script showing the CleanCodeAssessor in action
 */

import { TypeScriptAnalyzer } from '../src/analyzer/file-parser';
import { CleanCodeAssessor } from '../src/analyzer/quality-assessor';
import { CleanCodePrinciple } from '../src/types';

async function demonstrateQualityAssessment() {
  const analyzer = new TypeScriptAnalyzer();
  const assessor = new CleanCodeAssessor();

  // Analyze the naming analyzer file as an example
  const filePath = './src/analyzer/naming-analyzer.ts';
  
  try {
    console.log('🔍 Analyzing file:', filePath);
    console.log('=' .repeat(50));

    // Parse the file
    const analysis = await analyzer.analyzeFile(filePath);
    console.log(`📊 File Analysis Results:`);
    console.log(`  - Functions: ${analysis.functions.length}`);
    console.log(`  - Classes: ${analysis.classes.length}`);
    console.log(`  - Lines: ${analysis.lineCount}`);
    console.log(`  - Complexity: ${analysis.complexity.cyclomaticComplexity}`);
    console.log();

    // Assess quality
    const qualityReport = assessor.assessFile(analysis);
    console.log(`📈 Quality Assessment Results:`);
    console.log(`  - Overall Score: ${(qualityReport.overallScore * 100).toFixed(1)}%`);
    console.log(`  - Total Violations: ${qualityReport.violations.length}`);
    console.log();

    // Show principle scores
    console.log(`📋 Principle Breakdown:`);
    for (const [principle, score] of qualityReport.principleScores) {
      const percentage = score.maxScore > 0 ? (score.score / score.maxScore * 100).toFixed(1) : '0.0';
      console.log(`  - ${principle}: ${percentage}% (${score.violations.length} violations)`);
    }
    console.log();

    // Show top violations
    if (qualityReport.violations.length > 0) {
      console.log(`⚠️  Top Violations:`);
      qualityReport.violations.slice(0, 5).forEach((violation, index) => {
        console.log(`  ${index + 1}. [${violation.severity.toUpperCase()}] ${violation.description}`);
        console.log(`     → ${violation.suggestion}`);
        console.log(`     @ Line ${violation.location.line}`);
        console.log();
      });
    }

    // Show strengths
    if (qualityReport.strengths.length > 0) {
      console.log(`✅ Strengths:`);
      qualityReport.strengths.forEach(strength => {
        console.log(`  - ${strength}`);
      });
      console.log();
    }

    // Test individual principle assessment
    console.log(`🎯 Individual Principle Assessment:`);
    const namingScore = assessor.assessPrinciple(CleanCodePrinciple.NAMING, analysis);
    console.log(`  - Naming Principle: ${namingScore.score}/${namingScore.maxScore} (${namingScore.violations.length} violations)`);

    const functionScore = assessor.assessPrinciple(CleanCodePrinciple.FUNCTIONS, analysis);
    console.log(`  - Function Principle: ${functionScore.score}/${functionScore.maxScore} (${functionScore.violations.length} violations)`);

  } catch (error) {
    console.error('❌ Error during assessment:', error);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateQualityAssessment();
}

export { demonstrateQualityAssessment };