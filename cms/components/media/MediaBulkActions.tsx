'use client';

import { useState } from 'react';
import { 
  TrashIcon, 
  FolderIcon, 
  TagIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  folderId: string | null;
  tags: string[];
  createdAt: string;
}

interface MediaBulkActionsProps {
  selectedFiles: MediaFile[];
  onClearSelection: () => void;
  onBulkDelete: (fileIds: string[]) => void;
  onBulkMove: (fileIds: string[], folderId: string | null) => void;
  onBulkTag: (fileIds: string[], tags: string[]) => void;
  onBulkDownload: (fileIds: string[]) => void;
  folders: Array<{ id: string; name: string; }>;
}

export default function MediaBulkActions({
  selectedFiles,
  onClearSelection,
  onBulkDelete,
  onBulkMove,
  onBulkTag,
  onBulkDownload,
  folders
}: MediaBulkActionsProps) {
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  if (selectedFiles.length === 0) {
    return null;
  }

  const handleBulkDelete = () => {
    onBulkDelete(selectedFiles.map(f => f.id));
    setShowDeleteDialog(false);
    onClearSelection();
  };

  const handleBulkMove = () => {
    onBulkMove(selectedFiles.map(f => f.id), selectedFolderId);
    setShowMoveDialog(false);
    onClearSelection();
  };

  const handleBulkTag = () => {
    const tags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean);
    onBulkTag(selectedFiles.map(f => f.id), tags);
    setShowTagDialog(false);
    setTagInput('');
    onClearSelection();
  };

  const handleBulkDownload = () => {
    onBulkDownload(selectedFiles.map(f => f.id));
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
          </span>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMoveDialog(true)}
              className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
            >
              <FolderIcon className="w-4 h-4 mr-1" />
              Move
            </button>
            
            <button
              onClick={() => setShowTagDialog(true)}
              className="flex items-center px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
            >
              <TagIcon className="w-4 h-4 mr-1" />
              Tag
            </button>
            
            <button
              onClick={handleBulkDownload}
              className="flex items-center px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
              Download
            </button>
            
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
          
          <button
            onClick={onClearSelection}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Move Dialog */}
      {showMoveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Move Files</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a folder to move {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} to:
            </p>
            
            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="folder"
                  value=""
                  checked={selectedFolderId === null}
                  onChange={() => setSelectedFolderId(null)}
                  className="mr-2"
                />
                <span className="text-sm">Root Folder</span>
              </label>
              
              {folders.map((folder) => (
                <label key={folder.id} className="flex items-center">
                  <input
                    type="radio"
                    name="folder"
                    value={folder.id}
                    checked={selectedFolderId === folder.id}
                    onChange={() => setSelectedFolderId(folder.id)}
                    className="mr-2"
                  />
                  <span className="text-sm">{folder.name}</span>
                </label>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowMoveDialog(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkMove}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Move Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Dialog */}
      {showTagDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Add Tags</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add tags to {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} (comma-separated):
            </p>
            
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              autoFocus
            />
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowTagDialog(false);
                  setTagInput('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkTag}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Tags
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Delete Files</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Files
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}