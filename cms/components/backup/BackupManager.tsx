'use client';

import { useState, useEffect } from 'react';
import {
  CircleStackIcon,
  PhotoIcon,
  ServerIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface BackupMetadata {
  id: string;
  type: 'database' | 'media' | 'full';
  filename: string;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  createdAt: string;
  createdBy: string;
  description?: string;
  checksum: string;
  version: string;
}

interface BackupStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  error?: string;
}

export default function BackupManager() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [activeBackups, setActiveBackups] = useState<BackupStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'database' | 'media' | 'full'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);

  // Form states
  const [backupType, setBackupType] = useState<'database' | 'media' | 'full'>('full');
  const [backupDescription, setBackupDescription] = useState('');
  const [restoreOptions, setRestoreOptions] = useState({
    restoreDatabase: true,
    restoreMedia: true,
    overwriteExisting: false,
    confirmRestore: false
  });

  useEffect(() => {
    loadBackups();
    
    // Poll for active backup status
    const interval = setInterval(() => {
      if (activeBackups.length > 0) {
        checkActiveBackups();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedType, activeBackups.length]);

  const loadBackups = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }

      const response = await fetch(`/api/admin/backup?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkActiveBackups = async () => {
    const updatedBackups = await Promise.all(
      activeBackups.map(async (backup) => {
        try {
          const response = await fetch(`/api/admin/backup/status/${backup.id}`);
          if (response.ok) {
            const data = await response.json();
            return data.status;
          }
        } catch (error) {
          console.error('Error checking backup status:', error);
        }
        return backup;
      })
    );

    setActiveBackups(updatedBackups.filter(backup => 
      backup.status === 'pending' || backup.status === 'running'
    ));

    // Reload backups if any completed
    const completedBackups = updatedBackups.filter(backup => 
      backup.status === 'completed' || backup.status === 'failed'
    );
    
    if (completedBackups.length > 0) {
      loadBackups();
    }
  };

  const createBackup = async () => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: backupType,
          description: backupDescription || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add to active backups for monitoring
        setActiveBackups(prev => [...prev, {
          id: data.backupId,
          status: 'pending',
          progress: 0,
          startTime: new Date().toISOString()
        }]);

        setShowCreateModal(false);
        setBackupDescription('');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup');
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup || !restoreOptions.confirmRestore) {
      return;
    }

    try {
      const response = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backupId: selectedBackup.id,
          ...restoreOptions
        })
      });

      if (response.ok) {
        alert('Backup restored successfully');
        setShowRestoreModal(false);
        setSelectedBackup(null);
        setRestoreOptions({
          restoreDatabase: true,
          restoreMedia: true,
          overwriteExisting: false,
          confirmRestore: false
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Failed to restore backup');
    }
  };

  const cleanupOldBackups = async () => {
    if (!confirm('Are you sure you want to cleanup old backups? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/backup', {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Cleanup completed: ${data.deletedCount} backups deleted, ${formatBytes(data.freedSpace)} freed`);
        loadBackups();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
      alert('Failed to cleanup backups');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <CircleStackIcon className=\"h-5 w-5 text-blue-500\" />;
      case 'media':
        return <PhotoIcon className=\"h-5 w-5 text-green-500\" />;
      case 'full':
        return <ServerIcon className=\"h-5 w-5 text-purple-500\" />;
      default:
        return <DocumentArrowDownIcon className=\"h-5 w-5 text-gray-500\" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className=\"h-5 w-5 text-green-500\" />;
      case 'running':
        return <ClockIcon className=\"h-5 w-5 text-yellow-500 animate-spin\" />;
      case 'failed':
        return <ExclamationTriangleIcon className=\"h-5 w-5 text-red-500\" />;
      default:
        return <ClockIcon className=\"h-5 w-5 text-gray-500\" />;
    }
  };

  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center py-8\">
        <div className=\"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600\"></div>
        <span className=\"ml-3 text-gray-600\">Loading backups...</span>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h3 className=\"text-lg font-medium text-gray-900\">Backup Management</h3>
          <p className=\"text-sm text-gray-600\">
            Create, manage, and restore system backups
          </p>
        </div>
        
        <div className=\"flex items-center space-x-3\">
          <button
            onClick={cleanupOldBackups}
            className=\"flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50\"
          >
            <TrashIcon className=\"h-4 w-4 mr-2\" />
            Cleanup Old
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className=\"flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700\"
          >
            <CloudArrowUpIcon className=\"h-4 w-4 mr-2\" />
            Create Backup
          </button>
        </div>
      </div>

      {/* Active Backups */}
      {activeBackups.length > 0 && (
        <div className=\"bg-yellow-50 border border-yellow-200 rounded-lg p-4\">
          <h4 className=\"font-medium text-yellow-800 mb-3\">Active Backups</h4>
          <div className=\"space-y-2\">
            {activeBackups.map((backup) => (
              <div key={backup.id} className=\"flex items-center justify-between py-2 px-3 bg-white rounded border\">
                <div className=\"flex items-center\">
                  {getStatusIcon(backup.status)}
                  <span className=\"ml-3 text-sm font-medium\">{backup.id}</span>
                  <span className=\"ml-2 text-sm text-gray-600 capitalize\">{backup.status}</span>
                </div>
                <div className=\"flex items-center\">
                  <div className=\"w-32 bg-gray-200 rounded-full h-2 mr-3\">
                    <div 
                      className=\"bg-blue-600 h-2 rounded-full transition-all duration-300\"
                      style={{ width: `${backup.progress}%` }}
                    ></div>
                  </div>
                  <span className=\"text-sm text-gray-600\">{backup.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className=\"border-b border-gray-200\">
        <nav className=\"-mb-px flex space-x-8\">
          {[
            { id: 'all', label: 'All Backups' },
            { id: 'full', label: 'Full Backups' },
            { id: 'database', label: 'Database' },
            { id: 'media', label: 'Media' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedType === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Backups List */}
      <div className=\"bg-white border border-gray-200 rounded-lg overflow-hidden\">
        {backups.length > 0 ? (
          <div className=\"divide-y divide-gray-200\">
            {backups.map((backup) => (
              <div key={backup.id} className=\"p-4 hover:bg-gray-50\">
                <div className=\"flex items-center justify-between\">
                  <div className=\"flex items-center flex-1\">
                    {getTypeIcon(backup.type)}
                    <div className=\"ml-4 flex-1\">
                      <div className=\"flex items-center mb-1\">
                        <h4 className=\"font-medium text-gray-900\">{backup.filename}</h4>
                        <span className=\"ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded capitalize\">
                          {backup.type}
                        </span>
                        {backup.compressed && (
                          <span className=\"ml-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded\">
                            Compressed
                          </span>
                        )}
                        {backup.encrypted && (
                          <span className=\"ml-1 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded\">
                            Encrypted
                          </span>
                        )}
                      </div>
                      
                      <div className=\"text-sm text-gray-600 space-y-1\">
                        <p>Size: {formatBytes(backup.size)}</p>
                        <p>Created: {new Date(backup.createdAt).toLocaleString()}</p>
                        {backup.description && <p>Description: {backup.description}</p>}
                      </div>
                    </div>
                  </div>
                  
                  <div className=\"flex items-center space-x-2 ml-4\">
                    <button
                      onClick={() => {
                        setSelectedBackup(backup);
                        setShowRestoreModal(true);
                      }}
                      className=\"flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100\"
                    >
                      <CloudArrowDownIcon className=\"h-4 w-4 mr-1\" />
                      Restore
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className=\"p-8 text-center\">
            <ServerIcon className=\"h-12 w-12 text-gray-400 mx-auto mb-4\" />
            <h3 className=\"text-lg font-medium text-gray-900 mb-2\">No backups found</h3>
            <p className=\"text-gray-600 mb-4\">Create your first backup to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700\"
            >
              Create Backup
            </button>
          </div>
        )}
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50\">
          <div className=\"bg-white rounded-lg p-6 w-full max-w-md mx-4\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Create Backup</h3>
            
            <div className=\"space-y-4\">
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Backup Type
                </label>
                <select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value as any)}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                >
                  <option value=\"full\">Full Backup (Database + Media)</option>
                  <option value=\"database\">Database Only</option>
                  <option value=\"media\">Media Files Only</option>
                </select>
              </div>
              
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Description (Optional)
                </label>
                <textarea
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  rows={3}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                  placeholder=\"Describe this backup...\"
                />
              </div>
            </div>
            
            <div className=\"flex justify-end space-x-3 mt-6\">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setBackupDescription('');
                }}
                className=\"px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50\"
              >
                Cancel
              </button>
              <button
                onClick={createBackup}
                className=\"px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700\"
              >
                Create Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && selectedBackup && (
        <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50\">
          <div className=\"bg-white rounded-lg p-6 w-full max-w-md mx-4\">
            <h3 className=\"text-lg font-medium text-gray-900 mb-4\">Restore Backup</h3>
            
            <div className=\"mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded\">
              <p className=\"text-sm text-yellow-800\">
                <strong>Warning:</strong> This will restore data from the selected backup. 
                Current data may be overwritten.
              </p>
            </div>

            <div className=\"mb-4\">
              <p className=\"text-sm text-gray-600 mb-2\">
                <strong>Backup:</strong> {selectedBackup.filename}
              </p>
              <p className=\"text-sm text-gray-600 mb-2\">
                <strong>Created:</strong> {new Date(selectedBackup.createdAt).toLocaleString()}
              </p>
              <p className=\"text-sm text-gray-600\">
                <strong>Size:</strong> {formatBytes(selectedBackup.size)}
              </p>
            </div>
            
            <div className=\"space-y-3 mb-4\">
              {selectedBackup.type === 'full' && (
                <>
                  <label className=\"flex items-center\">
                    <input
                      type=\"checkbox\"
                      checked={restoreOptions.restoreDatabase}
                      onChange={(e) => setRestoreOptions(prev => ({ 
                        ...prev, 
                        restoreDatabase: e.target.checked 
                      }))}
                      className=\"mr-2\"
                    />
                    <span className=\"text-sm\">Restore Database</span>
                  </label>
                  
                  <label className=\"flex items-center\">
                    <input
                      type=\"checkbox\"
                      checked={restoreOptions.restoreMedia}
                      onChange={(e) => setRestoreOptions(prev => ({ 
                        ...prev, 
                        restoreMedia: e.target.checked 
                      }))}
                      className=\"mr-2\"
                    />
                    <span className=\"text-sm\">Restore Media Files</span>
                  </label>
                </>
              )}
              
              <label className=\"flex items-center\">
                <input
                  type=\"checkbox\"
                  checked={restoreOptions.overwriteExisting}
                  onChange={(e) => setRestoreOptions(prev => ({ 
                    ...prev, 
                    overwriteExisting: e.target.checked 
                  }))}
                  className=\"mr-2\"
                />
                <span className=\"text-sm\">Overwrite existing files</span>
              </label>
              
              <label className=\"flex items-center\">
                <input
                  type=\"checkbox\"
                  checked={restoreOptions.confirmRestore}
                  onChange={(e) => setRestoreOptions(prev => ({ 
                    ...prev, 
                    confirmRestore: e.target.checked 
                  }))}
                  className=\"mr-2\"
                />
                <span className=\"text-sm font-medium text-red-600\">
                  I understand this will overwrite current data
                </span>
              </label>
            </div>
            
            <div className=\"flex justify-end space-x-3\">
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedBackup(null);
                  setRestoreOptions({
                    restoreDatabase: true,
                    restoreMedia: true,
                    overwriteExisting: false,
                    confirmRestore: false
                  });
                }}
                className=\"px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50\"
              >
                Cancel
              </button>
              <button
                onClick={restoreBackup}
                disabled={!restoreOptions.confirmRestore}
                className=\"px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed\"
              >
                Restore Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}