'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

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
      <div className="max-w-site mx-auto px-6 py-section-mobile md:py-section">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-satoshi font-bold text-3xl text-matte-black mb-8">
            Order History
          </h1>

          <div className="bg-white rounded-lg border border-warm-beige p-8 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="font-satoshi font-semibold text-xl text-matte-black mb-4">
                No Orders Yet
              </h2>
              <p className="text-slate-gray mb-6">
                You haven't placed any orders yet. Start shopping to see your order history here.
              </p>
              <button
                onClick={() => router.push('/shop')}
                className="bg-matte-black text-soft-white px-6 py-3 rounded-lg hover:bg-slate-gray transition-colors"
              >
                Start Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}