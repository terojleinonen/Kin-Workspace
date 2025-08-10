import { Metadata } from 'next';
import SearchAnalytics from '@/components/search/SearchAnalytics';

export const metadata: Metadata = {
  title: 'Search Analytics - CMS',
  description: 'Monitor search behavior and optimize content discoverability',
};

export default function SearchAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchAnalytics />
      </div>
    </div>
  );
}