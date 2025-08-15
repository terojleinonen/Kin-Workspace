/**
 * Progress Tracker Tests - Baseline establishment and historical tracking
 */

import { CleanCodeProgressTracker, ProgressTracker } from '../../src/analyzer/progress-tracker';
import { BatchAnalysis, FileAnalysis } from '../../src/analyzer/file-parser';
import { QualityReport, OverallQuality } from '../../src/analyzer/quality-assessor';
import { CleanCodePrinciple, Severity } from '../../src/types';
import * as fs from 'fs';
import * as path from 'path';

describe('ProgressTracker', () => {
  let progressTracker: ProgressTracker;
  let tempDir: string;

  beforeEach(() => {
    // Create temporary directory for test data
    tempDir = path.join(__dirname, '../fixtures/temp-progress');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    progressTracker = new CleanCodeProgressTracker(tempDir);
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('recordBaseline', () => {
    it('should record initial baseline from batch analysis', async () => {
      // Arrange
      const batchAnalysis = createMockBatchAnalysis();

      // Act
      const baseline = await progressTracker.recordBaseline(batchAnalysis);

      // Assert
      expect(baseline).toBeDefined();
      expect(baseline.id).toBeDefined();
      expect(baseline.timestamp).toBeInstanceOf(Date);
      expect(baseline.projectName).toBe('test-project');
      expect(baseline.totalFiles).toBe(2);
      expect(baseline.overallMetrics).toBeDefined();
      expect(baseline.fileMetrics).toHaveLength(2);
    });

    it('should save baseline to storage', async () => {
      // Arrange
      const batchAnalysis = createMockBatchAnalysis();

      // Act
      const baseline = await progressTracker.recordBaseline(batchAnalysis);

      // Assert
      const baselineFile = path.join(tempDir, 'baselines', `${baseline.id}.json`);
      expect(fs.existsSync(baselineFile)).toBe(true);
      
      const savedBaseline = JSON.parse(fs.readFileSync(baselineFile, 'utf-8'));
      expect(savedBaseline.id).toBe(baseline.id);
      expect(savedBaseline.projectName).toBe('test-project');
    });

    it('should handle empty batch analysis', async () => {
      // Arrange
      const emptyBatch: BatchAnalysis = {
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

      // Act
      const baseline = await progressTracker.recordBaseline(emptyBatch);

      // Assert
      expect(baseline.totalFiles).toBe(0);
      expect(baseline.fileMetrics).toHaveLength(0);
      expect(baseline.overallMetrics.averageComplexity).toBe(0);
    });

    it('should generate unique baseline IDs', async () => {
      // Arrange
      const batchAnalysis = createMockBatchAnalysis();

      // Act
      const baseline1 = await progressTracker.recordBaseline(batchAnalysis);
      const baseline2 = await progressTracker.recordBaseline(batchAnalysis);

      // Assert
      expect(baseline1.id).not.toBe(baseline2.id);
    });
  });

  describe('compareBaselines', () => {
    it('should compare two baselines and calculate differences', async () => {
      // Arrange
      const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
      const improvedBatch = createImprovedBatchAnalysis();
      const baseline2 = await progressTracker.recordBaseline(improvedBatch);

      // Act
      const comparison = await progressTracker.compareBaselines(baseline1.id, baseline2.id);

      // Assert
      expect(comparison).toBeDefined();
      expect(comparison.baselineId).toBe(baseline1.id);
      expect(comparison.comparisonId).toBe(baseline2.id);
      expect(comparison.overallImprovement).toBeGreaterThan(0);
      expect(comparison.fileComparisons).toHaveLength(2);
    });

    it('should calculate percentage improvements correctly', async () => {
      // Arrange
      const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
      const improvedBatch = createImprovedBatchAnalysis();
      const baseline2 = await progressTracker.recordBaseline(improvedBatch);

      // Act
      const comparison = await progressTracker.compareBaselines(baseline1.id, baseline2.id);

      // Assert
      expect(comparison.complexityImprovement).toBeGreaterThan(0);
      expect(comparison.qualityImprovement).toBeGreaterThan(0);
      expect(comparison.fileComparisons[0].complexityChange).toBeLessThan(0); // Negative means complexity decreased (improvement)
    });

    it('should throw error for non-existent baseline IDs', async () => {
      // Act & Assert
      await expect(progressTracker.compareBaselines('non-existent-1', 'non-existent-2'))
        .rejects.toThrow('Baseline not found');
    });
  });

  describe('calculateTrends', () => {
    it('should calculate trends over multiple baselines', async () => {
      // Arrange
      const baselines = [];
      baselines.push(await progressTracker.recordBaseline(createMockBatchAnalysis()));
      
      // Simulate time progression with improvements
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay for different timestamps
      baselines.push(await progressTracker.recordBaseline(createImprovedBatchAnalysis()));
      
      await new Promise(resolve => setTimeout(resolve, 10));
      baselines.push(await progressTracker.recordBaseline(createFurtherImprovedBatchAnalysis()));

      // Act
      const trends = await progressTracker.calculateTrends(
        baselines[0].timestamp,
        baselines[2].timestamp
      );

      // Assert
      expect(trends).toBeDefined();
      expect(trends.timeRange.start).toEqual(baselines[0].timestamp);
      expect(trends.timeRange.end).toEqual(baselines[2].timestamp);
      expect(trends.complexityTrend.direction).toBe('improving');
      expect(trends.qualityTrend.direction).toBe('improving');
      expect(trends.dataPoints).toHaveLength(3);
    });

    it('should identify declining trends', async () => {
      // Arrange
      const baselines = [];
      baselines.push(await progressTracker.recordBaseline(createImprovedBatchAnalysis()));
      
      await new Promise(resolve => setTimeout(resolve, 10));
      baselines.push(await progressTracker.recordBaseline(createMockBatchAnalysis())); // Regression

      // Act
      const trends = await progressTracker.calculateTrends(
        baselines[0].timestamp,
        baselines[1].timestamp
      );

      // Assert
      expect(trends.complexityTrend.direction).toBe('declining');
      expect(trends.qualityTrend.direction).toBe('declining');
    });

    it('should handle stable trends', async () => {
      // Arrange
      const baselines = [];
      const sameBatch = createMockBatchAnalysis();
      baselines.push(await progressTracker.recordBaseline(sameBatch));
      
      await new Promise(resolve => setTimeout(resolve, 10));
      baselines.push(await progressTracker.recordBaseline(sameBatch));

      // Act
      const trends = await progressTracker.calculateTrends(
        baselines[0].timestamp,
        baselines[1].timestamp
      );

      // Assert
      expect(trends.complexityTrend.direction).toBe('stable');
      expect(trends.qualityTrend.direction).toBe('stable');
    });
  });

  describe('getBaselineHistory', () => {
    it('should retrieve all baselines in chronological order', async () => {
      // Arrange
      const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
      await new Promise(resolve => setTimeout(resolve, 10));
      const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());

      // Act
      const history = await progressTracker.getBaselineHistory();

      // Assert
      expect(history).toHaveLength(2);
      expect(history[0].timestamp.getTime()).toBeLessThan(history[1].timestamp.getTime());
      expect(history[0].id).toBe(baseline1.id);
      expect(history[1].id).toBe(baseline2.id);
    });

    it('should return empty array when no baselines exist', async () => {
      // Act
      const history = await progressTracker.getBaselineHistory();

      // Assert
      expect(history).toHaveLength(0);
    });
  });

  describe('getLatestBaseline', () => {
    it('should return the most recent baseline', async () => {
      // Arrange
      await progressTracker.recordBaseline(createMockBatchAnalysis());
      await new Promise(resolve => setTimeout(resolve, 10));
      const latest = await progressTracker.recordBaseline(createImprovedBatchAnalysis());

      // Act
      const result = await progressTracker.getLatestBaseline();

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(latest.id);
    });

    it('should return null when no baselines exist', async () => {
      // Act
      const result = await progressTracker.getLatestBaseline();

      // Assert
      expect(result).toBeNull();
    });
  });

  // Additional tests for improvement tracking functionality
  describe('Improvement Tracking', () => {
    describe('trackImprovement', () => {
      it('should track improvement between two baselines', async () => {
        // Arrange
        const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
        const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());
        const timeInvested = 4.5; // hours
        const contributor = 'john.doe';

        // Act
        const improvement = await progressTracker.trackImprovement(
          baseline1.id, 
          baseline2.id, 
          timeInvested, 
          contributor
        );

        // Assert
        expect(improvement).toBeDefined();
        expect(improvement.id).toBeDefined();
        expect(improvement.timestamp).toBeInstanceOf(Date);
        expect(improvement.baselineId).toBe(baseline1.id);
        expect(improvement.comparisonId).toBe(baseline2.id);
        expect(improvement.timeInvested).toBe(timeInvested);
        expect(improvement.contributor).toBe(contributor);
        expect(improvement.qualityImprovement).toBeGreaterThan(0);
        expect(improvement.complexityReduction).toBeGreaterThan(0);
        expect(improvement.filesImproved).toBeGreaterThan(0);
        expect(improvement.violationsFixed).toBeGreaterThanOrEqual(0);
      });

      it('should save improvement to storage', async () => {
        // Arrange
        const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
        const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());

        // Act
        const improvement = await progressTracker.trackImprovement(baseline1.id, baseline2.id, 2.0);

        // Assert
        const improvementFile = path.join(tempDir, 'improvements', `${improvement.id}.json`);
        expect(fs.existsSync(improvementFile)).toBe(true);
        
        const savedImprovement = JSON.parse(fs.readFileSync(improvementFile, 'utf-8'));
        expect(savedImprovement.id).toBe(improvement.id);
        expect(savedImprovement.timeInvested).toBe(2.0);
      });

      it('should handle improvement tracking without contributor', async () => {
        // Arrange
        const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
        const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());

        // Act
        const improvement = await progressTracker.trackImprovement(baseline1.id, baseline2.id, 1.5);

        // Assert
        expect(improvement.contributor).toBeUndefined();
        expect(improvement.timeInvested).toBe(1.5);
      });

      it('should throw error for non-existent baselines', async () => {
        // Act & Assert
        await expect(progressTracker.trackImprovement('non-existent-1', 'non-existent-2', 1.0))
          .rejects.toThrow('Baseline not found');
      });
    });

    describe('calculateROI', () => {
      it('should calculate ROI for an improvement', async () => {
        // Arrange
        const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
        const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());
        const improvement = await progressTracker.trackImprovement(baseline1.id, baseline2.id, 4.0);

        // Act
        const roi = await progressTracker.calculateROI(improvement.id);

        // Assert
        expect(roi).toBeDefined();
        expect(roi.improvementId).toBe(improvement.id);
        expect(roi.timeInvested).toBe(4.0);
        expect(roi.qualityGain).toBeGreaterThan(0);
        expect(roi.complexityReduction).toBeGreaterThan(0);
        expect(roi.estimatedMaintenanceTimeSaved).toBeGreaterThan(0);
        expect(roi.roi).toBeDefined();
        expect(roi.paybackPeriod).toBeGreaterThan(0);
      });

      it('should calculate positive ROI for significant improvements', async () => {
        // Arrange
        const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
        const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());
        const improvement = await progressTracker.trackImprovement(baseline1.id, baseline2.id, 2.0); // Small time investment

        // Act
        const roi = await progressTracker.calculateROI(improvement.id);

        // Assert
        expect(roi.roi).toBeGreaterThan(0); // Should have positive ROI
        expect(roi.paybackPeriod).toBeLessThan(12); // Should pay back within a year
      });

      it('should handle zero time investment', async () => {
        // Arrange
        const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
        const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());
        const improvement = await progressTracker.trackImprovement(baseline1.id, baseline2.id, 0);

        // Act
        const roi = await progressTracker.calculateROI(improvement.id);

        // Assert
        expect(roi.roi).toBe(0);
        expect(roi.timeInvested).toBe(0);
      });

      it('should throw error for non-existent improvement', async () => {
        // Act & Assert
        await expect(progressTracker.calculateROI('non-existent-improvement'))
          .rejects.toThrow('Improvement not found');
      });
    });

    describe('getTeamPerformance', () => {
      it('should calculate team performance metrics', async () => {
        // Arrange
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
        const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
        
        const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
        const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());
        
        await progressTracker.trackImprovement(baseline1.id, baseline2.id, 3.0, 'alice');
        await progressTracker.trackImprovement(baseline1.id, baseline2.id, 2.5, 'bob');

        // Act
        const teamPerformance = await progressTracker.getTeamPerformance('team-1', { start: startDate, end: endDate });

        // Assert
        expect(teamPerformance).toBeDefined();
        expect(teamPerformance.teamId).toBe('team-1');
        expect(teamPerformance.period.start).toEqual(startDate);
        expect(teamPerformance.period.end).toEqual(endDate);
        expect(teamPerformance.contributors).toHaveLength(2);
        expect(teamPerformance.totalImprovements).toBe(2);
        expect(teamPerformance.totalTimeInvested).toBe(5.5);
        expect(teamPerformance.teamROI).toBeDefined();
      });

      it('should calculate individual contributor metrics', async () => {
        // Arrange
        const period = { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date(Date.now() + 24 * 60 * 60 * 1000) };
        
        const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
        const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());
        const baseline3 = await progressTracker.recordBaseline(createFurtherImprovedBatchAnalysis());
        
        await progressTracker.trackImprovement(baseline1.id, baseline2.id, 4.0, 'alice');
        await progressTracker.trackImprovement(baseline2.id, baseline3.id, 2.0, 'alice');

        // Act
        const teamPerformance = await progressTracker.getTeamPerformance('team-1', period);

        // Assert
        const alice = teamPerformance.contributors.find((c: any) => c.contributorId === 'alice');
        expect(alice).toBeDefined();
        expect(alice!.improvementsCount).toBe(2);
        expect(alice!.totalTimeInvested).toBe(6.0);
        expect(alice!.averageQualityImprovement).toBeGreaterThan(0);
        expect(alice!.individualROI).toBeDefined();
      });

      it('should handle empty team performance', async () => {
        // Arrange
        const period = { start: new Date('2024-01-01'), end: new Date('2024-01-31') };

        // Act
        const teamPerformance = await progressTracker.getTeamPerformance('empty-team', period);

        // Assert
        expect(teamPerformance.contributors).toHaveLength(0);
        expect(teamPerformance.totalImprovements).toBe(0);
        expect(teamPerformance.totalTimeInvested).toBe(0);
      });
    });

    describe('getProgressVisualizationData', () => {
      it('should generate comprehensive visualization data', async () => {
        // Arrange
        const period = { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date(Date.now() + 24 * 60 * 60 * 1000) };
        
        const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
        await new Promise(resolve => setTimeout(resolve, 10));
        const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());
        await new Promise(resolve => setTimeout(resolve, 10));
        const baseline3 = await progressTracker.recordBaseline(createFurtherImprovedBatchAnalysis());
        
        await progressTracker.trackImprovement(baseline1.id, baseline2.id, 3.0, 'alice');
        await progressTracker.trackImprovement(baseline2.id, baseline3.id, 2.0, 'bob');

        // Act
        const vizData = await progressTracker.getProgressVisualizationData(period);

        // Assert
        expect(vizData).toBeDefined();
        expect(vizData.timeSeriesData).toHaveLength(3);
        expect(vizData.improvementHeatmap).toBeDefined();
        expect(vizData.roiTrends).toBeDefined();
        expect(vizData.teamComparison).toHaveLength(2);
      });

      it('should create time series data with correct structure', async () => {
        // Arrange
        const period = { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date(Date.now() + 24 * 60 * 60 * 1000) };
        const baseline = await progressTracker.recordBaseline(createMockBatchAnalysis());

        // Act
        const vizData = await progressTracker.getProgressVisualizationData(period);

        // Assert
        expect(vizData.timeSeriesData).toHaveLength(1);
        const dataPoint = vizData.timeSeriesData[0];
        expect(dataPoint.timestamp).toBeInstanceOf(Date);
        expect(dataPoint.qualityScore).toBeDefined();
        expect(dataPoint.complexityScore).toBeDefined();
        expect(dataPoint.violationCount).toBeDefined();
        expect(dataPoint.improvementCount).toBeDefined();
      });

      it('should generate improvement heatmap data', async () => {
        // Arrange
        const period = { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date(Date.now() + 24 * 60 * 60 * 1000) };
        
        const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
        const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());
        
        await progressTracker.trackImprovement(baseline1.id, baseline2.id, 2.0, 'alice');

        // Act
        const vizData = await progressTracker.getProgressVisualizationData(period);

        // Assert
        expect(vizData.improvementHeatmap.length).toBeGreaterThan(0);
        const heatmapItem = vizData.improvementHeatmap[0];
        expect(heatmapItem.filePath).toBeDefined();
        expect(heatmapItem.improvementCount).toBeGreaterThan(0);
        expect(heatmapItem.qualityGain).toBeGreaterThan(0);
        expect(heatmapItem.lastImprovement).toBeInstanceOf(Date);
        expect(heatmapItem.contributor).toBe('alice');
      });

      it('should generate team comparison data', async () => {
        // Arrange
        const period = { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date(Date.now() + 24 * 60 * 60 * 1000) };
        
        const baseline1 = await progressTracker.recordBaseline(createMockBatchAnalysis());
        const baseline2 = await progressTracker.recordBaseline(createImprovedBatchAnalysis());
        
        await progressTracker.trackImprovement(baseline1.id, baseline2.id, 3.0, 'alice');
        await progressTracker.trackImprovement(baseline1.id, baseline2.id, 4.0, 'bob');

        // Act
        const vizData = await progressTracker.getProgressVisualizationData(period);

        // Assert
        expect(vizData.teamComparison).toHaveLength(2);
        const aliceData = vizData.teamComparison.find((tc: any) => tc.contributorId === 'alice');
        const bobData = vizData.teamComparison.find((tc: any) => tc.contributorId === 'bob');
        
        expect(aliceData).toBeDefined();
        expect(bobData).toBeDefined();
        expect(aliceData!.qualityScore).toBeGreaterThan(0);
        expect(bobData!.qualityScore).toBeGreaterThan(0);
      });

      it('should handle empty visualization data', async () => {
        // Arrange
        const period = { start: new Date('2024-01-01'), end: new Date('2024-01-31') };

        // Act
        const vizData = await progressTracker.getProgressVisualizationData(period);

        // Assert
        expect(vizData.timeSeriesData).toHaveLength(0);
        expect(vizData.improvementHeatmap).toHaveLength(0);
        expect(vizData.roiTrends).toHaveLength(0);
        expect(vizData.teamComparison).toHaveLength(0);
      });
    });
  });
});

// Helper functions to create mock data
function createMockBatchAnalysis(): BatchAnalysis {
  const fileAnalysis1: FileAnalysis = {
    filePath: '/test/file1.ts',
    functions: [
      {
        name: 'testFunction1',
        location: { filePath: '/test/file1.ts', line: 1, column: 1 },
        parameters: ['param1', 'param2'],
        complexity: {
          cyclomaticComplexity: 5,
          cognitiveComplexity: 8,
          nestingDepth: 3,
          lineCount: 25,
          parameterCount: 2
        },
        isAsync: false,
        isExported: true
      }
    ],
    classes: [],
    imports: [],
    complexity: {
      cyclomaticComplexity: 5,
      cognitiveComplexity: 8,
      nestingDepth: 3,
      lineCount: 50,
      parameterCount: 2
    },
    lineCount: 50
  };

  const fileAnalysis2: FileAnalysis = {
    filePath: '/test/file2.ts',
    functions: [
      {
        name: 'testFunction2',
        location: { filePath: '/test/file2.ts', line: 1, column: 1 },
        parameters: ['param1'],
        complexity: {
          cyclomaticComplexity: 3,
          cognitiveComplexity: 4,
          nestingDepth: 2,
          lineCount: 15,
          parameterCount: 1
        },
        isAsync: true,
        isExported: false
      }
    ],
    classes: [],
    imports: [],
    complexity: {
      cyclomaticComplexity: 3,
      cognitiveComplexity: 4,
      nestingDepth: 2,
      lineCount: 30,
      parameterCount: 1
    },
    lineCount: 30
  };

  return {
    files: [fileAnalysis1, fileAnalysis2],
    totalFiles: 2,
    overallComplexity: {
      cyclomaticComplexity: 4,
      cognitiveComplexity: 6,
      nestingDepth: 3,
      lineCount: 80,
      parameterCount: 1.5
    }
  };
}

function createImprovedBatchAnalysis(): BatchAnalysis {
  const batch = createMockBatchAnalysis();
  
  // Improve complexity metrics significantly
  batch.files[0].complexity.cyclomaticComplexity = 2; // Reduced from 5
  batch.files[0].complexity.cognitiveComplexity = 3; // Reduced from 8
  batch.files[0].complexity.nestingDepth = 1; // Reduced from 3
  batch.files[0].complexity.lineCount = 30; // Reduced from 50
  batch.files[0].functions[0].complexity.cyclomaticComplexity = 2;
  batch.files[0].functions[0].complexity.cognitiveComplexity = 3;
  batch.files[0].functions[0].complexity.nestingDepth = 1;
  batch.files[0].functions[0].complexity.lineCount = 15; // Reduced from 25
  
  batch.files[1].complexity.cyclomaticComplexity = 1; // Reduced from 3
  batch.files[1].complexity.cognitiveComplexity = 2; // Reduced from 4
  batch.files[1].complexity.nestingDepth = 1; // Reduced from 2
  batch.files[1].complexity.lineCount = 20; // Reduced from 30
  batch.files[1].functions[0].complexity.cyclomaticComplexity = 1;
  batch.files[1].functions[0].complexity.cognitiveComplexity = 2;
  batch.files[1].functions[0].complexity.nestingDepth = 1;
  batch.files[1].functions[0].complexity.lineCount = 10; // Reduced from 15
  
  // Update overall complexity
  batch.overallComplexity.cyclomaticComplexity = 1.5;
  batch.overallComplexity.cognitiveComplexity = 2.5;
  batch.overallComplexity.nestingDepth = 1;
  batch.overallComplexity.lineCount = 50; // Reduced from 80
  
  return batch;
}

function createFurtherImprovedBatchAnalysis(): BatchAnalysis {
  const batch = createImprovedBatchAnalysis();
  
  // Further improve complexity metrics
  batch.files[0].complexity.cyclomaticComplexity = 2;
  batch.files[0].complexity.cognitiveComplexity = 3;
  batch.files[0].functions[0].complexity.cyclomaticComplexity = 2;
  batch.files[0].functions[0].complexity.cognitiveComplexity = 3;
  
  batch.files[1].complexity.cyclomaticComplexity = 1;
  batch.files[1].complexity.cognitiveComplexity = 2;
  batch.files[1].functions[0].complexity.cyclomaticComplexity = 1;
  batch.files[1].functions[0].complexity.cognitiveComplexity = 2;
  
  // Update overall complexity
  batch.overallComplexity.cyclomaticComplexity = 1.5;
  batch.overallComplexity.cognitiveComplexity = 2.5;
  
  return batch;
}

