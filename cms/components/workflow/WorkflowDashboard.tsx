'use client';

import { useState, useEffect } from 'react';
import {
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArchiveBoxIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { ContentWorkflowData } from '@/lib/workflow';

interface WorkflowStats {
  totalContent: number;
  draftContent: number;
  reviewContent: number;
  publishedContent: number;
  archivedContent: number;
}

export default function WorkflowDashboard() {
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [pendingContent, setPendingContent] = useState<ContentWorkflowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'scheduled'>('overview');

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    try {
      setIsLoading(true);
      
      const [statsRes, pendingRes] = await Promise.all([
        fetch('/api/workflow?type=stats'),
        fetch('/api/workflow?type=pending-review')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingContent(pendingData.content);
      }
    } catch (error) {
      console.error('Error loading workflow data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowAction = async (
    contentType: string,
    contentId: string,
    action: string,
    comment?: string
  ) => {
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentType,
          contentId,
          action,
          comment
        })
      });

      if (response.ok) {
        // Reload data after successful action
        await loadWorkflowData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Workflow action error:', error);
      alert('An error occurred while processing the workflow action');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <PencilIcon className=\"h-4 w-4 text-gray-500\" />;
      case 'REVIEW':
        return <ClockIcon className=\"h-4 w-4 text-yellow-500\" />;
      case 'PUBLISHED':
        return <CheckCircleIcon className=\"h-4 w-4 text-green-500\" />;
      case 'ARCHIVED':
        return <ArchiveBoxIcon className=\"h-4 w-4 text-gray-400\" />;
      default:
        return <DocumentTextIcon className=\"h-4 w-4 text-gray-500\" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue' 
  }: {
    title: string;
    value: number;
    icon: any;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      red: 'bg-red-50 text-red-600',
      gray: 'bg-gray-50 text-gray-600'
    };

    return (
      <div className=\"bg-white rounded-lg border border-gray-200 p-6\">
        <div className=\"flex items-center\">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className=\"h-6 w-6\" />
          </div>
          <div className=\"ml-4\">
            <p className=\"text-sm font-medium text-gray-600\">{title}</p>
            <p className=\"text-2xl font-semibold text-gray-900\">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center py-12\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
        <span className=\"ml-3 text-gray-600\">Loading workflow data...</span>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div>
        <h2 className=\"text-2xl font-bold text-gray-900\">Content Workflow</h2>
        <p className=\"mt-1 text-gray-600\">
          Manage content approval process and publication workflow
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6\">
          <StatCard
            title=\"Total Content\"
            value={stats.totalContent}
            icon={DocumentTextIcon}
            color=\"blue\"
          />
          <StatCard
            title=\"Draft\"
            value={stats.draftContent}
            icon={PencilIcon}
            color=\"gray\"
          />
          <StatCard
            title=\"In Review\"
            value={stats.reviewContent}
            icon={ClockIcon}
            color=\"yellow\"
          />
          <StatCard
            title=\"Published\"
            value={stats.publishedContent}
            icon={CheckCircleIcon}
            color=\"green\"
          />
          <StatCard
            title=\"Archived\"
            value={stats.archivedContent}
            icon={ArchiveBoxIcon}
            color=\"gray\"
          />
        </div>
      )}

      {/* Tabs */}
      <div className=\"border-b border-gray-200\">
        <nav className=\"-mb-px flex space-x-8\">
          {[
            { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
            { id: 'pending', label: 'Pending Review', icon: ClockIcon },
            { id: 'scheduled', label: 'Scheduled', icon: CalendarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className=\"h-4 w-4 mr-2\" />
              {tab.label}
              {tab.id === 'pending' && pendingContent.length > 0 && (
                <span className=\"ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full\">
                  {pendingContent.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className=\"bg-white rounded-lg border border-gray-200\">
        {activeTab === 'overview' && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Workflow Overview</h3>
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
              <div>
                <h4 className=\"font-medium text-gray-700 mb-3\">Content Distribution</h4>
                {stats && (
                  <div className=\"space-y-2\">
                    <div className=\"flex items-center justify-between py-2 px-3 bg-gray-50 rounded\">
                      <div className=\"flex items-center\">
                        <PencilIcon className=\"h-4 w-4 text-gray-500 mr-2\" />
                        <span className=\"text-sm font-medium\">Draft</span>
                      </div>
                      <span className=\"text-sm text-gray-600\">{stats.draftContent}</span>
                    </div>
                    <div className=\"flex items-center justify-between py-2 px-3 bg-yellow-50 rounded\">
                      <div className=\"flex items-center\">
                        <ClockIcon className=\"h-4 w-4 text-yellow-500 mr-2\" />
                        <span className=\"text-sm font-medium\">In Review</span>
                      </div>
                      <span className=\"text-sm text-yellow-600\">{stats.reviewContent}</span>
                    </div>
                    <div className=\"flex items-center justify-between py-2 px-3 bg-green-50 rounded\">
                      <div className=\"flex items-center\">
                        <CheckCircleIcon className=\"h-4 w-4 text-green-500 mr-2\" />
                        <span className=\"text-sm font-medium\">Published</span>
                      </div>
                      <span className=\"text-sm text-green-600\">{stats.publishedContent}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className=\"font-medium text-gray-700 mb-3\">Quick Actions</h4>
                <div className=\"space-y-2\">
                  <button className=\"w-full text-left py-2 px-3 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors\">
                    Review pending content
                  </button>
                  <button className=\"w-full text-left py-2 px-3 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors\">
                    Publish approved content
                  </button>
                  <button className=\"w-full text-left py-2 px-3 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors\">
                    View content analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className=\"p-6\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Content Pending Review</h3>
            {pendingContent.length > 0 ? (
              <div className=\"space-y-4\">
                {pendingContent.map((content) => (
                  <div key={content.id} className=\"border border-gray-200 rounded-lg p-4\">
                    <div className=\"flex items-start justify-between\">
                      <div className=\"flex-1\">
                        <div className=\"flex items-center mb-2\">
                          {getStatusIcon(content.status)}
                          <h4 className=\"ml-2 font-medium text-gray-900\">{content.title}</h4>
                          <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getStatusColor(content.status)}`}>
                            {content.status}
                          </span>
                          <span className=\"ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded\">
                            {content.contentType}
                          </span>
                        </div>
                        <div className=\"text-sm text-gray-600 mb-3\">
                          <p>Created by {content.creator.name} on {new Date(content.createdAt).toLocaleDateString()}</p>
                          <p>Last updated: {new Date(content.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className=\"flex items-center space-x-2 ml-4\">
                        <button
                          onClick={() => window.open(`/${content.contentType}s/${content.id}`, '_blank')}
                          className=\"p-2 text-gray-400 hover:text-gray-600 rounded\"
                          title=\"View content\"
                        >
                          <EyeIcon className=\"h-4 w-4\" />
                        </button>
                        
                        {content.status === 'REVIEW' && (
                          <>
                            <button
                              onClick={() => handleWorkflowAction(content.contentType, content.id, 'approve')}
                              className=\"px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700\"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const comment = prompt('Rejection reason (optional):');\n                                handleWorkflowAction(content.contentType, content.id, 'reject', comment || undefined);\n                              }}\n                              className=\"px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700\"\n                            >\n                              Reject\n                            </button>\n                          </>\n                        )}\n                        \n                        {content.status === 'DRAFT' && (\n                          <button\n                            onClick={() => handleWorkflowAction(content.contentType, content.id, 'submit_for_review')}\n                            className=\"px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700\"\n                          >\n                            Submit for Review\n                          </button>\n                        )}\n                      </div>\n                    </div>\n                  </div>\n                ))}\n              </div>\n            ) : (\n              <div className=\"text-center py-8\">\n                <ClockIcon className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />\n                <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No content pending review</h3>\n                <p className=\"text-gray-600\">All content is up to date with the workflow process.</p>\n              </div>\n            )}\n          </div>\n        )}\n\n        {activeTab === 'scheduled' && (\n          <div className=\"p-6\">\n            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Scheduled Content</h3>\n            <div className=\"text-center py-8\">\n              <CalendarIcon className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />\n              <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No scheduled content</h3>\n              <p className=\"text-gray-600\">Content scheduling will appear here when configured.</p>\n            </div>\n          </div>\n        )}\n      </div>\n\n      {/* Refresh Button */}\n      <div className=\"flex justify-end\">\n        <button\n          onClick={loadWorkflowData}\n          disabled={isLoading}\n          className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed\"\n        >\n          {isLoading ? 'Refreshing...' : 'Refresh Data'}\n        </button>\n      </div>\n    </div>\n  );\n}"