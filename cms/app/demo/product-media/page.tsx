'use client';

import { useState } from 'react';
import ProductFormWithMedia from '../../components/products/ProductFormWithMedia';

export default function ProductMediaDemo() {
  const [currentView, setCurrentView] = useState<'form' | 'gallery'>('form');

  // Mock product data for demonstration
  const mockProduct = {
    id: 'demo-product-1',
    name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    description: 'High-quality wireless headphones with noise cancellation and premium sound quality. Perfect for music lovers and professionals.',
    shortDescription: 'Premium wireless headphones with noise cancellation',
    price: 299.99,
    comparePrice: 399.99,
    sku: 'PWH-001',
    inventoryQuantity: 50,
    weight: 0.8,
    dimensions: {
      length: 20,
      width: 18,
      height: 8
    },
    status: 'PUBLISHED' as const,
    featured: true,
    seoTitle: 'Premium Wireless Headphones - Best Sound Quality',
    seoDescription: 'Discover our premium wireless headphones with superior sound quality and noise cancellation technology.'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Product-Media Association Demo
          </h1>
          <p className="text-gray-600 mb-4">
            Explore the product image gallery with drag-and-drop reordering, primary image selection, and media management.
          </p>
          
          {/* View Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('form')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentView === 'form'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Product Form with Media
            </button>
            <button
              onClick={() => setCurrentView('gallery')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentView === 'gallery'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Image Gallery Only
            </button>
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {currentView === 'form' ? (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Complete Product Form with Media Management
              </h2>
              <p className="text-gray-600 mb-6">
                This demonstrates the full product editing experience with integrated image gallery management.
              </p>
              
              <ProductFormWithMedia
                product={mockProduct}
                onSave={(product) => {
                  console.log('Product saved:', product);
                  alert('Product saved successfully! (Demo mode)');
                }}
                onCancel={() => {
                  console.log('Form cancelled');
                  alert('Form cancelled (Demo mode)');
                }}
              />
            </div>
          ) : (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Product Image Gallery Component
              </h2>
              <p className="text-gray-600 mb-6">
                This shows just the image gallery component with drag-and-drop reordering and media management features.
              </p>
              
              {/* This would need mock data for the gallery */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  Image gallery demo would appear here with mock product media data.
                  In a real implementation, this would show the ProductImageGallery component
                  with sample images that can be reordered and managed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Drag & Drop Reordering
            </h3>
            <p className="text-gray-600 text-sm">
              Easily reorder product images by dragging and dropping. The sort order is automatically saved to the database.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Primary Image Selection
            </h3>
            <p className="text-gray-600 text-sm">
              Set any image as the primary product image. Primary images are highlighted and used as the main product photo.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Media Library Integration
            </h3>
            <p className="text-gray-600 text-sm">
              Select images from the advanced media library with folder organization, search, and filtering capabilities.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Bulk Operations
            </h3>
            <p className="text-gray-600 text-sm">
              Add multiple images at once and remove images with confirmation dialogs to prevent accidental deletions.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Image Variants
            </h3>
            <p className="text-gray-600 text-sm">
              Support for different image sizes and formats. Automatic thumbnail generation and responsive image delivery.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              API Integration
            </h3>
            <p className="text-gray-600 text-sm">
              RESTful API endpoints for managing product-media relationships with proper validation and error handling.
            </p>
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            API Endpoints
          </h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">GET</span>
                <code className="text-sm font-mono">/api/products/[id]/media</code>
              </div>
              <p className="text-sm text-gray-600">Get all media associated with a product, ordered by sort order.</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">POST</span>
                <code className="text-sm font-mono">/api/products/[id]/media</code>
              </div>
              <p className="text-sm text-gray-600">Add media files to a product. Supports bulk addition and primary image setting.</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">PUT</span>
                <code className="text-sm font-mono">/api/products/[id]/media</code>
              </div>
              <p className="text-sm text-gray-600">Update media order or set primary image. Supports batch operations.</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">DELETE</span>
                <code className="text-sm font-mono">/api/products/[id]/media</code>
              </div>
              <p className="text-sm text-gray-600">Remove media files from a product. Supports bulk removal.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}