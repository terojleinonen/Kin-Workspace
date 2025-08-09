'use client';

import { useState, useEffect } from 'react';
import { 
  PhotoIcon, 
  PlusIcon, 
  XMarkIcon, 
  StarIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProductMedia {
  mediaId: string;
  sortOrder: number;
  isPrimary: boolean;
  media: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
    altText?: string;
    folder: string;
    createdAt: string;
  };
}

interface ProductImageGalleryProps {
  productId: string;
  productMedia: ProductMedia[];
  onMediaUpdate: () => void;
  onMediaSelect?: () => void;
}

interface SortableImageProps {
  productMedia: ProductMedia;
  onRemove: (mediaId: string) => void;
  onSetPrimary: (mediaId: string) => void;
}

function SortableImage({ productMedia, onRemove, onSetPrimary }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: productMedia.mediaId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getMediaUrl = (media: ProductMedia['media']) => {
    return `/uploads/${media.folder}/${media.filename}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border-2 rounded-lg overflow-hidden ${
        productMedia.isPrimary ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1 bg-white bg-opacity-80 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ArrowsUpDownIcon className="w-4 h-4 text-gray-600" />
      </div>

      {/* Primary Badge */}
      {productMedia.isPrimary && (
        <div className="absolute top-2 right-2 z-10 flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded">
          <StarIconSolid className="w-3 h-3 mr-1" />
          Primary
        </div>
      )}

      {/* Image */}
      <div className="aspect-square relative">
        {productMedia.media.mimeType.startsWith('image/') ? (
          <img
            src={getMediaUrl(productMedia.media)}
            alt={productMedia.media.altText || productMedia.media.originalName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <PhotoIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Media Info */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {productMedia.media.originalName}
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          {formatFileSize(productMedia.media.fileSize)}
          {productMedia.media.width && productMedia.media.height && (
            <span> • {productMedia.media.width}×{productMedia.media.height}</span>
          )}
        </p>
        {productMedia.media.altText && (
          <p className="text-xs text-gray-600 mt-1 truncate">
            Alt: {productMedia.media.altText}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex space-x-2">
          {!productMedia.isPrimary && (
            <button
              onClick={() => onSetPrimary(productMedia.mediaId)}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="Set as primary image"
            >
              <StarIcon className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button
            onClick={() => onRemove(productMedia.mediaId)}
            className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
            title="Remove image"
          >
            <XMarkIcon className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductImageGallery({
  productId,
  productMedia,
  onMediaUpdate,
  onMediaSelect
}: ProductImageGalleryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sortedMedia, setSortedMedia] = useState<ProductMedia[]>(productMedia);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setSortedMedia(productMedia);
  }, [productMedia]);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = sortedMedia.findIndex(item => item.mediaId === active.id);
      const newIndex = sortedMedia.findIndex(item => item.mediaId === over.id);
      
      const newOrder = arrayMove(sortedMedia, oldIndex, newIndex);
      setSortedMedia(newOrder);

      // Update sort orders on server
      try {
        setIsLoading(true);
        const mediaOrder = newOrder.map((item, index) => ({
          mediaId: item.mediaId,
          sortOrder: index
        }));

        const response = await fetch(`/api/products/${productId}/media`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaOrder })
        });

        if (!response.ok) {
          throw new Error('Failed to update media order');
        }

        onMediaUpdate();
      } catch (error) {
        console.error('Error updating media order:', error);
        // Revert on error
        setSortedMedia(productMedia);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRemoveMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to remove this image from the product?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/${productId}/media?mediaIds=${mediaId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove media');
      }

      onMediaUpdate();
    } catch (error) {
      console.error('Error removing media:', error);
      alert('Failed to remove image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimary = async (mediaId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/${productId}/media`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId })
      });

      if (!response.ok) {
        throw new Error('Failed to set primary media');
      }

      onMediaUpdate();
    } catch (error) {
      console.error('Error setting primary media:', error);
      alert('Failed to set primary image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
        {onMediaSelect && (
          <button
            onClick={onMediaSelect}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Images
          </button>
        )}
      </div>

      {sortedMedia.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h4 className="mt-2 text-sm font-medium text-gray-900">No images</h4>
          <p className="mt-1 text-sm text-gray-500">
            Add images to showcase your product
          </p>
          {onMediaSelect && (
            <button
              onClick={onMediaSelect}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Images
            </button>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedMedia.map(item => item.mediaId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedMedia.map((item) => (
                <SortableImage
                  key={item.mediaId}
                  productMedia={item}
                  onRemove={handleRemoveMedia}
                  onSetPrimary={handleSetPrimary}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Updating images...</p>
          </div>
        </div>
      )}
    </div>
  );
}