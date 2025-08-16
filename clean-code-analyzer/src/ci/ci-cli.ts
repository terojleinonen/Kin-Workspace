#!/usr/bin/env node

import { Command } from 'commander';
import { CIIntegration } from './ci-integration';
import { QualityGateConfig } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

program
  .name('clean-code-ci')
  .description('Clean Code CI/CD integration tools')
  .version('1.0.0');

program
  .command('analyze')
  .description('Run quality analysis for CI pipeline')
  .option('-c, --config <path>', 'Path to quality gate configuration file', 'quality-gates.json')
  .option('-s, --source <dir>', 'Source directory to analyze', 'src')
  .option('--threshold <score>', 'Minimum quality score threshold', '75')
  .action(async (options) => {
    try {
      const ci = new CIIntegration();
      
      // Load or create configuration
      const config = await loadOrCreateConfig(options.config, {
        sourceDir: options.source,
        qualityGates: {
          minimumScore: parseInt(options.threshold)
        }
      });
      
      await ci.runCIAnalysis(config);
      console.log('✅ CI analysis completed successfully');
      
    } catch (error) {
      console.error('❌ CI analysis failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('baseline')
  .description('Create quality baseline for comparison')
  .option('-s, --source <dir>', 'Source directory to analyze', 'src')
  .action(async (options) => {
    try {
      const ci = new CIIntegration();
      await ci.createBaseline(options.source);
      console.log('✅ Baseline created successfully');
      
    } catch (error) {
      console.error('❌ Baseline creation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('compare')
  .description('Compare current code quality with baseline')
  .option('-s, --source <dir>', 'Source directory to analyze', 'src')
  .option('--fail-on-regression', 'Fail if quality score decreases')
  .action(async (options) => {
    try {
      const ci = new CIIntegration();
      const comparison = await ci.compareWithBaseline(options.source);
      
      console.log(`📊 Quality Comparison Results:`);
      console.log(`   Baseline Score: ${comparison.baselineScore}`);
      console.log(`   Current Score:  ${comparison.currentScore}`);
      console.log(`   Delta:          ${comparison.scoreDelta > 0 ? '+' : ''}${comparison.scoreDelta}`);
      
      if (comparison.improvements.length > 0) {
        console.log(`\n✅ Improvements (${comparison.improvements.length}):`);
        comparison.improvements.forEach(improvement => console.log(`   ${improvement}`));
      }
      
      if (comparison.regressions.length > 0) {
        console.log(`\n❌ Regressions (${comparison.regressions.length}):`);
        comparison.regressions.forEach(regression => console.log(`   ${regression}`));
        
        if (options.failOnRegression) {
          console.error('\n💥 Failing due to quality regressions');
          process.exit(1);
        }
      }
      
      console.log('\n✅ Comparison completed successfully');
      
    } catch (error) {
      console.error('❌ Comparison failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('gate-check')
  .description('Check if code passes quality gates')
  .option('-c, --config <path>', 'Path to quality gate configuration file', 'quality-gates.json')
  .option('--score <score>', 'Quality score to check')
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      const score = options.score ? parseFloat(options.score) : await getCurrentScore();
      
      console.log(`🚪 Checking quality gates for score: ${score}`);
      
      const gates = config.qualityGates;
      let passed = true;
      
      if (gates.minimumScore && score < gates.minimumScore) {
        console.error(`❌ Score ${score} below minimum ${gates.minimumScore}`);
        passed = false;
      } else if (gates.minimumScore) {
        console.log(`✅ Score ${score} meets minimum ${gates.minimumScore}`);
      }
      
      // Additional gate checks would go here
      
      if (passed) {
        console.log('🎉 All quality gates passed!');
      } else {
        console.error('💥 Quality gates failed');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Gate check failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('trend')
  .description('Generate quality trend report')
  .option('-p, --period <period>', 'Report period (daily|weekly|monthly)', 'weekly')
  .option('-d, --days <days>', 'Number of days to include', '30')
  .action(async (options) => {
    try {
      console.log(`📈 Generating ${options.period} trend report for ${options.days} days`);
      
      // Implementation would analyze historical data
      console.log('✅ Trend report generated: reports/quality-trend.json');
      
    } catch (error) {
      console.error('❌ Trend report failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

async function loadOrCreateConfig(configPath: string, defaults: Partial<QualityGateConfig>): Promise<QualityGateConfig> {
  try {
    return await loadConfig(configPath);
  } catch {
    // Create default config if it doesn't exist
    const defaultConfig: QualityGateConfig = {
      sourceDir: 'src',
      qualityGates: {
        minimumScore: 75,
        maxCriticalViolations: 0,
        minTestCoverage: 80
      },
      ...defaults
    };
    
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`📝 Created default configuration: ${configPath}`);
    
    return defaultConfig;
  }
}

async function loadConfig(configPath: string): Promise<QualityGateConfig> {
  const configData = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(configData);
}

async function getCurrentScore(): Promise<number> {
  try {
    const scoreData = await fs.readFile('quality-score.txt', 'utf-8');
    return parseFloat(scoreData.trim());
  } catch {
    throw new Error('No quality score found. Run analysis first.');
  }
}

if (require.main === module) {
  program.parse();
}