/**
 * Sidebar navigation component
 * Provides role-based navigation menu for the CMS
 */

'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import {
  HomeIcon,
  CubeIcon,
  TagIcon,
  PhotoIcon,
  DocumentTextIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { UserRole } from '@prisma/client'
import clsx from 'clsx'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  requiredRole?: UserRole
  badge?: string
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole?: UserRole
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
  },
  {
    name: 'Products',
    href: '/products',
    icon: CubeIcon,
    requiredRole: UserRole.EDITOR,
  },
  {
    name: 'Categories',
    href: '/categories',
    icon: TagIcon,
    requiredRole: UserRole.EDITOR,
  },
  {
    name: 'Media Library',
    href: '/media',
    icon: PhotoIcon,
    requiredRole: UserRole.EDITOR,
  },
  {
    name: 'Pages',
    href: '/pages',
    icon: DocumentTextIcon,
    requiredRole: UserRole.EDITOR,
  },
  {
    name: 'Users',
    href: '/users',
    icon: UsersIcon,
    requiredRole: UserRole.ADMIN,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: CogIcon,
    requiredRole: UserRole.ADMIN,
  },
]

function hasPermission(userRole: UserRole | undefined, requiredRole?: UserRole): boolean {
  if (!requiredRole) return true
  if (!userRole) return false

  // Role hierarchy: ADMIN > EDITOR > VIEWER
  const roleHierarchy = {
    [UserRole.VIEWER]: 1,
    [UserRole.EDITOR]: 2,
    [UserRole.ADMIN]: 3,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

function SidebarContent({ userRole }: { userRole?: UserRole }) {
  const pathname = usePathname()

  const filteredNavigation = navigation.filter(item => 
    hasPermission(userRole, item.requiredRole)
  )

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 bg-gray-900">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-white font-semibold text-lg">Kin CMS</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 bg-gray-800">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-white'
                )}
              />
              {item.name}
              {item.badge && (
                <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-blue-600 text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User role indicator */}
      <div className="px-4 py-4 bg-gray-900 border-t border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              userRole === UserRole.ADMIN ? 'bg-red-400' :
              userRole === UserRole.EDITOR ? 'bg-yellow-400' :
              'bg-green-400'
            )} />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-300">
              {userRole || 'Unknown'} Role
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800 px-6 pb-4">
                  <SidebarContent userRole={userRole} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800">
          <SidebarContent userRole={userRole} />
        </div>
      </div>
    </>
  )
}