'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  lastUsed: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

interface ApiKeyStats {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
}

export default function ApiKeyManager() {
  const { data: session } = useSession();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedKeyStats, setSelectedKeyStats] = useState<ApiKeyStats | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Form state
  const [keyName, setKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expirationDate, setExpirationDate] = useState('');

  const availablePermissions = [
    { id: 'products:read', label: 'Read Products', description: 'Access product data' },
    { id: 'categories:read', label: 'Read Categories', description: 'Access category data' },
    { id: 'pages:read', label: 'Read Pages', description: 'Access page content' },
    { id: 'media:read', label: 'Read Media', description: 'Access media files' },
    { id: '*', label: 'Full Access', description: 'All permissions (admin only)' }
  ];

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      loadApiKeys();
    }
  }, [session]);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: keyName,
          permissions: selectedPermissions,
          expiresAt: expirationDate ? new Date(expirationDate).toISOString() : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.apiKey);
        await loadApiKeys();
        
        // Reset form
        setKeyName('');
        setSelectedPermissions([]);
        setExpirationDate('');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadApiKeys();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const loadApiKeyStats = async (keyId: string) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setSelectedKeyStats(data.stats);
        setShowStatsModal(true);
      }
    } catch (error) {
      console.error('Error loading API key stats:', error);
    }
  };

  const getStatusColor = (isActive: boolean, expiresAt: Date | null) => {
    if (!isActive) return 'bg-red-100 text-red-800';
    if (expiresAt && new Date(expiresAt) < new Date()) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusLabel = (isActive: boolean, expiresAt: Date | null) => {
    if (!isActive) return 'Inactive';
    if (expiresAt && new Date(expiresAt) < new Date()) return 'Expired';
    return 'Active';
  };

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className=\"text-center py-8\">
        <KeyIcon className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />
        <h3 className=\"text-lg font-medium text-gray-900 mb-2\">Access Denied</h3>
        <p className=\"text-gray-600\">Only administrators can manage API keys.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center py-8\">
        <div className=\"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600\"></div>
        <span className=\"ml-3 text-gray-600\">Loading API keys...</span>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h3 className=\"text-lg font-medium text-gray-900\">API Key Management</h3>
          <p className=\"text-sm text-gray-600\">
            Manage API keys for e-commerce integration
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className=\"flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700\"
        >
          <PlusIcon className=\"h-4 w-4 mr-2\" />
          Create API Key
        </button>
      </div>

      {/* API Keys List */}
      <div className=\"bg-white border border-gray-200 rounded-lg overflow-hidden\">
        {apiKeys.length > 0 ? (
          <div className=\"divide-y divide-gray-200\">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className=\"p-4\">
                <div className=\"flex items-center justify-between\">
                  <div className=\"flex-1\">
                    <div className=\"flex items-center mb-2\">
                      <h4 className=\"font-medium text-gray-900\">{apiKey.name}</h4>
                      <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getStatusColor(apiKey.isActive, apiKey.expiresAt)}`}>
                        {getStatusLabel(apiKey.isActive, apiKey.expiresAt)}
                      </span>
                    </div>
                    
                    <div className=\"text-sm text-gray-600 space-y-1\">
                      <p>Permissions: {apiKey.permissions.join(', ')}</p>
                      <p>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</p>
                      {apiKey.lastUsed && (
                        <p>Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}</p>
                      )}
                      {apiKey.expiresAt && (
                        <p>Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className=\"flex items-center space-x-2 ml-4\">
                    <button
                      onClick={() => loadApiKeyStats(apiKey.id)}
                      className=\"p-2 text-gray-400 hover:text-gray-600 rounded\"
                      title=\"View statistics\"
                    >
                      <ChartBarIcon className=\"h-4 w-4\" />
                    </button>
                    
                    <button
                      onClick={() => deleteApiKey(apiKey.id)}
                      className=\"p-2 text-red-400 hover:text-red-600 rounded\"
                      title=\"Delete API key\"
                    >
                      <TrashIcon className=\"h-4 w-4\" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className=\"p-8 text-center\">
            <KeyIcon className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />
            <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No API keys</h3>
            <p className=\"text-gray-600 mb-4\">Create your first API key to enable e-commerce integration.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700\"
            >
              Create API Key
            </button>
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50\">
          <div className=\"bg-white rounded-lg p-6 w-full max-w-md mx-4\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Create API Key</h3>
            
            <div className=\"space-y-4\">
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Key Name
                </label>
                <input
                  type=\"text\"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                  placeholder=\"E-commerce Frontend\"
                />
              </div>
              
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Permissions
                </label>
                <div className=\"space-y-2 max-h-32 overflow-y-auto\">
                  {availablePermissions.map((permission) => (
                    <label key={permission.id} className=\"flex items-start\">
                      <input
                        type=\"checkbox\"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== permission.id));
                          }
                        }}
                        className=\"mt-1 mr-2\"
                      />
                      <div>
                        <span className=\"text-sm font-medium\">{permission.label}</span>
                        <p className=\"text-xs text-gray-600\">{permission.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Expiration Date (Optional)
                </label>
                <input
                  type=\"date\"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                />
              </div>
            </div>
            
            <div className=\"flex justify-end space-x-3 mt-6\">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setKeyName('');
                  setSelectedPermissions([]);
                  setExpirationDate('');
                  setNewApiKey('');
                }}
                className=\"px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50\"
              >
                Cancel
              </button>
              <button
                onClick={createApiKey}
                disabled={!keyName || selectedPermissions.length === 0}
                className=\"px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed\"
              >
                Create Key
              </button>
            </div>
            
            {/* Show new API key */}
            {newApiKey && (
              <div className=\"mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg\">
                <h4 className=\"font-medium text-yellow-800 mb-2\">API Key Created</h4>
                <p className=\"text-sm text-yellow-700 mb-3\">
                  Save this API key now. You won't be able to see it again.
                </p>
                <div className=\"flex items-center space-x-2\">
                  <code className=\"flex-1 px-3 py-2 bg-white border border-yellow-300 rounded text-sm font-mono\">
                    {newApiKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newApiKey)}
                    className=\"p-2 text-yellow-600 hover:text-yellow-700\"
                    title=\"Copy to clipboard\"
                  >
                    <ClipboardDocumentIcon className=\"h-4 w-4\" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && selectedKeyStats && (
        <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50\">
          <div className=\"bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">API Key Statistics</h3>
            
            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 mb-6\">
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-gray-900\">{selectedKeyStats.totalRequests}</p>
                <p className=\"text-sm text-gray-600\">Total Requests</p>
              </div>
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-green-600\">{selectedKeyStats.successfulRequests}</p>
                <p className=\"text-sm text-gray-600\">Successful</p>
              </div>
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-red-600\">{selectedKeyStats.errorRequests}</p>
                <p className=\"text-sm text-gray-600\">Errors</p>
              </div>
              <div className=\"text-center\">
                <p className=\"text-2xl font-semibold text-blue-600\">{selectedKeyStats.averageResponseTime}ms</p>
                <p className=\"text-sm text-gray-600\">Avg Response</p>
              </div>
            </div>
            
            {selectedKeyStats.topEndpoints.length > 0 && (
              <div>
                <h4 className=\"font-medium text-gray-700 mb-3\">Top Endpoints</h4>
                <div className=\"space-y-2\">
                  {selectedKeyStats.topEndpoints.map((endpoint, index) => (
                    <div key={index} className=\"flex items-center justify-between py-2 px-3 bg-gray-50 rounded\">
                      <span className=\"text-sm font-mono\">{endpoint.endpoint}</span>
                      <span className=\"text-sm font-medium\">{endpoint.count} requests</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className=\"flex justify-end mt-6\">
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setSelectedKeyStats(null);
                }}
                className=\"px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50\"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}