import { Metadata } from 'next';
import BackupManager from '@/components/backup/BackupManager';

export const metadata: Metadata = {
  title: 'Backup & Recovery - CMS',
  description: 'Create, manage, and restore system backups',
};

export default function BackupPage() {
  return (
    <div className=\"min-h-screen bg-gray-50\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        <div className=\"space-y-6\">
          {/* Header */}
          <div>
            <h1 className=\"text-3xl font-bold text-gray-900\">Backup & Recovery</h1>
            <p className=\"mt-2 text-gray-600\">
              Protect your data with automated backups and reliable recovery options
            </p>
          </div>

          {/* Backup Manager */}
          <div className=\"bg-white rounded-lg border border-gray-200 p-6\">
            <BackupManager />
          </div>

          {/* Backup Information */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
            <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-6\">
              <h3 className=\"text-lg font-medium text-blue-900 mb-3\">Backup Types</h3>
              <div className=\"space-y-2 text-sm text-blue-800\">
                <p><strong>Full Backup:</strong> Complete database and media files backup</p>
                <p><strong>Database:</strong> Only database content and structure</p>
                <p><strong>Media:</strong> Only uploaded files and images</p>
              </div>
            </div>

            <div className=\"bg-green-50 border border-green-200 rounded-lg p-6\">
              <h3 className=\"text-lg font-medium text-green-900 mb-3\">Best Practices</h3>
              <div className=\"space-y-2 text-sm text-green-800\">
                <p>• Schedule regular automated backups</p>
                <p>• Test restore procedures periodically</p>
                <p>• Store backups in multiple locations</p>
                <p>• Monitor backup success and failures</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}