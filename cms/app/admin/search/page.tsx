import { Suspense } from 'react';
import { Metadata } from 'next';
import SearchResults from '@/components/search/SearchResults';

export const metadata: Metadata = {
  title: 'Search - CMS',
  description: 'Search products, pages, and media content',
};

interface SearchPageProps {
  searchParams: {
    q?: string;
    type?: string;
    category?: string;
    status?: string;
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const initialQuery = searchParams.q || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Search</h1>
          <p className="mt-2 text-gray-600">
            Find products, pages, and media content across your CMS
          </p>
        </div>

        <Suspense 
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading search...</span>
            </div>
          }
        >
          <SearchResults initialQuery={initialQuery} />
        </Suspense>
      </div>
    </div>
  );
}