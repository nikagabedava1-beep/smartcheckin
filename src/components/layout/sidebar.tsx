'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Users,
  Lock,
  LogOut,
  Menu,
  X,
  Activity,
  IdCard,
  Wallet,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/translations'
import { useState, useEffect } from 'react'

interface NavItem {
  href: string
  label: { ka: string; en: string }
  icon: React.ElementType
}

interface SidebarProps {
  role: 'admin' | 'owner'
  userName: string
}

const adminNavItems: NavItem[] = [
  { href: '/admin', label: t.nav.dashboard, icon: LayoutDashboard },
  { href: '/admin/owners', label: t.nav.owners, icon: Users },
  { href: '/admin/apartments', label: t.nav.apartments, icon: Building2 },
  { href: '/admin/locks', label: t.nav.locks, icon: Lock },
  { href: '/admin/monitoring', label: t.nav.monitoring, icon: Activity },
]

const ownerNavItems: NavItem[] = [
  { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
  { href: '/dashboard/apartments', label: t.nav.apartments, icon: Building2 },
  { href: '/dashboard/reservations', label: t.nav.reservations, icon: CalendarDays },
  { href: '/dashboard/passports', label: { ka: 'პასპორტები', en: 'Passports' }, icon: IdCard },
  { href: '/dashboard/deposits', label: { ka: 'დეპოზიტები', en: 'Deposits' }, icon: Wallet },
  { href: '/dashboard/guests', label: t.nav.guests, icon: Users },
]

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
  }>>([])

  // Fetch notifications for owners
  useEffect(() => {
    if (role !== 'owner') return

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?limit=10')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications)
          setUnreadCount(data.unreadCount)
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [role])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }
  const navItems = role === 'admin' ? adminNavItems : ownerNavItems

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-bold text-primary-600">SmartCheckin.ge</h1>
          <p className="text-xs text-gray-500">სმარტ ჩექინი</p>
        </div>
        {role === 'owner' && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="font-medium text-gray-900">შეტყობინებები / Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      ყველას წაკითხულად
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      შეტყობინებები არ არის / No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer',
                          !notification.isRead && 'bg-primary-50'
                        )}
                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            notification.type === 'passport_upload' ? 'bg-blue-100' : 'bg-green-100'
                          )}>
                            {notification.type === 'passport_upload' ? (
                              <IdCard className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Wallet className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.createdAt).toLocaleString('ka-GE')}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <div>
                <span className="block text-sm font-medium">{item.label.ka}</span>
                <span className="block text-xs opacity-70">{item.label.en}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-700 font-medium">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">
              {role === 'admin' ? 'ადმინისტრატორი / Admin' : 'მფლობელი / Owner'}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>{t.auth.logout.ka}</span>
          <span className="text-gray-400 ml-1">/ {t.auth.logout.en}</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col h-full">
          <NavContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <NavContent />
      </aside>
    </>
  )
}
