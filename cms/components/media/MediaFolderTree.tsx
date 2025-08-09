'use client';

import { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  children?: MediaFolder[];
  fileCount: number;
}

interface MediaFolderTreeProps {
  folders: MediaFolder[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreate?: (parentId: string | null, name: string) => void;
  onFolderRename?: (folderId: string, newName: string) => void;
  onFolderDelete?: (folderId: string) => void;
}

interface FolderNodeProps {
  folder: MediaFolder;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onRename?: (newName: string) => void;
  onDelete?: () => void;
}

function FolderNode({ 
  folder, 
  level, 
  isSelected, 
  isExpanded, 
  onToggle, 
  onSelect,
  onRename,
  onDelete 
}: FolderNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  const handleRename = () => {
    if (editName.trim() && editName !== folder.name && onRename) {
      onRename(editName.trim());
    }
    setIsEditing(false);
    setEditName(folder.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(folder.name);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${
          isSelected ? 'bg-blue-50 text-blue-700' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }} // Dynamic indentation based on tree level
        onClick={onSelect}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1 hover:bg-gray-200 rounded mr-1"
          disabled={!folder.children?.length}
        >
          {folder.children?.length ? (
            isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>
        
        {isExpanded ? (
          <FolderOpenIcon className="w-4 h-4 mr-2 text-blue-500" />
        ) : (
          <FolderIcon className="w-4 h-4 mr-2 text-gray-500" />
        )}
        
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="flex-1 px-1 py-0.5 text-sm border rounded"
            aria-label={`Rename folder ${folder.name}`}
            title={`Rename folder ${folder.name}`}
            autoFocus
          />
        ) : (
          <span 
            className="flex-1 text-sm"
            onDoubleClick={() => onRename && setIsEditing(true)}
          >
            {folder.name}
          </span>
        )}
        
        <span className="text-xs text-gray-500 ml-2">
          {folder.fileCount}
        </span>
      </div>
      
      {isExpanded && folder.children?.map((child) => (
        <FolderNodeContainer
          key={child.id}
          folder={child}
          level={level + 1}
          selectedFolderId={isSelected ? folder.id : null}
          onFolderSelect={onSelect}
          onFolderRename={onRename}
          onFolderDelete={onDelete}
        />
      ))}
    </div>
  );
}

function FolderNodeContainer({ 
  folder, 
  level, 
  selectedFolderId, 
  onFolderSelect,
  onFolderRename,
  onFolderDelete 
}: {
  folder: MediaFolder;
  level: number;
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderRename?: (folderId: string, newName: string) => void;
  onFolderDelete?: (folderId: string) => void;
}) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolderId === folder.id;

  const handleToggle = () => {
    const newExpanded = new Set(expandedFolders);
    if (isExpanded) {
      newExpanded.delete(folder.id);
    } else {
      newExpanded.add(folder.id);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <FolderNode
      folder={folder}
      level={level}
      isSelected={isSelected}
      isExpanded={isExpanded}
      onToggle={handleToggle}
      onSelect={() => onFolderSelect(folder.id)}
      onRename={onFolderRename ? (newName) => onFolderRename(folder.id, newName) : undefined}
      onDelete={onFolderDelete ? () => onFolderDelete(folder.id) : undefined}
    />
  );
}

export default function MediaFolderTree({
  folders,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderRename,
  onFolderDelete
}: MediaFolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (expandedFolders.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Folders</h3>
        {onFolderCreate && (
          <button
            onClick={() => onFolderCreate(selectedFolderId, 'New Folder')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            New Folder
          </button>
        )}
      </div>
      
      <div className="space-y-1">
        <div
          className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${
            selectedFolderId === null ? 'bg-blue-50 text-blue-700' : ''
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <FolderIcon className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm">All Files</span>
        </div>
        
        {folders.map((folder) => (
          <FolderNodeContainer
            key={folder.id}
            folder={folder}
            level={0}
            selectedFolderId={selectedFolderId}
            onFolderSelect={onFolderSelect}
            onFolderRename={onFolderRename}
            onFolderDelete={onFolderDelete}
          />
        ))}
      </div>
    </div>
  );
}