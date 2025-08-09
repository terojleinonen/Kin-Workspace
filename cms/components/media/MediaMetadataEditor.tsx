'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, TagIcon, CalendarIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { MediaFile } from './MediaBulkActions';

interface MediaMetadataEditorProps {
  file: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (fileId: string, metadata: Partial<MediaFile>) => void;
}

interface FileMetadata {
  name: string;
  altText: string;
  caption: string;
  tags: string[];
  customFields: Record<string, string>;
}

export default function MediaMetadataEditor({
  file,
  isOpen,
  onClose,
  onSave
}: MediaMetadataEditorProps) {
  const [metadata, setMetadata] = useState<FileMetadata>({
    name: '',
    altText: '',
    caption: '',
    tags: [],
    customFields: {}
  });
  const [newTag, setNewTag] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  useEffect(() => {
    if (file) {
      setMetadata({
        name: file.name,
        altText: (file as any).altText || '',
        caption: (file as any).caption || '',
        tags: file.tags || [],
        customFields: (file as any).customFields || {}
      });
    }
  }, [file]);

  if (!isOpen || !file) {
    return null;
  }

  const handleSave = () => {
    onSave(file.id, {
      name: metadata.name,
      altText: metadata.altText,
      caption: metadata.caption,
      tags: metadata.tags,
      customFields: metadata.customFields
    } as any);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !metadata.tags.includes(newTag.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addCustomField = () => {
    if (newFieldKey.trim() && newFieldValue.trim()) {
      setMetadata(prev => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [newFieldKey.trim()]: newFieldValue.trim()
        }
      }));
      setNewFieldKey('');
      setNewFieldValue('');
    }
  };

  const removeCustomField = (key: string) => {
    setMetadata(prev => {
      const newCustomFields = { ...prev.customFields };
      delete newCustomFields[key];
      return {
        ...prev,
        customFields: newCustomFields
      };
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = file.type.startsWith('image/');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Media Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Preview Panel */}
          <div className="w-1/2 p-6 border-r bg-gray-50">
            <div className="h-full flex items-center justify-center">
              {isImage ? (
                <img
                  src={file.url}
                  alt={metadata.altText || file.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <DocumentIcon className="w-24 h-24 mb-4" />
                  <p className="text-lg font-medium">{file.name}</p>
                  <p className="text-sm">{file.type}</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Panel */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* File Info */}
              <div>
                <h3 className="text-lg font-medium mb-3">File Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={metadata.name}
                      onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {file.type}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Created:</span> {new Date(file.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alt Text (for images) */}
              {isImage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    value={metadata.altText}
                    onChange={(e) => setMetadata(prev => ({ ...prev, altText: e.target.value }))}
                    placeholder="Describe this image for accessibility"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caption
                </label>
                <textarea
                  value={metadata.caption}
                  onChange={(e) => setMetadata(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder="Add a caption or description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add a tag"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Custom Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Fields
                </label>
                <div className="space-y-2 mb-3">
                  {Object.entries(metadata.customFields).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-24">
                        {key}:
                      </span>
                      <span className="flex-1 text-sm">{value}</span>
                      <button
                        onClick={() => removeCustomField(key)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    placeholder="Field name"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
                    placeholder="Field value"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={addCustomField}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}