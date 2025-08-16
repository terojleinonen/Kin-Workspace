import React, { useState } from 'react';
import { FileQuality, Violation } from '../types';
import { FileExplorer } from './FileExplorer';
import { FileDetailView } from './FileDetailView';
import { ViolationBrowser } from './ViolationBrowser';
import { RecommendationQueue } from './RecommendationQueue';

interface DrillDownViewProps {
  files: FileQuality[];
  onClose: () => void;
}

type ViewMode = 'explorer' | 'violations' | 'recommendations';

export const DrillDownView: React.FC<DrillDownViewProps> = ({ files, onClose }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('explorer');
  const [selectedFile, setSelectedFile] = useState<FileQuality | null>(null);
  const [showFileDetail, setShowFileDetail] = useState(false);

  const handleFileSelect = (file: FileQuality) => {
    setSelectedFile(file);
    setShowFileDetail(true);
  };

  const handleViolationSelect = (violation: Violation, file: FileQuality) => {
    setSelectedFile(file);
    setShowFileDetail(true);
  };

  const handleRecommendationSelect = (recommendation: any) => {
    const file = files.find(f => f.filePath === recommendation.filePath);
    if (file) {
      setSelectedFile(file);
      setShowFileDetail(true);
    }
  };

  const handleCloseFileDetail = () => {
    setShowFileDetail(false);
    setSelectedFile(null);
  };

  const renderMainContent = () => {
    if (showFileDetail && selectedFile) {
      return (
        <div className="h-full">
          <FileDetailView 
            file={selectedFile} 
            onClose={handleCloseFileDetail}
          />
        </div>
      );
    }

    switch (viewMode) {
      case 'explorer':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-1">
              <FileExplorer
                files={files}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile || undefined}
              />
            </div>
            <div className="lg:col-span-2">
              {selectedFile ? (
                <FileDetailView 
                  file={selectedFile} 
                  onClose={() => setSelectedFile(null)}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📁</div>
                    <p className="text-lg">Select a file to view details</p>
                    <p className="text-sm">Choose a file from the explorer to see quality metrics, functions, and violations</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'violations':
        return (
          <ViolationBrowser 
            files={files}
            onViolationSelect={handleViolationSelect}
          />
        );
      
      case 'recommendations':
        return (
          <RecommendationQueue 
            files={files}
            onRecommendationSelect={handleRecommendationSelect}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Code Quality Analysis</h2>
              <p className="text-gray-600">Detailed view of files, violations, and recommendations</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              {[
                { id: 'explorer', label: 'File Explorer', icon: '📁' },
                { id: 'violations', label: 'Violations', icon: '⚠️' },
                { id: 'recommendations', label: 'Recommendations', icon: '💡' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setViewMode(tab.id as ViewMode);
                    setShowFileDetail(false);
                    setSelectedFile(null);
                  }}
                  className={`flex items-center space-x-2 py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                    viewMode === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};