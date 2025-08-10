'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '../../app/components/editor/RichTextEditor';
import { EyeIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface PageTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
}

interface Page {
  id?: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  template: string;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
}

interface PageFormProps {
  page?: Page;
  onSave?: (page: Page) => void;
  onCancel?: () => void;
  onPreview?: (page: Page) => void;
}

export default function PageForm({ page, onSave, onCancel, onPreview }: PageFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState<Page>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'DRAFT',
    template: 'default',
    seoTitle: '',
    seoDescription: '',
    publishedAt: undefined,
    ...page
  });

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Update selected template when template changes
  useEffect(() => {
    if (templates.length > 0) {
      const template = templates.find(t => t.id === formData.template);
      setSelectedTemplate(template || templates[0]);
    }
  }, [formData.template, templates]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/pages/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const url = formData.id ? `/api/pages/${formData.id}` : '/api/pages';
      const method = formData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save page');
      }

      const savedPage = await response.json();
      
      if (onSave) {
        onSave(savedPage);
      } else {
        router.push('/admin/pages');
      }
    } catch (error) {
      console.error('Error saving page:', error);
      alert(error instanceof Error ? error.message : 'Failed to save page. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    if (onPreview) {
      onPreview(formData);
    } else if (formData.id) {
      try {
        const response = await fetch(`/api/pages/${formData.id}/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: formData.content,
            template: formData.template
          })
        });

        if (response.ok) {
          const data = await response.json();
          window.open(data.previewUrl, '_blank');
        }
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    }
  };

  const getStatusColor = (status: Page['status']) => {
    const colors = {
      DRAFT: 'text-gray-600',
      REVIEW: 'text-yellow-600',
      PUBLISHED: 'text-green-600',
      ARCHIVED: 'text-red-600'
    };
    return colors[status];
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {formData.id ? 'Edit Page' : 'Create New Page'}
            </h1>
            <p className="text-gray-600">
              {formData.id ? 'Update your page content and settings' : 'Create a new content page'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${getStatusColor(formData.status)}`}>
              {formData.status}
            </span>
            {formData.id && (
              <button
                type="button"
                onClick={handlePreview}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                Preview
              </button>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Page Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter page title"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="page-url-slug"
              />
              <p className="mt-1 text-sm text-gray-500">
                URL: /{formData.slug}
              </p>
            </div>

            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                Page Template
              </label>
              <select
                id="template"
                name="template"
                value={formData.template}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <p className="mt-1 text-sm text-gray-500">
                  {selectedTemplate.description}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                Page Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the page content"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Page Content</h3>
          
          <RichTextEditor
            value={formData.content || ''}
            onChange={handleContentChange}
            placeholder="Write your page content here..."
            height="400px"
            allowMedia={true}
          />
        </div>

        {/* SEO Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">SEO Settings</h3>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700 mb-2">
                SEO Title
              </label>
              <input
                type="text"
                id="seoTitle"
                name="seoTitle"
                value={formData.seoTitle || ''}
                onChange={handleInputChange}
                maxLength={255}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SEO optimized title (leave blank to use page title)"
              />
              <p className="mt-1 text-sm text-gray-500">
                {(formData.seoTitle || formData.title).length}/60 characters (recommended)
              </p>
            </div>

            <div>
              <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700 mb-2">
                SEO Description
              </label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                value={formData.seoDescription || ''}
                onChange={handleInputChange}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Meta description for search engines"
              />
              <p className="mt-1 text-sm text-gray-500">
                {(formData.seoDescription || '').length}/160 characters (recommended)
              </p>
            </div>
          </div>
        </div>

        {/* Publishing Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Publishing Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">Review</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="publishedAt" className="block text-sm font-medium text-gray-700 mb-2">
                Publish Date
              </label>
              <input
                type="datetime-local"
                id="publishedAt"
                name="publishedAt"
                value={formData.publishedAt ? new Date(formData.publishedAt).toISOString().slice(0, 16) : ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave blank to publish immediately when status is set to Published
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel || (() => router.push('/admin/pages'))}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <DocumentIcon className="w-4 h-4 mr-2" />
                {formData.id ? 'Update Page' : 'Create Page'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}