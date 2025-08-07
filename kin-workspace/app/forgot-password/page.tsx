'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ForgotPasswordForm from '@/app/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [message, setMessage] = useState('')

  if (message) {
    return (
      <div className="min-h-screen bg-soft-white pt-20">
        <div className="max-w-site mx-auto px-6 py-section-mobile md:py-section">
          <div className="w-full max-w-md mx-auto text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg mb-6">
              {message}
            </div>
            <button
              onClick={() => router.push('/login')}
              className="text-matte-black hover:underline"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soft-white pt-20">
      <div className="max-w-site mx-auto px-6 py-section-mobile md:py-section">
        <ForgotPasswordForm
          onSuccess={setMessage}
          onBack={() => router.push('/login')}
        />
      </div>
    </div>
  )
}