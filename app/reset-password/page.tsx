'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ResetPasswordForm from '@/app/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      router.push('/login')
    }
  }, [searchParams, router])

  const handleSuccess = () => {
    setSuccess(true)
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-matte-black"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-soft-white pt-20">
        <div className="max-w-site mx-auto px-6 py-section-mobile md:py-section">
          <div className="w-full max-w-md mx-auto text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg mb-6">
              Password reset successfully! Redirecting to sign in...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soft-white pt-20">
      <div className="max-w-site mx-auto px-6 py-section-mobile md:py-section">
        <ResetPasswordForm
          token={token}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}