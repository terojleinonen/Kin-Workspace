import React, { useState, useEffect } from 'react';
import { DashboardData, QualityMetrics } from '../types';
import { OverviewCards } from './OverviewCards';
import { QualityTrendChart } from './QualityTrendChart';
import { ViolationsPieChart } from './ViolationsPieChart';
import { FileQualityTable } from './FileQualityTable';
import { RecentActivity } from './RecentActivity';
import { WebSocketService } from '../services/WebSocketService';

interface DashboardProps {
  initialData?: DashboardData;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialData }) => {
  const [data, setData] = useState<DashboardData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [wsService] = useState(() => new WebSocketService());

  useEffect(() => {
    // Initialize WebSocket connection for real-time updates
    wsService.connect('ws://localhost:8080');
    
    wsService.onMessage((message) => {
      if (message.type === 'dashboard-update') {
        setData(message.data);
      } else if (message.type === 'quality-metrics-update') {
        setData(prevData => {
          if (!prevData) return null;
          return {
            ...prevData,
            qualityTrends: [...prevData.qualityTrends, message.data]
          };
        });
      }
    });

    wsService.onError((error) => {
      console.error('WebSocket error:', error);
      setError('Real-time connection failed. Data may not be current.');
    });

    // Fetch initial data if not provided
    if (!initialData) {
      fetchDashboardData();
    }

    return () => {
      wsService.disconnect();
    };
  }, [wsService, initialData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clean Code Dashboard</h1>
              <p className="text-gray-600">Monitor and improve your code quality</p>
            </div>
            <div className="flex items-center space-x-4">
              {error && (
                <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded">
                  {error}
                </div>
              )}
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Overview Cards */}
          <OverviewCards data={data.projectOverview} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QualityTrendChart data={data.qualityTrends} />
            <ViolationsPieChart data={data.violationsByPrinciple} />
          </div>

          {/* Tables Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <FileQualityTable files={data.fileQuality} />
            </div>
            <div>
              <RecentActivity activities={data.recentActivity} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};