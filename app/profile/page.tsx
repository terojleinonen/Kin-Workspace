'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setError('')
    setMessage('')

    const result = await updateProfile(formData)
    
    if (result.success) {
      setMessage('Profile updated successfully!')
    } else {
      setError(result.error || 'Failed to update profile')
    }
    
    setIsUpdating(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-matte-black"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-soft-white pt-20">
      <div className="max-w-2xl mx-auto px-6 py-section-mobile md:py-section">
        <div className="bg-white rounded-lg shadow-sm border border-warm-beige p-8">
          <h1 className="font-satoshi font-bold text-2xl text-matte-black mb-8">
            Profile Settings
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-gray mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-warm-beige rounded-lg focus:ring-2 focus:ring-matte-black focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-gray mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-warm-beige rounded-lg focus:ring-2 focus:ring-matte-black focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-gray mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-warm-beige rounded-lg focus:ring-2 focus:ring-matte-black focus:border-transparent transition-colors"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-matte-black text-soft-white py-3 px-6 rounded-lg font-medium hover:bg-slate-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-warm-beige">
            <p className="text-sm text-slate-gray">
              Member since {new Date(user?.createdAt || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}