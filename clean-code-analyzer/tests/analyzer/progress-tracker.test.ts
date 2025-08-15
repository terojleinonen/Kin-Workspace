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