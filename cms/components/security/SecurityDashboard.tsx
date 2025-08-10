'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ClockIcon,
  ComputerDesktopIcon,
  UserIcon,
  DocumentTextIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SecurityEvent {
  id: string;
  type: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  blocked: boolean;
}

interface SecurityStats {
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
  eventsByType: Record<string, number>;
  blockedIPs: number;
  suspiciousIPs: number;
  recentEvents: number;
}

export default function SecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadSecurityData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedSeverity]);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      
      const [eventsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/security/events?severity=${selectedSeverity}&limit=50`),
        fetch('/api/admin/security/stats')
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ShieldExclamationIcon className=\"h-5 w-5 text-red-500\" />;
      case 'medium':
        return <ExclamationTriangleIcon className=\"h-5 w-5 text-yellow-500\" />;
      case 'low':
        return <ShieldCheckIcon className=\"h-5 w-5 text-green-500\" />;
      default:
        return <ShieldCheckIcon className=\"h-5 w-5 text-gray-500\" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue',
    trend,
    trendValue 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    trend?: 'up' | 'down';
    trendValue?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      red: 'bg-red-50 text-red-600',
      purple: 'bg-purple-50 text-purple-600'
    };

    return (
      <div className=\"bg-white rounded-lg border border-gray-200 p-6\">
        <div className=\"flex items-center\">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className=\"h-6 w-6\" />
          </div>
          <div className=\"ml-4 flex-1\">
            <p className=\"text-sm font-medium text-gray-600\">{title}</p>
            <p className=\"text-2xl font-semibold text-gray-900\">{value}</p>
            {trend && trendValue && (
              <p className={`text-sm ${trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !stats) {
    return (
      <div className=\"flex items-center justify-center py-12\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
        <span className=\"ml-3 text-gray-600\">Loading security data...</span>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h2 className=\"text-2xl font-bold text-gray-900\">Security Dashboard</h2>
          <p className=\"mt-1 text-gray-600\">
            Monitor security events and system protection status
          </p>
        </div>
        
        <div className=\"flex items-center space-x-4\">
          <label className=\"flex items-center\">
            <input
              type=\"checkbox\"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className=\"mr-2\"
            />
            <span className=\"text-sm text-gray-600\">Auto-refresh</span>
          </label>
          
          <button
            onClick={loadSecurityData}
            disabled={isLoading}
            className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50\"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Security Stats */}
      {stats && (
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
          <StatCard
            title=\"Total Events\"
            value={stats.totalEvents}
            icon={DocumentTextIcon}
            color=\"blue\"
          />
          <StatCard
            title=\"Critical Events\"
            value={stats.eventsBySeverity.critical || 0}
            icon={ShieldExclamationIcon}
            color=\"red\"
          />
          <StatCard
            title=\"Blocked IPs\"
            value={stats.blockedIPs}
            icon={ComputerDesktopIcon}
            color=\"yellow\"
          />
          <StatCard
            title=\"Recent Events (24h)\"
            value={stats.recentEvents}
            icon={ClockIcon}
            color=\"purple\"
          />
        </div>
      )}

      {/* Severity Filter */}
      <div className=\"flex items-center space-x-4\">
        <span className=\"text-sm font-medium text-gray-700\">Filter by severity:</span>
        <div className=\"flex space-x-2\">
          {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
            <button
              key={severity}
              onClick={() => setSelectedSeverity(severity)}
              className={`px-3 py-1 text-sm rounded-full border ${
                selectedSeverity === severity
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
              {stats && severity !== 'all' && stats.eventsBySeverity[severity] && (
                <span className=\"ml-1 text-xs\">({stats.eventsBySeverity[severity]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Security Events */}
      <div className=\"bg-white rounded-lg border border-gray-200 overflow-hidden\">
        <div className=\"px-6 py-4 border-b border-gray-200\">
          <h3 className=\"text-lg font-medium text-gray-900\">Security Events</h3>
        </div>
        
        {events.length > 0 ? (
          <div className=\"divide-y divide-gray-200\">
            {events.map((event) => (
              <div
                key={event.id}
                className=\"p-4 hover:bg-gray-50 cursor-pointer\"
                onClick={() => setSelectedEvent(event)}
              >
                <div className=\"flex items-start justify-between\">
                  <div className=\"flex items-start space-x-3\">
                    {getSeverityIcon(event.severity)}
                    <div className=\"flex-1 min-w-0\">
                      <div className=\"flex items-center space-x-2 mb-1\">
                        <p className=\"text-sm font-medium text-gray-900\">
                          {getEventTypeLabel(event.type)}
                        </p>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getSeverityColor(event.severity)}`}>
                          {event.severity}
                        </span>
                        {event.blocked && (
                          <span className=\"px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 border border-red-200\">
                            Blocked
                          </span>
                        )}
                      </div>
                      
                      <div className=\"text-sm text-gray-600 space-y-1\">
                        <p>IP: {event.ipAddress}</p>
                        <p>Time: {new Date(event.timestamp).toLocaleString()}</p>
                        {event.userId && <p>User: {event.userId}</p>}
                      </div>
                    </div>
                  </div>
                  
                  <button className=\"p-1 text-gray-400 hover:text-gray-600\">
                    <EyeIcon className=\"h-4 w-4\" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className=\"p-8 text-center\">
            <ShieldCheckIcon className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />
            <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No security events</h3>
            <p className=\"text-gray-600\">
              {selectedSeverity === 'all' 
                ? 'No security events have been recorded.'
                : `No ${selectedSeverity} severity events found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50\">
          <div className=\"bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto\">
            <div className=\"flex items-center justify-between mb-4\">
              <h3 className=\"text-lg font-medium text-gray-900\">Security Event Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className=\"p-1 text-gray-400 hover:text-gray-600\"
              >
                <XMarkIcon className=\"h-5 w-5\" />
              </button>
            </div>
            
            <div className=\"space-y-4\">
              <div className=\"grid grid-cols-2 gap-4\">
                <div>
                  <label className=\"block text-sm font-medium text-gray-700\">Event Type</label>
                  <p className=\"mt-1 text-sm text-gray-900\">{getEventTypeLabel(selectedEvent.type)}</p>
                </div>
                <div>
                  <label className=\"block text-sm font-medium text-gray-700\">Severity</label>
                  <span className={`inline-flex mt-1 px-2 py-0.5 text-xs rounded-full border ${getSeverityColor(selectedEvent.severity)}`}>
                    {selectedEvent.severity}
                  </span>
                </div>
                <div>
                  <label className=\"block text-sm font-medium text-gray-700\">IP Address</label>
                  <p className=\"mt-1 text-sm text-gray-900\">{selectedEvent.ipAddress}</p>
                </div>
                <div>
                  <label className=\"block text-sm font-medium text-gray-700\">Timestamp</label>
                  <p className=\"mt-1 text-sm text-gray-900\">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedEvent.userId && (
                <div>
                  <label className=\"block text-sm font-medium text-gray-700\">User ID</label>
                  <p className=\"mt-1 text-sm text-gray-900\">{selectedEvent.userId}</p>
                </div>
              )}
              
              <div>
                <label className=\"block text-sm font-medium text-gray-700\">User Agent</label>
                <p className=\"mt-1 text-sm text-gray-900 break-all\">{selectedEvent.userAgent}</p>
              </div>
              
              {selectedEvent.blocked && (
                <div className=\"p-3 bg-red-50 border border-red-200 rounded\">
                  <p className=\"text-sm text-red-800 font-medium\">This event resulted in blocking the IP address</p>
                </div>
              )}
              
              {Object.keys(selectedEvent.details).length > 0 && (
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-2\">Event Details</label>
                  <div className=\"bg-gray-50 rounded p-3\">
                    <pre className=\"text-xs text-gray-700 whitespace-pre-wrap\">
                      {JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Summary */}
      {stats && (
        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
          <div className=\"bg-white rounded-lg border border-gray-200 p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Events by Type</h3>
            <div className=\"space-y-2\">
              {Object.entries(stats.eventsByType).map(([type, count]) => (
                <div key={type} className=\"flex items-center justify-between py-2 px-3 bg-gray-50 rounded\">
                  <span className=\"text-sm font-medium\">{getEventTypeLabel(type)}</span>
                  <span className=\"text-sm text-gray-600\">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className=\"bg-white rounded-lg border border-gray-200 p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Security Status</h3>
            <div className=\"space-y-3\">
              <div className=\"flex items-center justify-between\">
                <span className=\"text-sm font-medium\">System Status</span>
                <span className=\"flex items-center text-sm text-green-600\">
                  <ShieldCheckIcon className=\"h-4 w-4 mr-1\" />
                  Protected
                </span>
              </div>
              <div className=\"flex items-center justify-between\">
                <span className=\"text-sm font-medium\">Blocked IPs</span>
                <span className=\"text-sm text-gray-900\">{stats.blockedIPs}</span>
              </div>
              <div className=\"flex items-center justify-between\">
                <span className=\"text-sm font-medium\">Suspicious IPs</span>
                <span className=\"text-sm text-gray-900\">{stats.suspiciousIPs}</span>
              </div>
              <div className=\"flex items-center justify-between\">
                <span className=\"text-sm font-medium\">Recent Activity</span>
                <span className=\"text-sm text-gray-900\">{stats.recentEvents} events (24h)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}