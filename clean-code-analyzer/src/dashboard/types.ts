export interface QualityMetrics {
  overallScore: number;
  complexity: number;
  maintainability: number;
  testability: number;
  readability: number;
  timestamp: Date;
}

export interface FileQuality {
  filePath: string;
  score: number;
  violations: Violation[];
  metrics: QualityMetrics;
}

export interface Violation {
  id: string;
  principle: CleanCodePrinciple;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  location: {
    line: number;
    column: number;
  };
  description: string;
  suggestion: string;
}

export interface CleanCodePrinciple {
  name: string;
  category: 'Naming' | 'Functions' | 'Classes' | 'Comments' | 'Error Handling' | 'Testing';
}

export interface DashboardData {
  projectOverview: {
    totalFiles: number;
    averageScore: number;
    totalViolations: number;
    improvementTrend: number;
  };
  qualityTrends: QualityMetrics[];
  fileQuality: FileQuality[];
  violationsByPrinciple: Record<string, number>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'analysis' | 'improvement' | 'violation';
  description: string;
  timestamp: Date;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}