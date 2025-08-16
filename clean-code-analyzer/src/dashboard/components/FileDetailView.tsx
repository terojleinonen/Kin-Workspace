import React, { useState } from 'react';
import { FileQuality, Violation, QualityMetrics } from '../types';

interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  complexity: number;
  parameters: number;
  lineCount: number;
  violations: Violation[];
}

interface FileDetailViewProps {
  file: FileQuality;
  onClose: () => void;
}

export const FileDetailView: React.FC<FileDetailViewProps> = ({ file, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'functions' | 'violations'>('overview');
  
  // Mock function data - in real implementation, this would come from the analysis engine
  const mockFunctions: FunctionInfo[] = [
    {
      name: 'processUserData',
      startLine: 15,
      endLine: 45,
      complexity: 8,
      parameters: 4,
      lineCount: 30,
      violations: file.violations.filter(v => v.location.line >= 15 && v.location.line <= 45)
    },
    {
      name: 'validateInput',
      startLine: 47,
      endLine: 62,
      complexity: 3,
      parameters: 2,
      lineCount: 15,
      violations: file.violations.filter(v => v.location.line >= 47 && v.location.line <= 62)
    },
    {
      name: 'generateReport',
      startLine: 64,
      endLine: 120,
      complexity: 12,
      parameters: 6,
      lineCount: 56,
      violations: file.violations.filter(v => v.location.line >= 64 && v.location.line <= 120)
    }
  ];

  const getComplexityColor = (complexity: number) => {
    if (complexity <= 5) return 'text-green-600 bg-green-50';
    if (complexity <= 10) return 'text-yellow-600 bg-yellow-50';
    if (complexity <= 15) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* File Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{file.score.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Overall Score</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{file.violations.length}</div>
          <div className="text-sm text-gray-600">Total Violations</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{mockFunctions.length}</div>
          <div className="text-sm text-gray-600">Functions</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(mockFunctions.reduce((sum, f) => sum + f.complexity, 0) / mockFunctions.length)}
          </div>
          <div className="text-sm text-gray-600">Avg Complexity</div>
        </div>
      </div>

      {/* Quality Metrics Breakdown */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics</h4>
        <div className="space-y-4">
          {Object.entries({
            'Overall Score': file.metrics.overallScore,
            'Complexity': file.metrics.complexity,
            'Maintainability': file.metrics.maintainability,
            'Testability': file.metrics.testability,
            'Readability': file.metrics.readability
          }).map(([metric, value]) => (
            <div key={metric} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{metric}</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      value >= 8 ? 'bg-green-500' :
                      value >= 6 ? 'bg-yellow-500' :
                      value >= 4 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(value / 10) * 100}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold ${getScoreColor(value)}`}>
                  {value.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violation Summary */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Violation Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Critical', 'High', 'Medium', 'Low'].map(severity => {
            const count = file.violations.filter(v => v.severity === severity).length;
            return (
              <div key={severity} className="text-center">
                <div className={`text-2xl font-bold ${
                  severity === 'Critical' ? 'text-red-600' :
                  severity === 'High' ? 'text-orange-600' :
                  severity === 'Medium' ? 'text-yellow-600' : 'text-blue-600'
                }`}>
                  {count}
                </div>
                <div className="text-sm text-gray-600">{severity}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderFunctionsTab = () => (
    <div className="space-y-4">
      {mockFunctions.map((func, index) => (
        <div key={index} className="bg-white border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{func.name}()</h4>
              <p className="text-sm text-gray-600">Lines {func.startLine}-{func.endLine}</p>
            </div>
            <div className="flex space-x-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded ${getComplexityColor(func.complexity)}`}>
                Complexity: {func.complexity}
              </span>
              {func.violations.length > 0 && (
                <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                  {func.violations.length} issues
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{func.lineCount}</div>
              <div className="text-xs text-gray-600">Lines</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{func.parameters}</div>
              <div className="text-xs text-gray-600">Parameters</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{func.complexity}</div>
              <div className="text-xs text-gray-600">Complexity</div>
            </div>
          </div>

          {func.violations.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Issues in this function:</h5>
              <div className="space-y-2">
                {func.violations.map((violation, vIndex) => (
                  <div key={vIndex} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(violation.severity)}`}>
                      {violation.severity}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{violation.description}</p>
                      <p className="text-xs text-gray-600 mt-1">Line {violation.location.line}</p>
                      <p className="text-xs text-blue-600 mt-1">{violation.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderViolationsTab = () => (
    <div className="space-y-4">
      {file.violations.map((violation, index) => (
        <div key={index} className="bg-white border rounded-lg p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(violation.severity)}`}>
                {violation.severity}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {violation.principle.name}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              Line {violation.location.line}:{violation.location.column}
            </span>
          </div>
          
          <p className="text-gray-900 mb-3">{violation.description}</p>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
            <p className="text-sm text-blue-800">
              <strong>Suggestion:</strong> {violation.suggestion}
            </p>
          </div>
        </div>
      ))}
      
      {file.violations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-green-600 text-4xl mb-2">✅</div>
          <p>No violations found in this file!</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{file.filePath.split('/').pop()}</h3>
            <p className="text-sm text-gray-600">{file.filePath}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`text-lg font-bold ${getScoreColor(file.score)}`}>
                Score: {file.score.toFixed(1)}/10
              </span>
              <span className="text-sm text-gray-600">
                {file.violations.length} violations
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'functions', label: 'Functions' },
            { id: 'violations', label: 'Violations' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'functions' && renderFunctionsTab()}
        {activeTab === 'violations' && renderViolationsTab()}
      </div>
    </div>
  );
};