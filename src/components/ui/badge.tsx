'use client'

import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}

// Status-specific badges
interface StatusBadgeProps {
  status: 'pending' | 'checked_in' | 'completed' | 'cancelled' | string
  className?: string
}

const statusConfig: Record<string, { ka: string; en: string; variant: BadgeProps['variant'] }> = {
  pending: { ka: 'მოლოდინში', en: 'Pending', variant: 'warning' },
  checked_in: { ka: 'შემოსული', en: 'Checked In', variant: 'success' },
  completed: { ka: 'დასრულებული', en: 'Completed', variant: 'default' },
  cancelled: { ka: 'გაუქმებული', en: 'Cancelled', variant: 'danger' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { ka: status, en: status, variant: 'default' as const }

  return (
    <Badge variant={config.variant} className={className}>
      <span className="font-medium">{config.ka}</span>
      <span className="mx-1 text-gray-400">/</span>
      <span>{config.en}</span>
    </Badge>
  )
}

// Source badges
interface SourceBadgeProps {
  source: 'manual' | 'airbnb' | 'booking' | string
  className?: string
}

const sourceConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  manual: { label: 'Manual', variant: 'default' },
  airbnb: { label: 'Airbnb', variant: 'danger' },
  booking: { label: 'Booking.com', variant: 'info' },
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const config = sourceConfig[source] || { label: source, variant: 'default' as const }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
