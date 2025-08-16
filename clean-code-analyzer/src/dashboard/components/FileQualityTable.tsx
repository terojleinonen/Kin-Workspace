import React, { useState, useMemo } from 'react';
import { FileQuality } from '../types';

interface FileQualityTableProps {
  files: FileQuality[];
}

export const FileQualityTable: React.FC<FileQualityTableProps> = ({ files }) => {
  const [sortField, setSortField] = useState<keyof FileQuality>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterScore, setFilterScore] = useState<number | null>(null);

  const sortedAndFilteredFiles = useMemo(() => {
    let filtered = files;
    
    if (filterScore !== null) {
      filtered = files.filter(file => file.score <= filterScore);
    }

    return filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'filePath') {
        aValue = aValue as string;
        bValue = bValue as string;
      } else if (sortField === 'score') {
        aValue = aValue as number;
        bValue = bValue as number;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [files, sortField, sortDirection, filterScore]);

  const handleSort = (field: keyof FileQuality) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    if (score >= 4) return 'text-orange-600 bg-orange-50';
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

  const SortIcon = ({ field }: { field: keyof FileQuality }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕️</span>;
    }
    return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">File Quality Analysis</h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600">
              Filter by score ≤
              <select
                value={filterScore || ''}
                onChange={(e) => setFilterScore(e.target.value ? Number(e.target.value) : null)}
                className="ml-2 border rounded px-2 py-1"
              >
                <option value="">All</option>
                <option value="3">≤ 3 (Poor)</option>
                <option value="5">≤ 5 (Below Average)</option>
                <option value="7">≤ 7 (Average)</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('filePath')}
              >
                <div className="flex items-center space-x-1">
                  <span>File Path</span>
                  <SortIcon field="filePath" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center space-x-1">
                  <span>Quality Score</span>
                  <SortIcon field="score" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Violations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Top Issues
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredFiles.map((file, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {file.filePath.split('/').pop()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {file.filePath.substring(0, file.filePath.lastIndexOf('/'))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(file.score)}`}>
                    {file.score.toFixed(1)}/10
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {file.violations.length} total
                  </div>
                  <div className="flex space-x-1 mt-1">
                    {['Critical', 'High', 'Medium', 'Low'].map(severity => {
                      const count = file.violations.filter(v => v.severity === severity).length;
                      if (count === 0) return null;
                      return (
                        <span
                          key={severity}
                          className={`inline-flex px-1 py-0.5 text-xs rounded ${getSeverityColor(severity)}`}
                        >
                          {count}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {file.violations.slice(0, 2).map((violation, vIndex) => (
                      <div key={vIndex} className="mb-1">
                        <span className={`inline-flex px-1 py-0.5 text-xs rounded mr-2 ${getSeverityColor(violation.severity)}`}>
                          {violation.severity}
                        </span>
                        <span className="text-xs text-gray-600">
                          {violation.description.substring(0, 50)}...
                        </span>
                      </div>
                    ))}
                    {file.violations.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{file.violations.length - 2} more
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedAndFilteredFiles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No files match the current filter criteria.
        </div>
      )}
    </div>
  );
};