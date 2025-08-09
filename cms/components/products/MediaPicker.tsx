'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import MediaLibraryAdvanced from '../media/MediaLibraryAdvanced';
import { MediaFile } from '../media/MediaBulkActions';

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedFiles: MediaFile[]) => void;
  multiSelect?: boolean;
  allowedTypes?: string[];
  title?: string;
}

export default function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  multiSelect = true,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  title = 'Select Media'
}: MediaPickerProps) {
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);

  if (!isOpen) return null;

  const handleFileSelect = (file: MediaFile) => {
    if (multiSelect) {
      setSelectedFiles(prev => {
        const isSelected = prev.some(f => f.id === file.id);
        if (isSelected) {
          return prev.filter(f => f.id !== file.id);
        } else {
          return [...prev, file];
        }
      });
    } else {
      setSelectedFiles([file]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedFiles);
    setSelectedFiles([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close media picker"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Info */}
        {selectedFiles.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b">
            <p className="text-sm text-blue-800">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Media Library */}
        <div className="h-[calc(90vh-200px)] overflow-hidden">
          <MediaLibraryAdvanced
            multiSelect={multiSelect}
            allowedTypes={allowedTypes}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {multiSelect ? (
              <>
                {selectedFiles.length > 0 
                  ? `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected`
                  : 'Select one or more files'
                }
              </>
            ) : (
              <>
                {selectedFiles.length > 0 
                  ? '1 file selected'
                  : 'Select a file'
                }
              </>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedFiles.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {multiSelect ? `Select ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}` : 'Select File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}