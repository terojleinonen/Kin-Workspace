'use client';

import MediaLibraryAdvanced from '../../components/media/MediaLibraryAdvanced';

export default function MediaAdvancedDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced Media Management Demo
          </h1>
          <p className="text-gray-600">
            Explore the enhanced media library with folder organization, bulk operations, and metadata editing.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[800px]">
          <MediaLibraryAdvanced
            multiSelect={true}
            onFileSelect={(file) => {
              console.log('Selected file:', file);
            }}
          />
        </div>
      </div>
    </div>
  );
}