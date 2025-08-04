'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/contexts/AuthContext'
import { UserIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/login"
          className="text-slate-gray hover:text-matte-black transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="bg-matte-black text-soft-white px-4 py-2 rounded-lg hover:bg-slate-gray transition-colors"
        >
          Sign Up
        </Link>
      </div>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-slate-gray hover:text-matte-black transition-colors"
      >
        <UserIcon className="h-5 w-5" />
        <span className="hidden md:block">{user.firstName}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-soft-white border border-warm-beige rounded-lg shadow-lg z-50">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-warm-beige">
              <p className="font-medium text-matte-black">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-slate-gray">{user.email}</p>
            </div>
            
            <Link
              href="/profile"
              className="block px-4 py-2 text-slate-gray hover:bg-warm-beige hover:text-matte-black transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            
            <Link
              href="/orders"
              className="block px-4 py-2 text-slate-gray hover:bg-warm-beige hover:text-matte-black transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Orders
            </Link>
            
            <Link
              href="/wishlist"
              className="block px-4 py-2 text-slate-gray hover:bg-warm-beige hover:text-matte-black transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Wishlist
            </Link>
            
            <button
              onClick={() => {
                logout()
                setIsOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-slate-gray hover:bg-warm-beige hover:text-matte-black transition-colors border-t border-warm-beige"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}