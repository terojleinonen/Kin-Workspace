'use client';

import { useState } from 'react';
import PageList from '../../components/pages/PageList';
import PageForm from '../../components/pages/PageForm';
import TemplateSelector from '../../components/pages/TemplateSelector';

export default function PagesManagementDemo() {
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'templates'>('list');
  const [selectedPage, setSelectedPage] = useState<any>(null);

  // Mock page data for demonstration
  const mockPage = {
    id: 'demo-page-1',
    title: 'About Our Company',
    slug: 'about-our-company',
    content: `
      <h2>Our Story</h2>
      <p>Founded in 2020, our company has been dedicated to creating innovative solutions that make a difference in people's lives.</p>
      
      <h3>Our Mission</h3>
      <p>To provide exceptional products and services that exceed our customers' expectations while maintaining the highest standards of quality and integrity.</p>
      
      <h3>Our Values</h3>
      <ul>
        <li>Innovation and creativity</li>
        <li>Customer-first approach</li>
        <li>Sustainability and responsibility</li>
        <li>Teamwork and collaboration</li>
      </ul>
    `,
    excerpt: 'Learn about our company history, mission, and values that drive us forward.',
    status: 'PUBLISHED' as const,
    template: 'about',
    seoTitle: 'About Our Company - Learn Our Story and Mission',
    seoDescription: 'Discover our company history, mission, values, and the team behind our innovative solutions.',
    publishedAt: '2024-01-15T10:00:00Z'
  };

  const handleEditPage = (page: any) => {
    setSelectedPage(page);
    setCurrentView('form');
  };

  const handleSavePage = (page: any) => {
    console.log('Page saved:', page);
    alert('Page saved successfully! (Demo mode)');
    setCurrentView('list');
    setSelectedPage(null);
  };

  const handlePreviewPage = (page: any) => {
    console.log('Preview page:', page);
    alert(`Preview for "${page.title}" would open in a new window (Demo mode)`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Content Pages Management Demo
          </h1>
          <p className="text-gray-600 mb-4">
            Explore the complete content pages management system with CRUD operations, templates, and SEO features.
          </p>
          
          {/* View Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Pages List
            </button>
            <button
              onClick={() => {
                setSelectedPage(mockPage);
                setCurrentView('form');
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentView === 'form'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Page Editor
            </button>
            <button
              onClick={() => setCurrentView('templates')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentView === 'templates'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Template Selector
            </button>
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {currentView === 'list' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Pages Management Interface
              </h2>
              <p className="text-gray-600 mb-6">
                This demonstrates the complete pages listing with search, filtering, and management capabilities.
              </p>
              
              <PageList
                onEdit={handleEditPage}
                onPreview={handlePreviewPage}
                onDelete={(pageId) => {
                  console.log('Delete page:', pageId);
                  alert('Page deleted successfully! (Demo mode)');
                }}
              />
            </div>
          )}

          {currentView === 'form' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Page Editor Interface
              </h2>
              <p className="text-gray-600 mb-6">
                This shows the complete page editing experience with rich text editor, SEO fields, and template selection.
              </p>
              
              <PageForm
                page={selectedPage}
                onSave={handleSavePage}
                onCancel={() => {
                  setCurrentView('list');
                  setSelectedPage(null);
                }}
                onPreview={handlePreviewPage}
              />
            </div>
          )}

          {currentView === 'templates' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Template Selection Interface
              </h2>
              <p className="text-gray-600 mb-6">
                This demonstrates the template selection system with different page layouts and field configurations.
              </p>
              
              <TemplateSelector
                selectedTemplate="about"
                onSelect={(templateId) => {
                  console.log('Selected template:', templateId);
                  alert(`Template "${templateId}" selected! (Demo mode)`);
                }}
              />
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              CRUD Operations
            </h3>
            <p className="text-gray-600 text-sm">
              Complete Create, Read, Update, Delete operations for content pages with proper validation and error handling.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Template System
            </h3>
            <p className="text-gray-600 text-sm">
              Multiple page templates (Default, Landing, About, Contact, Blog Post) with customizable field configurations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              SEO Optimization
            </h3>
            <p className="text-gray-600 text-sm">
              Built-in SEO fields including meta titles, descriptions, and URL slug management with character count guidance.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Publication Workflow
            </h3>
            <p className="text-gray-600 text-sm">
              Status management (Draft, Review, Published, Archived) with scheduled publishing and publication date tracking.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Preview System
            </h3>
            <p className="text-gray-600 text-sm">
              Live preview functionality with temporary preview URLs and token-based access for secure content review.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Rich Content Editor
            </h3>
            <p className="text-gray-600 text-sm">
              Integrated rich text editor with media insertion, formatting options, and content sanitization for security.
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
                <code className="text-sm font-mono">/api/pages</code>
              </div>
              <p className="text-sm text-gray-600">List pages with filtering, search, and pagination support.</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">POST</span>
                <code className="text-sm font-mono">/api/pages</code>
              </div>
              <p className="text-sm text-gray-600">Create new pages with validation and slug uniqueness checking.</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">PUT</span>
                <code className="text-sm font-mono">/api/pages/[id]</code>
              </div>
              <p className="text-sm text-gray-600">Update existing pages with conflict detection and status management.</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">DELETE</span>
                <code className="text-sm font-mono">/api/pages/[id]</code>
              </div>
              <p className="text-sm text-gray-600">Delete pages with proper authorization and cleanup.</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">GET</span>
                <code className="text-sm font-mono">/api/pages/templates</code>
              </div>
              <p className="text-sm text-gray-600">Get available page templates with field configurations.</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">POST</span>
                <code className="text-sm font-mono">/api/pages/[id]/preview</code>
              </div>
              <p className="text-sm text-gray-600">Generate preview URLs with temporary access tokens.</p>
            </div>
          </div>
        </div>

        {/* Template Information */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Available Templates
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Default Page</h3>
              <p className="text-sm text-gray-600 mb-2">Standard page layout with title, content, and sidebar</p>
              <div className="text-xs text-gray-500">Fields: title*, content, excerpt</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Landing Page</h3>
              <p className="text-sm text-gray-600 mb-2">Full-width landing page with hero section and CTA</p>
              <div className="text-xs text-gray-500">Fields: title*, heroTitle*, heroSubtitle, heroImage, content, ctaText, ctaUrl</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">About Page</h3>
              <p className="text-sm text-gray-600 mb-2">About page with team section and company information</p>
              <div className="text-xs text-gray-500">Fields: title*, content, mission, vision, teamSection</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Contact Page</h3>
              <p className="text-sm text-gray-600 mb-2">Contact page with form and location information</p>
              <div className="text-xs text-gray-500">Fields: title*, content, address, phone, email, mapEmbed</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Blog Post</h3>
              <p className="text-sm text-gray-600 mb-2">Blog post layout with author info and related posts</p>
              <div className="text-xs text-gray-500">Fields: title*, content*, excerpt*, featuredImage, author, publishDate, tags</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Product Showcase</h3>
              <p className="text-sm text-gray-600 mb-2">Product showcase page with gallery and specifications</p>
              <div className="text-xs text-gray-500">Fields: title*, content, productGallery, specifications, features, pricing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}