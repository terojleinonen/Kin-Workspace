export interface QualityGateConfig {
  sourceDir: string;
  qualityGates: {
    minimumScore?: number;
    maxCriticalViolations?: number;
    minTestCoverage?: number;
    maxComplexity?: number;
    maxFunctionLength?: number;
  };
  notifications?: NotificationConfig;
}

export interface QualityComparison {
  baselineScore: number;
  currentScore: number;
  scoreDelta: number;
  improvements: string[];
  regressions: string[];
  recommendations: Recommendation[];
  reportUrl: string;
}

export interface Recommendation {
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';
  file?: string;
  line?: number;
}

export interface NotificationConfig {
  slack?: {
    webhookUrl: string;
    channel: string;
    onlyOnFailure?: boolean;
  };
  email?: {
    recipients: string[];
    smtpConfig: {
      host: string;
      port: number;
      username: string;
      password: string;
    };
    onlyOnRegression?: boolean;
  };
  teams?: {
    webhookUrl: string;
    onlyOnFailure?: boolean;
  };
}

export interface CIAnalysisResult {
  overallScore: number;
  qualityGatesPassed: boolean;
  violations: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  testCoverage?: number;
  recommendations: Recommendation[];
  reportPaths: {
    json: string;
    html: string;
    csv?: string;
  };
}

export interface TrendData {
  timestamp: string;
  commit: string;
  branch: string;
  score: number;
  violations: number;
  testCoverage?: number;
  author: string;
}

export interface QualityTrendReport {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  trends: TrendData[];
  summary: {
    averageScore: number;
    scoreImprovement: number;
    violationReduction: number;
    topContributors: string[];
  };
}