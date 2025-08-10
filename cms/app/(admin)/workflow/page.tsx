import { Metadata } from 'next';
import WorkflowDashboard from '@/components/workflow/WorkflowDashboard';

export const metadata: Metadata = {
  title: 'Content Workflow - CMS',
  description: 'Manage content approval process and publication workflow',
};

export default function WorkflowPage() {
  return (
    <div className=\"min-h-screen bg-gray-50\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        <WorkflowDashboard />
      </div>
    </div>
  );
}