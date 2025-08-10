'use client';

import { useState } from 'react';
import {
  DocumentTextIcon,
  CodeBracketIcon,
  KeyIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  permissions: string[];
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  response: string;
  example: string;
}

export default function ApiDocumentation() {
  const [activeSection, setActiveSection] = useState<'overview' | 'auth' | 'endpoints' | 'examples'>('overview');

  const endpoints: ApiEndpoint[] = [
    {
      method: 'GET',
      path: '/api/public/products',
      description: 'Retrieve a list of published products with pagination and filtering',
      permissions: ['products:read'],
      parameters: [
        { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
        { name: 'limit', type: 'number', required: false, description: 'Items per page (default: 20, max: 100)' },
        { name: 'category', type: 'string', required: false, description: 'Filter by category slug' },
        { name: 'featured', type: 'boolean', required: false, description: 'Filter featured products' },
        { name: 'search', type: 'string', required: false, description: 'Search in name and description' },
        { name: 'sortBy', type: 'string', required: false, description: 'Sort by: name, price, createdAt, updatedAt' },
        { name: 'sortOrder', type: 'string', required: false, description: 'Sort order: asc, desc' }
      ],
      response: `{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "slug": "product-slug",
      "description": "Product description",
      "price": 99.99,
      "comparePrice": 129.99,
      "sku": "PROD-001",
      "inventoryQuantity": 50,
      "featured": true,
      "categories": [...],
      "images": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}`,
      example: `curl -X GET "https://your-cms.com/api/public/products?page=1&limit=10&featured=true" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`
    },
    {
      method: 'GET',
      path: '/api/public/products/{id}',
      description: 'Retrieve a single product by ID or slug',
      permissions: ['products:read'],
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Product ID or slug' }
      ],
      response: `{
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "slug": "product-slug",
    "description": "Full product description",
    "price": 99.99,
    "categories": [...],
    "images": [...],
    "creator": "Creator Name"
  },
  "relatedProducts": [...]
}`,
      example: `curl -X GET "https://your-cms.com/api/public/products/product-slug" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`
    },
    {
      method: 'GET',
      path: '/api/public/categories',
      description: 'Retrieve category hierarchy with optional product data',
      permissions: ['categories:read'],
      parameters: [
        { name: 'includeProducts', type: 'boolean', required: false, description: 'Include products in each category' },
        { name: 'includeEmpty', type: 'boolean', required: false, description: 'Include categories with no products' },
        { name: 'parentId', type: 'string', required: false, description: 'Get children of specific category' }
      ],
      response: `{
  "categories": [
    {
      "id": "uuid",
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Category description",
      "productCount": 25,
      "children": [...],
      "products": [...]
    }
  ]
}`,
      example: `curl -X GET "https://your-cms.com/api/public/categories?includeProducts=true" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`
    }
  ];

  const CodeBlock = ({ children }: { children: string }) => (
    <pre className=\"bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm\">
      <code>{children}</code>
    </pre>
  );

  return (
    <div className=\"max-w-6xl mx-auto space-y-6\">
      {/* Header */}
      <div>
        <h2 className=\"text-2xl font-bold text-gray-900\">API Documentation</h2>
        <p className=\"mt-1 text-gray-600\">
          Complete guide to integrating with the Kin Workspace CMS API
        </p>
      </div>

      {/* Navigation */}
      <div className=\"border-b border-gray-200\">
        <nav className=\"-mb-px flex space-x-8\">
          {[
            { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
            { id: 'auth', label: 'Authentication', icon: KeyIcon },
            { id: 'endpoints', label: 'Endpoints', icon: CodeBracketIcon },
            { id: 'examples', label: 'Examples', icon: ShieldCheckIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className=\"h-4 w-4 mr-2\" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className=\"bg-white rounded-lg border border-gray-200 p-6\">
        {activeSection === 'overview' && (
          <div className=\"space-y-6\">
            <div>
              <h3 className=\"text-lg font-medium text-gray-900 mb-3\">API Overview</h3>
              <p className=\"text-gray-600 mb-4\">
                The Kin Workspace CMS API provides RESTful endpoints for accessing product data, 
                categories, and content for your e-commerce frontend applications.
              </p>
            </div>

            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
              <div className=\"border border-gray-200 rounded-lg p-4\">
                <div className=\"flex items-center mb-3\">
                  <ShieldCheckIcon className=\"h-5 w-5 text-green-500 mr-2\" />
                  <h4 className=\"font-medium text-gray-900\">Secure</h4>
                </div>
                <p className=\"text-sm text-gray-600\">
                  JWT-based authentication with API key management and role-based permissions.
                </p>
              </div>

              <div className=\"border border-gray-200 rounded-lg p-4\">
                <div className=\"flex items-center mb-3\">
                  <ClockIcon className=\"h-5 w-5 text-blue-500 mr-2\" />
                  <h4 className=\"font-medium text-gray-900\">Rate Limited</h4>
                </div>
                <p className=\"text-sm text-gray-600\">
                  Built-in rate limiting to ensure fair usage and optimal performance.
                </p>
              </div>
            </div>

            <div>
              <h4 className=\"font-medium text-gray-900 mb-3\">Base URL</h4>
              <CodeBlock>https://your-cms-domain.com/api/public</CodeBlock>
            </div>

            <div>
              <h4 className=\"font-medium text-gray-900 mb-3\">Response Format</h4>
              <p className=\"text-gray-600 mb-3\">All API responses are in JSON format and include:</p>
              <ul className=\"list-disc list-inside text-sm text-gray-600 space-y-1\">
                <li>Data payload in the main response body</li>
                <li>Pagination information where applicable</li>
                <li>Meta information including timestamp and API version</li>
                <li>Error details for failed requests</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'auth' && (
          <div className=\"space-y-6\">
            <div>
              <h3 className=\"text-lg font-medium text-gray-900 mb-3\">Authentication</h3>
              <p className=\"text-gray-600 mb-4\">
                The API uses JWT (JSON Web Token) authentication. You'll need to exchange your API key 
                for a JWT token before making requests.
              </p>
            </div>

            <div>
              <h4 className=\"font-medium text-gray-900 mb-3\">Step 1: Get JWT Token</h4>
              <p className=\"text-gray-600 mb-3\">Exchange your API key for a JWT token:</p>
              <CodeBlock>{`POST /api/auth/token
Content-Type: application/json

{
  "apiKey": "kw_your_api_key_here"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400
}`}</CodeBlock>
            </div>

            <div>
              <h4 className=\"font-medium text-gray-900 mb-3\">Step 2: Use JWT Token</h4>
              <p className=\"text-gray-600 mb-3\">Include the JWT token in the Authorization header:</p>
              <CodeBlock>{`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}</CodeBlock>
            </div>

            <div className=\"bg-yellow-50 border border-yellow-200 rounded-lg p-4\">
              <div className=\"flex items-start\">
                <ExclamationTriangleIcon className=\"h-5 w-5 text-yellow-400 mr-2 mt-0.5\" />
                <div>
                  <h4 className=\"font-medium text-yellow-800\">Important Notes</h4>
                  <ul className=\"mt-2 text-sm text-yellow-700 space-y-1\">
                    <li>• JWT tokens expire after 24 hours</li>
                    <li>• Store your API key securely and never expose it in client-side code</li>
                    <li>• API keys can be revoked at any time from the admin panel</li>
                    <li>• Each API key has specific permissions - ensure you have the required permissions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'endpoints' && (
          <div className=\"space-y-8\">
            <div>
              <h3 className=\"text-lg font-medium text-gray-900 mb-3\">API Endpoints</h3>
              <p className=\"text-gray-600 mb-6\">
                Complete list of available endpoints with parameters and response formats.
              </p>
            </div>

            {endpoints.map((endpoint, index) => (
              <div key={index} className=\"border border-gray-200 rounded-lg p-6\">
                <div className=\"flex items-center mb-4\">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className=\"ml-3 text-sm font-mono text-gray-900\">{endpoint.path}</code>
                </div>

                <p className=\"text-gray-600 mb-4\">{endpoint.description}</p>

                <div className=\"mb-4\">
                  <h5 className=\"font-medium text-gray-900 mb-2\">Required Permissions</h5>
                  <div className=\"flex flex-wrap gap-2\">
                    {endpoint.permissions.map((permission) => (
                      <span key={permission} className=\"px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded\">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>

                {endpoint.parameters && (
                  <div className=\"mb-4\">
                    <h5 className=\"font-medium text-gray-900 mb-2\">Parameters</h5>
                    <div className=\"overflow-x-auto\">
                      <table className=\"min-w-full divide-y divide-gray-200\">
                        <thead className=\"bg-gray-50\">
                          <tr>
                            <th className=\"px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase\">Name</th>
                            <th className=\"px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase\">Type</th>
                            <th className=\"px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase\">Required</th>
                            <th className=\"px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase\">Description</th>
                          </tr>
                        </thead>
                        <tbody className=\"bg-white divide-y divide-gray-200\">
                          {endpoint.parameters.map((param) => (
                            <tr key={param.name}>
                              <td className=\"px-3 py-2 text-sm font-mono text-gray-900\">{param.name}</td>
                              <td className=\"px-3 py-2 text-sm text-gray-600\">{param.type}</td>
                              <td className=\"px-3 py-2 text-sm\">
                                <span className={`px-2 py-1 text-xs rounded ${
                                  param.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {param.required ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className=\"px-3 py-2 text-sm text-gray-600\">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className=\"mb-4\">
                  <h5 className=\"font-medium text-gray-900 mb-2\">Response Format</h5>
                  <CodeBlock>{endpoint.response}</CodeBlock>
                </div>

                <div>
                  <h5 className=\"font-medium text-gray-900 mb-2\">Example Request</h5>
                  <CodeBlock>{endpoint.example}</CodeBlock>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'examples' && (
          <div className=\"space-y-6\">
            <div>
              <h3 className=\"text-lg font-medium text-gray-900 mb-3\">Integration Examples</h3>
              <p className=\"text-gray-600 mb-6\">
                Common integration patterns and code examples for different scenarios.
              </p>
            </div>

            <div>
              <h4 className=\"font-medium text-gray-900 mb-3\">JavaScript/Node.js Example</h4>
              <CodeBlock>{`// API Client Class
class KinWorkspaceAPI {
  constructor(apiKey, baseUrl = 'https://your-cms.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.token = null;
  }

  async authenticate() {
    const response = await fetch(\`\${this.baseUrl}/api/auth/token\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: this.apiKey })
    });
    
    const data = await response.json();
    this.token = data.token;
    return this.token;
  }

  async getProducts(params = {}) {
    if (!this.token) await this.authenticate();
    
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(\`\${this.baseUrl}/api/public/products?\${queryString}\`, {
      headers: { 'Authorization': \`Bearer \${this.token}\` }
    });
    
    return response.json();
  }

  async getProduct(id) {
    if (!this.token) await this.authenticate();
    
    const response = await fetch(\`\${this.baseUrl}/api/public/products/\${id}\`, {
      headers: { 'Authorization': \`Bearer \${this.token}\` }
    });
    
    return response.json();
  }
}

// Usage
const api = new KinWorkspaceAPI('your-api-key');

// Get featured products
const featuredProducts = await api.getProducts({ featured: true, limit: 10 });

// Get specific product
const product = await api.getProduct('product-slug');`}</CodeBlock>
            </div>

            <div>
              <h4 className=\"font-medium text-gray-900 mb-3\">React Hook Example</h4>
              <CodeBlock>{`// useProducts.js
import { useState, useEffect } from 'react';

export function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const api = new KinWorkspaceAPI(process.env.REACT_APP_API_KEY);
        const data = await api.getProducts(params);
        setProducts(data.products);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [JSON.stringify(params)]);

  return { products, loading, error };
}

// Component usage
function ProductList() {
  const { products, loading, error } = useProducts({ 
    featured: true, 
    limit: 12 
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}`}</CodeBlock>
            </div>

            <div>
              <h4 className=\"font-medium text-gray-900 mb-3\">Error Handling</h4>
              <CodeBlock>{`// Comprehensive error handling
async function handleApiRequest(apiCall) {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      const errorData = await response.json();
      
      switch (response.status) {
        case 401:
          // Token expired or invalid
          await refreshToken();
          return handleApiRequest(apiCall); // Retry
        case 403:
          throw new Error('Insufficient permissions');
        case 429:
          throw new Error('Rate limit exceeded. Please try again later.');
        case 404:
          throw new Error('Resource not found');
        default:
          throw new Error(errorData.error || 'API request failed');
      }
    }
    
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}`}</CodeBlock>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}