import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { DashboardData, QualityMetrics, ActivityItem } from './types';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock data for demonstration
const generateMockData = (): DashboardData => {
  const now = new Date();
  const qualityTrends: QualityMetrics[] = [];
  
  // Generate 30 days of mock trend data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    qualityTrends.push({
      overallScore: 6.5 + Math.random() * 2 + (i * 0.02), // Slight upward trend
      complexity: 5.0 + Math.random() * 2,
      maintainability: 7.0 + Math.random() * 1.5,
      testability: 6.0 + Math.random() * 2,
      readability: 7.5 + Math.random() * 1.5,
      timestamp: date
    });
  }

  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'analysis',
      description: 'Completed analysis of 45 TypeScript files',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      impact: 'neutral'
    },
    {
      id: '2',
      type: 'improvement',
      description: 'Fixed 3 critical naming violations in UserService.ts',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      impact: 'positive'
    },
    {
      id: '3',
      type: 'violation',
      description: 'New high-severity violation detected in PaymentProcessor.ts',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      impact: 'negative'
    },
    {
      id: '4',
      type: 'improvement',
      description: 'Refactored large function in DataAnalyzer.ts',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      impact: 'positive'
    },
    {
      id: '5',
      type: 'analysis',
      description: 'Baseline quality metrics established',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      impact: 'neutral'
    }
  ];

  return {
    projectOverview: {
      totalFiles: 127,
      averageScore: 7.2,
      totalViolations: 89,
      improvementTrend: 12.5
    },
    qualityTrends,
    fileQuality: [
      {
        filePath: 'src/services/UserService.ts',
        score: 8.5,
        violations: [
          {
            id: 'v1',
            principle: { name: 'Single Responsibility', category: 'Functions' },
            severity: 'Medium',
            location: { line: 45, column: 12 },
            description: 'Function handles multiple responsibilities',
            suggestion: 'Extract method for validation logic'
          }
        ],
        metrics: qualityTrends[qualityTrends.length - 1]
      },
      {
        filePath: 'src/utils/DataProcessor.ts',
        score: 6.2,
        violations: [
          {
            id: 'v2',
            principle: { name: 'Naming Conventions', category: 'Naming' },
            severity: 'High',
            location: { line: 23, column: 8 },
            description: 'Variable name is not descriptive',
            suggestion: 'Rename "data" to "processedUserData"'
          },
          {
            id: 'v3',
            principle: { name: 'Function Size', category: 'Functions' },
            severity: 'Critical',
            location: { line: 67, column: 1 },
            description: 'Function exceeds 50 lines',
            suggestion: 'Break down into smaller functions'
          }
        ],
        metrics: qualityTrends[qualityTrends.length - 1]
      },
      {
        filePath: 'src/components/Dashboard.tsx',
        score: 9.1,
        violations: [],
        metrics: qualityTrends[qualityTrends.length - 1]
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
    recentActivity
  };
};

// Store connected clients
const clients = new Set<any>();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  clients.add(ws);

  // Send initial data
  ws.send(JSON.stringify({
    type: 'dashboard-update',
    data: generateMockData()
  }));

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast updates to all connected clients
const broadcastUpdate = (type: string, data: any) => {
  const message = JSON.stringify({ type, data });
  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
};

// API Routes
app.get('/api/dashboard', (req, res) => {
  try {
    const data = generateMockData();
    res.json(data);
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    res.status(500).json({ error: 'Failed to generate dashboard data' });
  }
});

app.post('/api/analysis/trigger', (req, res) => {
  // Simulate triggering a new analysis
  setTimeout(() => {
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      type: 'analysis',
      description: 'Analysis completed for updated files',
      timestamp: new Date(),
      impact: 'neutral'
    };

    broadcastUpdate('activity-update', newActivity);
    
    // Simulate quality metrics update
    const newMetrics: QualityMetrics = {
      overallScore: 7.0 + Math.random() * 2,
      complexity: 5.0 + Math.random() * 2,
      maintainability: 7.0 + Math.random() * 1.5,
      testability: 6.0 + Math.random() * 2,
      readability: 7.5 + Math.random() * 1.5,
      timestamp: new Date()
    };

    broadcastUpdate('quality-metrics-update', newMetrics);
  }, 2000);

  res.json({ message: 'Analysis triggered successfully' });
});

// Serve the dashboard HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Clean Code Dashboard</title>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script>
            // This would normally be bundled, but for demo purposes we'll show a simple message
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(
                React.createElement('div', {
                    className: 'min-h-screen bg-gray-50 flex items-center justify-center'
                }, [
                    React.createElement('div', {
                        key: 'content',
                        className: 'text-center'
                    }, [
                        React.createElement('h1', {
                            key: 'title',
                            className: 'text-4xl font-bold text-gray-900 mb-4'
                        }, 'Clean Code Dashboard'),
                        React.createElement('p', {
                            key: 'subtitle',
                            className: 'text-gray-600 mb-8'
                        }, 'Dashboard server is running successfully!'),
                        React.createElement('div', {
                            key: 'info',
                            className: 'bg-white p-6 rounded-lg shadow-sm border max-w-md'
                        }, [
                            React.createElement('h2', {
                                key: 'api-title',
                                className: 'text-lg font-semibold mb-4'
                            }, 'Available Endpoints:'),
                            React.createElement('ul', {
                                key: 'endpoints',
                                className: 'text-left space-y-2 text-sm'
                            }, [
                                React.createElement('li', { key: 'e1' }, '• GET /api/dashboard - Dashboard data'),
                                React.createElement('li', { key: 'e2' }, '• POST /api/analysis/trigger - Trigger analysis'),
                                React.createElement('li', { key: 'e3' }, '• WebSocket on port 8080 - Real-time updates')
                            ])
                        ])
                    ])
                ])
            );
        </script>
    </body>
    </html>
  `);
});

// Simulate periodic updates for demo
setInterval(() => {
  const randomActivity: ActivityItem = {
    id: Date.now().toString(),
    type: Math.random() > 0.5 ? 'analysis' : 'improvement',
    description: `Automated quality check completed at ${new Date().toLocaleTimeString()}`,
    timestamp: new Date(),
    impact: 'neutral'
  };

  broadcastUpdate('activity-update', randomActivity);
}, 30000); // Every 30 seconds

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Dashboard server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});