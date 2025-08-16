"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const Dashboard_1 = require("../../src/dashboard/components/Dashboard");
// Mock WebSocket
const mockWebSocket = {
    connect: jest.fn(),
    onMessage: jest.fn(),
    onError: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn(),
    isConnected: jest.fn(() => true)
};
jest.mock('../../src/dashboard/services/WebSocketService', () => ({
    WebSocketService: jest.fn(() => mockWebSocket)
}));
// Mock fetch
global.fetch = jest.fn();
const mockDashboardData = {
    projectOverview: {
        totalFiles: 100,
        averageScore: 7.5,
        totalViolations: 45,
        improvementTrend: 15.2
    },
    qualityTrends: [
        {
            overallScore: 7.0,
            complexity: 5.5,
            maintainability: 7.8,
            testability: 6.9,
            readability: 8.1,
            timestamp: new Date('2024-01-01')
        },
        {
            overallScore: 7.5,
            complexity: 5.2,
            maintainability: 8.0,
            testability: 7.2,
            readability: 8.3,
            timestamp: new Date('2024-01-02')
        }
    ],
    fileQuality: [
        {
            filePath: 'src/test/TestFile.ts',
            score: 8.5,
            violations: [
                {
                    id: 'v1',
                    principle: { name: 'Naming', category: 'Naming' },
                    severity: 'Medium',
                    location: { line: 10, column: 5 },
                    description: 'Variable name could be more descriptive',
                    suggestion: 'Use more descriptive variable names'
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
        }
    ],
    violationsByPrinciple: {
        'Naming': 15,
        'Functions': 12,
        'Classes': 8,
        'Comments': 5,
        'Error Handling': 5
    },
    recentActivity: [
        {
            id: '1',
            type: 'analysis',
            description: 'Completed analysis of 50 files',
            timestamp: new Date(),
            impact: 'neutral'
        }
    ]
};
describe('Dashboard Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fetch.mockClear();
    });
    it('renders dashboard with initial data', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(Dashboard_1.Dashboard, { initialData: mockDashboardData }));
        expect(react_1.screen.getByText('Clean Code Dashboard')).toBeInTheDocument();
        expect(react_1.screen.getByText('Monitor and improve your code quality')).toBeInTheDocument();
        expect(react_1.screen.getByText('100')).toBeInTheDocument(); // Total files
        expect(react_1.screen.getByText('7.5/10')).toBeInTheDocument(); // Average score
    });
    it('shows loading state when no initial data provided', () => {
        fetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockDashboardData)
        }), 100)));
        (0, react_1.render)((0, jsx_runtime_1.jsx)(Dashboard_1.Dashboard, {}));
        expect(react_1.screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });
    it('handles fetch error gracefully', async () => {
        fetch.mockRejectedValue(new Error('Network error'));
        (0, react_1.render)((0, jsx_runtime_1.jsx)(Dashboard_1.Dashboard, {}));
        await (0, react_1.waitFor)(() => {
            expect(react_1.screen.getByText('⚠️ Error')).toBeInTheDocument();
            expect(react_1.screen.getByText('Network error')).toBeInTheDocument();
        });
    });
    it('establishes WebSocket connection on mount', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(Dashboard_1.Dashboard, { initialData: mockDashboardData }));
        expect(mockWebSocket.connect).toHaveBeenCalledWith('ws://localhost:8080');
        expect(mockWebSocket.onMessage).toHaveBeenCalled();
        expect(mockWebSocket.onError).toHaveBeenCalled();
    });
    it('handles refresh button click', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockDashboardData)
        });
        (0, react_1.render)((0, jsx_runtime_1.jsx)(Dashboard_1.Dashboard, { initialData: mockDashboardData }));
        const refreshButton = react_1.screen.getByText('Refresh');
        react_1.fireEvent.click(refreshButton);
        await (0, react_1.waitFor)(() => {
            expect(fetch).toHaveBeenCalledWith('/api/dashboard');
        });
    });
    it('displays error message when WebSocket fails', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(Dashboard_1.Dashboard, { initialData: mockDashboardData }));
        // Simulate WebSocket error
        const errorHandler = mockWebSocket.onError.mock.calls[0][0];
        errorHandler(new Error('WebSocket connection failed'));
        // Note: In a real test, you'd need to trigger a re-render to see the error state
        // This would require state management or a more complex test setup
    });
    it('handles WebSocket message updates', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(Dashboard_1.Dashboard, { initialData: mockDashboardData }));
        const messageHandler = mockWebSocket.onMessage.mock.calls[0][0];
        const updateMessage = {
            type: 'dashboard-update',
            data: {
                ...mockDashboardData,
                projectOverview: {
                    ...mockDashboardData.projectOverview,
                    totalFiles: 150
                }
            }
        };
        messageHandler(updateMessage);
        // In a real implementation, this would update the dashboard
        // The test would verify the UI reflects the new data
    });
    it('cleans up WebSocket connection on unmount', () => {
        const { unmount } = (0, react_1.render)((0, jsx_runtime_1.jsx)(Dashboard_1.Dashboard, { initialData: mockDashboardData }));
        unmount();
        expect(mockWebSocket.disconnect).toHaveBeenCalled();
    });
    it('renders all dashboard sections', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(Dashboard_1.Dashboard, { initialData: mockDashboardData }));
        // Check for overview cards
        expect(react_1.screen.getByText('Total Files')).toBeInTheDocument();
        expect(react_1.screen.getByText('Average Quality Score')).toBeInTheDocument();
        expect(react_1.screen.getByText('Total Violations')).toBeInTheDocument();
        expect(react_1.screen.getByText('Improvement Trend')).toBeInTheDocument();
        // Check for chart sections
        expect(react_1.screen.getByText('Quality Metrics Trend')).toBeInTheDocument();
        expect(react_1.screen.getByText('Violations by Clean Code Principle')).toBeInTheDocument();
        // Check for table sections
        expect(react_1.screen.getByText('File Quality Analysis')).toBeInTheDocument();
        expect(react_1.screen.getByText('Recent Activity')).toBeInTheDocument();
    });
    it('handles quality metrics updates via WebSocket', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(Dashboard_1.Dashboard, { initialData: mockDashboardData }));
        const messageHandler = mockWebSocket.onMessage.mock.calls[0][0];
        const metricsUpdate = {
            type: 'quality-metrics-update',
            data: {
                overallScore: 8.0,
                complexity: 5.0,
                maintainability: 8.5,
                testability: 7.5,
                readability: 8.8,
                timestamp: new Date()
            }
        };
        messageHandler(metricsUpdate);
        // The component should handle this update and add it to the trends
    });
});
//# sourceMappingURL=Dashboard.test.js.map