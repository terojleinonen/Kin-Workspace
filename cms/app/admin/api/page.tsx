import { Metadata } from 'next';
import { Suspense } from 'react';
import ApiKeyManager from '@/components/api/ApiKeyManager';
import ApiDocumentation from '@/components/api/ApiDocumentation';

export const metadata: Metadata = {
  title: 'API Integration - CMS',
  description: 'Manage API keys and view documentation for e-commerce integration',
};

export default function ApiIntegrationPage() {
  return (
    <div className=\"min-h-screen bg-gray-50\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        <div className=\"space-y-8\">
          {/* Header */}
          <div>
            <h1 className=\"text-3xl font-bold text-gray-900\">API Integration</h1>
            <p className=\"mt-2 text-gray-600\">
              Manage API keys and integrate your e-commerce frontend with the CMS
            </p>
          </div>

          {/* API Key Management */}
          <div className=\"bg-white rounded-lg border border-gray-200 p-6\">
            <Suspense 
              fallback={
                <div className=\"flex items-center justify-center py-8\">
                  <div className=\"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600\"></div>
                  <span className=\"ml-3 text-gray-600\">Loading API keys...</span>
                </div>
              }
            >
              <ApiKeyManager />
            </Suspense>
          </div>

          {/* API Documentation */}
          <div>
            <ApiDocumentation />
          </div>
        </div>
      </div>
    </div>
  );
}