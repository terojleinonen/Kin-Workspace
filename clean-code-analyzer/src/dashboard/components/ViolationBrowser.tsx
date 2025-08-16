import React, { useState, useMemo } from 'react';
import { FileQuality, Violation } from '../types';

interface ViolationBrowserProps {
  files: FileQuality[];
  onViolationSelect?: (violation: Violation, file: FileQuality) => void;
}

interface ViolationWithFile extends Violation {
  filePath: string;
  fileName: string;
}

export const ViolationBrowser: React.FC<ViolationBrowserProps> = ({ 
  files, 
  onViolationSelect 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [principleFilter, setPrincipleFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'severity' | 'principle' | 'file' | 'line'>('severity');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Flatten all violations with file information
  const allViolations: ViolationWithFile[] = useMemo(() => {
    return files.flatMap(file => 
      file.violations.map(violation => ({
        ...violation,
        filePath: file.filePath,
        fileName: file.filePath.split('/').pop() || file.filePath
      }))
    );
  }, [files]);

  // Get unique principles for filter dropdown
  const uniquePrinciples = useMemo(() => {
    const principles = new Set(allViolations.map(v => v.principle.name));
    return Array.from(principles).sort();
  }, [allViolations]);

  // Filter and sort violations
  const filteredViolations = useMemo(() => {
    let filtered = allViolations;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(violation =>
        violation.description.toLowerCase().includes(term) ||
        violation.suggestion.toLowerCase().includes(term) ||
        violation.filePath.toLowerCase().includes(term) ||
        violation.principle.name.toLowerCase().includes(term)
      );
    }

    // Apply severity filter
    if (severityFilter) {
      filtered = filtered.filter(violation => violation.severity === severityFilter);
    }

    // Apply principle filter
    if (principleFilter) {
      filtered = filtered.filter(violation => violation.principle.name === principleFilter);
    }

    // Sort violations
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'severity':
          const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          comparison = (severityOrder[a.severity as keyof typeof severityOrder] || 0) - 
                      (severityOrder[b.severity as keyof typeof severityOrder] || 0);
          break;
        case 'principle':
          comparison = a.principle.name.localeCompare(b.principle.name);
          break;
        case 'file':
          comparison = a.filePath.localeCompare(b.filePath);
          break;
        case 'line':
          comparison = a.location.line - b.location.line;
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [allViolations, searchTerm, severityFilter, principleFilter, sortBy, sortDirection]);

  // Get violation statistics
  const violationStats = useMemo(() => {
    const stats = {
      total: filteredViolations.length,
      bySeverity: {} as Record<string, number>,
      byPrinciple: {} as Record<string, number>
    };

    filteredViolations.forEach(violation => {
      stats.bySeverity[violation.severity] = (stats.bySeverity[violation.severity] || 0) + 1;
      stats.byPrinciple[violation.principle.name] = (stats.byPrinciple[violation.principle.name] || 0) + 1;
    });

    return stats;
  }, [filteredViolations]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const handleViolationClick = (violation: ViolationWithFile) => {
    if (onViolationSelect) {
      const file = files.find(f => f.filePath === violation.filePath);
      if (file) {
        onViolationSelect(violation, file);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Violation Browser</h3>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{violationStats.total}</div>
            <div className="text-sm text-gray-600">Total Violations</div>
          </div>
          {['Critical', 'High', 'Medium', 'Low'].map(severity => (
            <div key={severity} className="text-center">
              <div className={`text-2xl font-bold ${
                severity === 'Critical' ? 'text-red-600' :
                severity === 'High' ? 'text-orange-600' :
                severity === 'Medium' ? 'text-yellow-600' : 'text-blue-600'
              }`}>
                {violationStats.bySeverity[severity] || 0}
              </div>
              <div className="text-sm text-gray-600">{severity}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search violations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          
          <select
            value={principleFilter}
            onChange={(e) => setPrincipleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Principles</option>
            {uniquePrinciples.map(principle => (
              <option key={principle} value={principle}>{principle}</option>
            ))}
          </select>
          
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortBy(field as typeof sortBy);
              setSortDirection(direction as 'asc' | 'desc');
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="severity-desc">Severity (High to Low)</option>
            <option value="severity-asc">Severity (Low to High)</option>
            <option value="principle-asc">Principle (A-Z)</option>
            <option value="principle-desc">Principle (Z-A)</option>
            <option value="file-asc">File (A-Z)</option>
            <option value="file-desc">File (Z-A)</option>
            <option value="line-asc">Line Number (Low to High)</option>
            <option value="line-desc">Line Number (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Violations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredViolations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm || severityFilter || principleFilter ? (
              <div>
                <div className="text-4xl mb-4">🔍</div>
                <p>No violations match your current filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSeverityFilter('');
                    setPrincipleFilter('');
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div>
                <div className="text-green-600 text-4xl mb-4">✅</div>
                <p>No violations found!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredViolations.map((violation, index) => (
              <div
                key={`${violation.filePath}-${violation.id}-${index}`}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleViolationClick(violation)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded border ${getSeverityColor(violation.severity)}`}>
                      {violation.severity}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {violation.principle.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {violation.principle.category}
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{violation.fileName}</div>
                    <div>Line {violation.location.line}:{violation.location.column}</div>
                  </div>
                </div>
                
                <p className="text-gray-900 mb-3">{violation.description}</p>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
                  <p className="text-sm text-blue-800">
                    <strong>Suggestion:</strong> {violation.suggestion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};