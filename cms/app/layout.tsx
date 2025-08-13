import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from './components/auth/SessionProvider'
import LayoutWrapper from './components/layout/LayoutWrapper'

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
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </SessionProvider>
      </body>
    </html>
  )
}