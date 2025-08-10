'use client';

import { useState, useEffect } from 'react';
import {
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Revision {
  id: string;
  revisionData: any;
  createdAt: string;
  creator: {
    name: string;
    email: string;
  };
}

interface RevisionHistoryProps {
  contentType: 'product' | 'page';
  contentId: string;
  onRestoreRevision?: (revisionId: string) => void;
}

export default function RevisionHistory({ 
  contentType, 
  contentId, 
  onRestoreRevision 
}: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadRevisions();
  }, [contentType, contentId]);

  const loadRevisions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/workflow/revisions?contentType=${contentType}&contentId=${contentId}`
      );

      if (response.ok) {
        const data = await response.json();
        setRevisions(data.revisions);
      }
    } catch (error) {
      console.error('Error loading revisions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevisionSelect = (revision: Revision) => {
    setSelectedRevision(revision);
    setShowComparison(true);
  };

  const handleRestoreRevision = (revisionId: string) => {
    if (onRestoreRevision) {
      onRestoreRevision(revisionId);
    }
  };

  const formatRevisionData = (data: any) => {
    // Format revision data for display
    const formatted: { [key: string]: any } = {};
    
    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        formatted[key] = data[key];
      }
    });
    
    return formatted;
  };

  const getFieldDisplayName = (fieldName: string) => {
    const fieldMap: { [key: string]: string } = {
      name: 'Name',
      title: 'Title',
      description: 'Description',
      content: 'Content',
      price: 'Price',
      status: 'Status',
      slug: 'Slug',
      seoTitle: 'SEO Title',
      seoDescription: 'SEO Description'
    };
    
    return fieldMap[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  };

  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center py-8\">
        <div className=\"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600\"></div>
        <span className=\"ml-3 text-gray-600\">Loading revision history...</span>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h3 className=\"text-lg font-medium text-gray-900\">Revision History</h3>
          <p className=\"text-sm text-gray-600\">
            View and compare previous versions of this content
          </p>
        </div>
        <button
          onClick={loadRevisions}
          className=\"p-2 text-gray-400 hover:text-gray-600 rounded\"
          title=\"Refresh revisions\"
        >
          <ArrowPathIcon className=\"h-5 w-5\" />
        </button>
      </div>

      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Revision List */}
        <div className=\"space-y-4\">
          <h4 className=\"font-medium text-gray-700\">Revisions</h4>
          
          {revisions.length > 0 ? (
            <div className=\"space-y-3 max-h-96 overflow-y-auto\">
              {revisions.map((revision, index) => (
                <div
                  key={revision.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${\n                    selectedRevision?.id === revision.id\n                      ? 'border-blue-500 bg-blue-50'\n                      : 'border-gray-200 hover:border-gray-300'\n                  }`}\n                  onClick={() => handleRevisionSelect(revision)}\n                >\n                  <div className=\"flex items-start justify-between\">\n                    <div className=\"flex-1\">\n                      <div className=\"flex items-center mb-2\">\n                        <ClockIcon className=\"h-4 w-4 text-gray-400 mr-2\" />\n                        <span className=\"text-sm font-medium text-gray-900\">\n                          {index === 0 ? 'Current Version' : `Revision ${revisions.length - index}`}\n                        </span>\n                        {index === 0 && (\n                          <span className=\"ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded\">\n                            Current\n                          </span>\n                        )}\n                      </div>\n                      \n                      <div className=\"flex items-center text-sm text-gray-600 mb-2\">\n                        <UserIcon className=\"h-4 w-4 mr-1\" />\n                        <span>{revision.creator.name}</span>\n                        <span className=\"mx-2\">•</span>\n                        <span>{new Date(revision.createdAt).toLocaleString()}</span>\n                      </div>\n                      \n                      {revision.revisionData.name && (\n                        <p className=\"text-sm text-gray-800 font-medium\">\n                          {revision.revisionData.name}\n                        </p>\n                      )}\n                      \n                      {revision.revisionData.title && (\n                        <p className=\"text-sm text-gray-800 font-medium\">\n                          {revision.revisionData.title}\n                        </p>\n                      )}\n                    </div>\n                    \n                    <div className=\"flex items-center space-x-2 ml-4\">\n                      <button\n                        onClick={(e) => {\n                          e.stopPropagation();\n                          handleRevisionSelect(revision);\n                        }}\n                        className=\"p-1 text-gray-400 hover:text-gray-600 rounded\"\n                        title=\"View revision\"\n                      >\n                        <EyeIcon className=\"h-4 w-4\" />\n                      </button>\n                      \n                      {index > 0 && onRestoreRevision && (\n                        <button\n                          onClick={(e) => {\n                            e.stopPropagation();\n                            if (confirm('Are you sure you want to restore this revision?')) {\n                              handleRestoreRevision(revision.id);\n                            }\n                          }}\n                          className=\"p-1 text-blue-600 hover:text-blue-700 rounded\"\n                          title=\"Restore this revision\"\n                        >\n                          <ArrowPathIcon className=\"h-4 w-4\" />\n                        </button>\n                      )}\n                    </div>\n                  </div>\n                </div>\n              ))}\n            </div>\n          ) : (\n            <div className=\"text-center py-8 border border-gray-200 rounded-lg\">\n              <DocumentTextIcon className=\"h-8 w-8 text-gray-400 mx-auto mb-2\" />\n              <p className=\"text-gray-600\">No revision history available</p>\n            </div>\n          )}\n        </div>\n\n        {/* Revision Details */}\n        <div className=\"space-y-4\">\n          <h4 className=\"font-medium text-gray-700\">Revision Details</h4>\n          \n          {selectedRevision ? (\n            <div className=\"border border-gray-200 rounded-lg p-4\">\n              <div className=\"mb-4\">\n                <h5 className=\"font-medium text-gray-900 mb-2\">\n                  Revision from {new Date(selectedRevision.createdAt).toLocaleString()}\n                </h5>\n                <p className=\"text-sm text-gray-600\">\n                  Created by {selectedRevision.creator.name}\n                </p>\n              </div>\n              \n              <div className=\"space-y-4\">\n                {Object.entries(formatRevisionData(selectedRevision.revisionData)).map(([key, value]) => (\n                  <div key={key} className=\"border-b border-gray-100 pb-3 last:border-b-0\">\n                    <dt className=\"text-sm font-medium text-gray-700 mb-1\">\n                      {getFieldDisplayName(key)}\n                    </dt>\n                    <dd className=\"text-sm text-gray-900\">\n                      {typeof value === 'string' ? (\n                        value.length > 200 ? (\n                          <div>\n                            <p className=\"mb-2\">{value.substring(0, 200)}...</p>\n                            <button className=\"text-blue-600 hover:text-blue-700 text-xs\">\n                              Show more\n                            </button>\n                          </div>\n                        ) : (\n                          value\n                        )\n                      ) : typeof value === 'object' && value !== null ? (\n                        <pre className=\"bg-gray-50 p-2 rounded text-xs overflow-x-auto\">\n                          {JSON.stringify(value, null, 2)}\n                        </pre>\n                      ) : (\n                        String(value)\n                      )}\n                    </dd>\n                  </div>\n                ))}\n              </div>\n            </div>\n          ) : (\n            <div className=\"border border-gray-200 rounded-lg p-8 text-center\">\n              <DocumentTextIcon className=\"h-8 w-8 text-gray-400 mx-auto mb-2\" />\n              <p className=\"text-gray-600\">Select a revision to view details</p>\n            </div>\n          )}\n        </div>\n      </div>\n    </div>\n  );\n}"