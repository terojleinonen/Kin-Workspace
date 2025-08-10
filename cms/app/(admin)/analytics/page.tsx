import { Metadata } from 'next';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Analytics Dashboard - CMS',
  description: 'Monitor performance and track key metrics across your content management system',
};

export default function AnalyticsPage() {
  return (
    <div className=\"min-h-screen bg-gray-50\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}