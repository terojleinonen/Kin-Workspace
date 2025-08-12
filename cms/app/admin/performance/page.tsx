import { Metadata } from 'next';
import PerformanceDashboard from '@/components/performance/PerformanceDashboard';

export const metadata: Metadata = {
  title: 'Performance Dashboard - CMS',
  description: 'Monitor system performance and optimize bottlenecks',
};

export default function PerformancePage() {
  return (
    <div className=\"min-h-screen bg-gray-50\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        <PerformanceDashboard />
      </div>
    </div>
  );
}