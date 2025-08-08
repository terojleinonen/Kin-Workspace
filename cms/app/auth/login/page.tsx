/**
 * Login page
 * Provides user authentication interface
 */

import { Suspense } from 'react'
import LoginForm from '../../components/auth/LoginForm'

interface LoginPageProps {
  searchParams: {
    callbackUrl?: string
    error?: string
    message?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>
        {searchParams.message && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
            {searchParams.message}
          </div>
        )}
        <LoginForm 
          callbackUrl={searchParams.callbackUrl} 
          error={searchParams.error}
        />
      </div>
    </Suspense>
  )
}

export const metadata = {
  title: 'Sign In - Kin Workspace CMS',
  description: 'Sign in to the Kin Workspace Content Management System',
}