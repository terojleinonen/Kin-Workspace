import React, { useState, useMemo } from 'react';
import { FileQuality, Violation } from '../types';

interface Recommendation {
  id: string;
  type: 'extract-method' | 'rename' | 'reduce-parameters' | 'split-class' | 'remove-dead-code' | 'improve-error-handling' | 'add-tests';
  title: string;
  description: string;
  filePath: string;
  fileName: string;
  location: {
    line: number;
    column: number;
  };
  effort: 'Small' | 'Medium' | 'Large';
  impact: 'Low' | 'Medium' | 'High';
  priority: number; // Calculated priority score
  relatedViolations: Violation[];
  beforeCode?: string;
  afterCode?: string;
  estimatedTime: number; // in minutes
  dependencies: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'dismissed';
}

interface RecommendationQueueProps {
  files: FileQuality[];
  onRecommendationSelect?: (recommendation: Recommendation) => void;
}

export const RecommendationQueue: React.FC<RecommendationQueueProps> = ({ 
  files, 
  onRecommendationSelect 
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [effortFilter, setEffortFilter] = useState<string>('');
  const [impactFilter, setImpactFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority' | 'effort' | 'impact' | 'time'>('priority');
  const [searchTerm, setSearchTerm] = useState('');

  // Generate mock recommendations based on violations
  const recommendations: Recommendation[] = useMemo(() => {
    const recs: Recommendation[] = [];
    
    files.forEach(file => {
      file.violations.forEach((violation, index) => {
        let recType: Recommendation['type'] = 'rename';
        let title = '';
        let description = '';
        let effort: Recommendation['effort'] = 'Medium';
        let impact: Recommendation['impact'] = 'Medium';
        let estimatedTime = 30;
        
        // Generate recommendations based on violation type
        if (violation.principle.name.includes('Naming')) {
          recType = 'rename';
          title = 'Improve variable naming';
          description = 'Rename variables to be more descriptive and follow naming conventions';
          effort = 'Small';
          impact = 'Medium';
          estimatedTime = 15;
        } else if (violation.principle.name.includes('Function Size')) {
          recType = 'extract-method';
          title = 'Extract method from large function';
          description = 'Break down large function into smaller, more focused methods';
          effort = 'Medium';
          impact = 'High';
          estimatedTime = 45;
        } else if (violation.principle.name.includes('Single Responsibility')) {
          recType = 'split-class';
          title = 'Split class responsibilities';
          description = 'Separate class into multiple classes with single responsibilities';
          effort = 'Large';
          impact = 'High';
          estimatedTime = 120;
        } else if (violation.principle.name.includes('Error Handling')) {
          recType = 'improve-error-handling';
          title = 'Improve error handling';
          description = 'Add proper error handling and validation';
          effort = 'Medium';
          impact = 'Medium';
          estimatedTime = 30;
        }
        
        // Calculate priority based on severity, impact, and effort
        const severityScore = {
          'Critical': 10,
          'High': 7,
          'Medium': 4,
          'Low': 1
        }[violation.severity] || 1;
        
        const impactScore = {
          'High': 3,
          'Medium': 2,
          'Low': 1
        }[impact];
        
        const effortScore = {
          'Small': 3,
          'Medium': 2,
          'Large': 1
        }[effort];
        
        const priority = (severityScore * impactScore * effortScore) / 10;
        
        recs.push({
          id: `rec-${file.filePath}-${index}`,
          type: recType,
          title,
          description,
          filePath: file.filePath,
          fileName: file.filePath.split('/').pop() || file.filePath,
          location: violation.location,
          effort,
          impact,
          priority,
          relatedViolations: [violation],
          estimatedTime,
          dependencies: [],
          status: Math.random() > 0.8 ? 'completed' : Math.random() > 0.6 ? 'in-progress' : 'pending'
        });
      });
    });
    
    return recs;
  }, [files]);

  // Filter and sort recommendations
  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations;

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(rec => rec.status === statusFilter);
    }

    // Apply effort filter
    if (effortFilter) {
      filtered = filtered.filter(rec => rec.effort === effortFilter);
    }

    // Apply impact filter
    if (impactFilter) {
      filtered = filtered.filter(rec => rec.impact === impactFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rec =>
        rec.title.toLowerCase().includes(term) ||
        rec.description.toLowerCase().includes(term) ||
        rec.filePath.toLowerCase().includes(term)
      );
    }

    // Sort recommendations
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority - a.priority;
        case 'effort':
          const effortOrder = { 'Small': 1, 'Medium': 2, 'Large': 3 };
          return effortOrder[a.effort] - effortOrder[b.effort];
        case 'impact':
          const impactOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        case 'time':
          return a.estimatedTime - b.estimatedTime;
        default:
          return 0;
      }
    });
  }, [recommendations, statusFilter, effortFilter, impactFilter, searchTerm, sortBy]);

  // Get recommendation statistics
  const stats = useMemo(() => {
    return {
      total: recommendations.length,
      pending: recommendations.filter(r => r.status === 'pending').length,
      inProgress: recommendations.filter(r => r.status === 'in-progress').length,
      completed: recommendations.filter(r => r.status === 'completed').length,
      totalTime: recommendations.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.estimatedTime, 0)
    };
  }, [recommendations]);

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Small': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Large': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-purple-100 text-purple-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'Low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600';
    if (priority >= 6) return 'text-orange-600';
    if (priority >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'extract-method': return '🔧';
      case 'rename': return '✏️';
      case 'reduce-parameters': return '📝';
      case 'split-class': return '✂️';
      case 'remove-dead-code': return '🗑️';
      case 'improve-error-handling': return '🛡️';
      case 'add-tests': return '🧪';
      default: return '💡';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendation Queue</h3>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{Math.round(stats.totalTime / 60)}h</div>
            <div className="text-sm text-gray-600">Est. Time</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search recommendations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="dismissed">Dismissed</option>
          </select>
          
          <select
            value={effortFilter}
            onChange={(e) => setEffortFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Efforts</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
          
          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Impacts</option>
            <option value="High">High Impact</option>
            <option value="Medium">Medium Impact</option>
            <option value="Low">Low Impact</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="priority">Sort by Priority</option>
            <option value="effort">Sort by Effort</option>
            <option value="impact">Sort by Impact</option>
            <option value="time">Sort by Time</option>
          </select>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <p>No recommendations match your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRecommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onRecommendationSelect?.(recommendation)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTypeIcon(recommendation.type)}</span>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{recommendation.title}</h4>
                      <p className="text-sm text-gray-600">{recommendation.fileName} • Line {recommendation.location.line}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${getPriorityColor(recommendation.priority)}`}>
                      {recommendation.priority.toFixed(1)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(recommendation.status)}`}>
                      {recommendation.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{recommendation.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getEffortColor(recommendation.effort)}`}>
                      {recommendation.effort} Effort
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getImpactColor(recommendation.impact)}`}>
                      {recommendation.impact} Impact
                    </span>
                    <span className="text-sm text-gray-600">
                      ~{recommendation.estimatedTime} min
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {recommendation.relatedViolations.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {recommendation.relatedViolations.length} violation{recommendation.relatedViolations.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {recommendation.dependencies.length > 0 && (
                      <span className="text-sm text-orange-600">
                        {recommendation.dependencies.length} dependencies
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};