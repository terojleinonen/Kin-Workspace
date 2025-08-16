import React, { useState, useMemo } from 'react';
import { FileQuality, Violation } from '../types';

interface FileExplorerProps {
  files: FileQuality[];
  onFileSelect: (file: FileQuality) => void;
  selectedFile?: FileQuality;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  file?: FileQuality;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  onFileSelect, 
  selectedFile 
}) => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'violations'>('name');

  // Build file tree structure
  const fileTree = useMemo(() => {
    const root: FileTreeNode = { name: 'root', path: '', type: 'directory', children: [] };
    
    files.forEach(file => {
      const parts = file.filePath.split('/');
      let current = root;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');
        
        if (!current.children) {
          current.children = [];
        }
        
        let existing = current.children.find(child => child.name === part);
        
        if (!existing) {
          existing = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'directory',
            children: isFile ? undefined : [],
            file: isFile ? file : undefined
          };
          current.children.push(existing);
        }
        
        current = existing;
      }
    });
    
    return root;
  }, [files]);

  // Filter and sort files based on search and sort criteria
  const filteredFiles = useMemo(() => {
    let filtered = files;
    
    if (searchTerm) {
      filtered = files.filter(file => 
        file.filePath.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return a.score - b.score; // Lower scores first (worse quality)
        case 'violations':
          return b.violations.length - a.violations.length; // More violations first
        case 'name':
        default:
          return a.filePath.localeCompare(b.filePath);
      }
    });
  }, [files, searchTerm, sortBy]);

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getViolationSeverityCount = (violations: Violation[]) => {
    return violations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const renderTreeNode = (node: FileTreeNode, depth: number = 0): React.ReactNode => {
    if (node.type === 'file' && node.file) {
      const isSelected = selectedFile?.filePath === node.file.filePath;
      const severityCounts = getViolationSeverityCount(node.file.violations);
      
      return (
        <div
          key={node.path}
          className={`flex items-center py-2 px-2 cursor-pointer hover:bg-gray-100 rounded ${
            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => onFileSelect(node.file!)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {node.name}
              </span>
              <span className={`text-xs font-semibold ${getScoreColor(node.file.score)}`}>
                {node.file.score.toFixed(1)}
              </span>
            </div>
            {node.file.violations.length > 0 && (
              <div className="flex space-x-1 mt-1">
                {Object.entries(severityCounts).map(([severity, count]) => (
                  <span
                    key={severity}
                    className={`inline-flex px-1 py-0.5 text-xs rounded ${
                      severity === 'Critical' ? 'bg-red-100 text-red-800' :
                      severity === 'High' ? 'bg-orange-100 text-orange-800' :
                      severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    if (node.type === 'directory' && node.children) {
      const isExpanded = expandedDirs.has(node.path);
      const hasFiles = node.children.some(child => child.type === 'file');
      
      if (!hasFiles && depth > 0) return null; // Skip empty directories
      
      return (
        <div key={node.path}>
          <div
            className="flex items-center py-1 px-2 cursor-pointer hover:bg-gray-50 rounded"
            style={{ paddingLeft: `${depth * 20 + 8}px` }}
            onClick={() => toggleDirectory(node.path)}
          >
            <span className="text-gray-500 mr-2">
              {isExpanded ? '📂' : '📁'}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {node.name || 'Project Root'}
            </span>
          </div>
          {isExpanded && (
            <div>
              {node.children.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">File Explorer</h3>
        
        {/* Search and Sort Controls */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'score' | 'violations')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="score">Sort by Quality Score</option>
            <option value="violations">Sort by Violations</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {searchTerm ? (
          // Show filtered list when searching
          <div className="space-y-1">
            {filteredFiles.map(file => {
              const isSelected = selectedFile?.filePath === file.filePath;
              const severityCounts = getViolationSeverityCount(file.violations);
              
              return (
                <div
                  key={file.filePath}
                  className={`flex items-center py-2 px-2 cursor-pointer hover:bg-gray-100 rounded ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => onFileSelect(file)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {file.filePath}
                      </span>
                      <span className={`text-xs font-semibold ${getScoreColor(file.score)}`}>
                        {file.score.toFixed(1)}
                      </span>
                    </div>
                    {file.violations.length > 0 && (
                      <div className="flex space-x-1 mt-1">
                        {Object.entries(severityCounts).map(([severity, count]) => (
                          <span
                            key={severity}
                            className={`inline-flex px-1 py-0.5 text-xs rounded ${
                              severity === 'Critical' ? 'bg-red-100 text-red-800' :
                              severity === 'High' ? 'bg-orange-100 text-orange-800' :
                              severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Show tree view when not searching
          <div>
            {fileTree.children?.map(child => renderTreeNode(child, 0))}
          </div>
        )}
        
        {filteredFiles.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            No files found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};