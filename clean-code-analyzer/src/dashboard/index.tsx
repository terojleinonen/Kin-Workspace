import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './components/Dashboard';
import './styles.css';

// Mock data for development
const mockData = {
  projectOverview: {
    totalFiles: 127,
    averageScore: 7.2,
    totalViolations: 89,
    improvementTrend: 12.5
  },
  qualityTrends: [
    {
      overallScore: 6.8,
      complexity: 5.2,
      maintainability: 7.1,
      testability: 6.5,
      readability: 7.8,
      timestamp: new Date('2024-01-01')
    },
    {
      overallScore: 7.0,
      complexity: 5.0,
      maintainability: 7.3,
      testability: 6.8,
      readability: 8.0,
      timestamp: new Date('2024-01-02')
    },
    {
      overallScore: 7.2,
      complexity: 4.8,
      maintainability: 7.5,
      testability: 7.0,
      readability: 8.1,
      timestamp: new Date('2024-01-03')
    }
  ],
  fileQuality: [
    {
      filePath: 'src/services/UserService.ts',
      score: 8.5,
      violations: [
        {
          id: 'v1',
          principle: { name: 'Single Responsibility', category: 'Functions' as const },
          severity: 'Medium' as const,
          location: { line: 45, column: 12 },
          description: 'Function handles multiple responsibilities',
          suggestion: 'Extract method for validation logic'
        }
      ],
      metrics: {
        overallScore: 8.5,
        complexity: 4.2,
        maintainability: 8.8,
        testability: 8.0,
        readability: 9.0,
        timestamp: new Date()
      }
    },
    {
      filePath: 'src/utils/DataProcessor.ts',
      score: 6.2,
      violations: [
        {
          id: 'v2',
          principle: { name: 'Naming Conventions', category: 'Naming' as const },
          severity: 'High' as const,
          location: { line: 23, column: 8 },
          description: 'Variable name is not descriptive',
          suggestion: 'Rename "data" to "processedUserData"'
        },
        {
          id: 'v3',
          principle: { name: 'Function Size', category: 'Functions' as const },
          severity: 'Critical' as const,
          location: { line: 67, column: 1 },
          description: 'Function exceeds 50 lines',
          suggestion: 'Break down into smaller functions'
        }
      ],
      metrics: {
        overallScore: 6.2,
        complexity: 7.8,
        maintainability: 5.5,
        testability: 6.0,
        readability: 6.8,
        timestamp: new Date()
      }
    }
  ],
  violationsByPrinciple: {
    'Naming Conventions': 25,
    'Function Size': 18,
    'Single Responsibility': 15,
    'Error Handling': 12,
    'Code Comments': 8,
    'Class Design': 11
  },
  recentActivity: [
    {
      id: '1',
      type: 'analysis' as const,
      description: 'Completed analysis of 45 TypeScript files',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      impact: 'neutral' as const
    },
    {
      id: '2',
      type: 'improvement' as const,
      description: 'Fixed 3 critical naming violations in UserService.ts',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      impact: 'positive' as const
    },
    {
      id: '3',
      type: 'violation' as const,
      description: 'New high-severity violation detected in PaymentProcessor.ts',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      impact: 'negative' as const
    }
  ]
};

const App: React.FC = () => {
  return <Dashboard initialData={mockData} />;
};

// Initialize the dashboard
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root container not found');
}