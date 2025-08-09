'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import MediaFolderTree, { MediaFolder } from './MediaFolderTree';
import MediaBulkActions, { MediaFile } from './MediaBulkActions';
import MediaMetadataEditor from './MediaMetadataEditor';

interface MediaLibraryAdvancedProps {
  onFileSelect?: (file: MediaFile) => void;
  multiSelect?: boolean;
  allowedTypes?: string[];
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  search: string;
  type: string;
  tags: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

export default function MediaLibraryAdvanced({
  onFileSelect,
  multiSelect = false,
  allowedTypes
}: MediaLibraryAdvancedProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    tags: [],
    dateRange: { start: '', end: '' }
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockFiles: MediaFile[] = [
      {
        id: '1',
        name: 'hero-image.jpg',
        type: 'image/jpeg',
        size: 2048000,
        url: '/api/media/hero-image.jpg',
        folderId: null,
        tags: ['hero', 'homepage'],
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        name: 'product-photo.png',
        type: 'image/png',
        size: 1024000,
        url: '/api/media/product-photo.png',
        folderId: 'folder-1',
        tags: ['product', 'catalog'],
        createdAt: '2024-01-16T14:30:00Z'
      },
      {
        id: '3',
        name: 'document.pdf',
        type: 'application/pdf',
        size: 512000,
        url: '/api/media/document.pdf',
        folderId: 'folder-2',
        tags: ['document', 'legal'],
        createdAt: '2024-01-17T09:15:00Z'
      }
    ];

    const mockFolders: MediaFolder[] = [
      {
        id: 'folder-1',
        name: 'Products',
        parentId: null,
        fileCount: 15,
        children: []
      },
      {
        id: 'folder-2',
        name: 'Documents',
        parentId: null,
        fileCount: 8,
        children: []
      }
    ];

    setFiles(mockFiles);
    setFolders(mockFolders);
  }, []);

  const filteredFiles = files.filter(file => {
    // Folder filter
    if (selectedFolderId !== null && file.folderId !== selectedFolderId) {
      return false;
    }
    if (selectedFolderId === null && file.folderId !== null) {
      return false;
    }

    // Search filter
    if (filters.search && !file.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filters.type && !file.type.includes(filters.type)) {
      return false;
    }

    // Tags filter
    if (filters.tags.length > 0 && !filters.tags.some(tag => file.tags.includes(tag))) {
      return false;
    }

    // Allowed types filter
    if (allowedTypes && !allowedTypes.some(type => file.type.includes(type))) {
      return false;
    }

    return true;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleFileSelect = (file: MediaFile) => {
    if (multiSelect) {
      const isSelected = selectedFiles.some(f => f.id === file.id);
      if (isSelected) {
        setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
      } else {
        setSelectedFiles(prev => [...prev, file]);
      }
    } else {
      onFileSelect?.(file);
    }
  };

  const handleBulkDelete = (fileIds: string[]) => {
    setFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
  };

  const handleBulkMove = (fileIds: string[], folderId: string | null) => {
    setFiles(prev => prev.map(f => 
      fileIds.includes(f.id) ? { ...f, folderId } : f
    ));
  };

  const handleBulkTag = (fileIds: string[], tags: string[]) => {
    setFiles(prev => prev.map(f => 
      fileIds.includes(f.id) ? { ...f, tags: [...new Set([...f.tags, ...tags])] } : f
    ));
  };

  const handleBulkDownload = (fileIds: string[]) => {
    // Implementation for bulk download
    console.log('Downloading files:', fileIds);
  };

  const handleMetadataSave = (fileId: string, metadata: Partial<MediaFile>) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...metadata } : f
    ));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <MediaFolderTree
          folders={folders}
          selectedFolderId={selectedFolderId}
          onFolderSelect={setSelectedFolderId}
          onFolderCreate={(parentId, name) => {
            const newFolder: MediaFolder = {
              id: `folder-${Date.now()}`,
              name,
              parentId,
              fileCount: 0,
              children: []
            };
            setFolders(prev => [...prev, newFolder]);
          }}
          onFolderRename={(folderId, newName) => {
            setFolders(prev => prev.map(f => 
              f.id === folderId ? { ...f, name: newName } : f
            ));
          }}
          onFolderDelete={(folderId) => {
            setFolders(prev => prev.filter(f => f.id !== folderId));
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              Upload Files
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
            </button>

            <div className="flex items-center space-x-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [SortBy, SortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
              </select>

              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="audio">Audio</option>
                    <option value="application">Documents</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* File Grid/List */}
        <div className="flex-1 p-4 overflow-auto">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sortedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`relative group cursor-pointer border-2 rounded-lg p-3 hover:shadow-md transition-all ${
                    selectedFiles.some(f => f.id === file.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                  onClick={() => handleFileSelect(file)}
                  onDoubleClick={() => setEditingFile(file)}
                >
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                      <span className="text-xs text-gray-500 uppercase">
                        {file.type.split('/')[1]}
                      </span>
                    </div>
                  )}
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedFiles.map((file) => (
                    <tr
                      key={file.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedFiles.some(f => f.id === file.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleFileSelect(file)}
                      onDoubleClick={() => setEditingFile(file)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {file.type.startsWith('image/') && (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-8 h-8 object-cover rounded mr-3"
                            />
                          )}
                          <span className="text-sm font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{file.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(file.size)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {file.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {file.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{file.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      <MediaBulkActions
        selectedFiles={selectedFiles}
        onClearSelection={() => setSelectedFiles([])}
        onBulkDelete={handleBulkDelete}
        onBulkMove={handleBulkMove}
        onBulkTag={handleBulkTag}
        onBulkDownload={handleBulkDownload}
        folders={folders}
      />

      {/* Metadata Editor */}
      <MediaMetadataEditor
        file={editingFile}
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        onSave={handleMetadataSave}
      />
    </div>
  );
}