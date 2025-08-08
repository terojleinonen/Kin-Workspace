import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from './components/auth/SessionProvider'

export const metadata: Metadata = {
  title: 'Kin Workspace CMS',
  description: 'Content Management System for Kin Workspace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <SessionProvider>
          <div className="min-h-screen">
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <h1 className="text-xl font-semibold text-gray-900">
                    Kin Workspace CMS
                  </h1>
                  <nav className="flex space-x-4">
                    <a href="/" className="text-gray-600 hover:text-gray-900">
                      Dashboard
                    </a>
                    <a href="/products" className="text-gray-600 hover:text-gray-900">
                      Products
                    </a>
                    <a href="/orders" className="text-gray-600 hover:text-gray-900">
                      Orders
                    </a>
                  </nav>
                </div>
              </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}