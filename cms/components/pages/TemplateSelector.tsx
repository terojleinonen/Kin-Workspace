'use client';

import { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

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

interface TemplateSelectorProps {
  selectedTemplate?: string;
  onSelect: (templateId: string) => void;
  onClose?: () => void;
}

export default function TemplateSelector({ 
  selectedTemplate, 
  onSelect, 
  onClose 
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/pages/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (templateId: string) => {
    onSelect(templateId);
    if (onClose) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Choose a Template</h2>
        <p className="text-gray-600">Select a template that best fits your page content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleSelect(template.id)}
          >
            {/* Selection Indicator */}
            {selectedTemplate === template.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Template Preview */}
            <div className="aspect-video bg-gray-100 rounded-md mb-4 flex items-center justify-center">
              <div className="text-gray-400 text-sm">Preview</div>
            </div>

            {/* Template Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {template.description}
              </p>

              {/* Template Fields */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Available Fields:</h4>
                <div className="flex flex-wrap gap-1">
                  {template.fields.slice(0, 4).map((field) => (
                    <span
                      key={field.name}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        field.required
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {field.name}
                      {field.required && '*'}
                    </span>
                  ))}
                  {template.fields.length > 4 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                      +{template.fields.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Details */}
      {selectedTemplate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {(() => {
            const template = templates.find(t => t.id === selectedTemplate);
            if (!template) return null;

            return (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {template.name} - Field Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.fields.map((field) => (
                    <div key={field.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <span className="font-medium text-gray-900">{field.name}</span>
                        <span className="ml-2 text-sm text-gray-500">({field.type})</span>
                      </div>
                      {field.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}