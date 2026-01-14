'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout requiredRole="owner">{children}</DashboardLayout>
}
