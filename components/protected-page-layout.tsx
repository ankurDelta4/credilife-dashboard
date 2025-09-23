"use client"

import { DashboardLayout } from '@/components/dashboard-layout'
import { ReactNode } from 'react'

interface ProtectedPageLayoutProps {
  children: ReactNode
}

export function ProtectedPageLayout({ children }: ProtectedPageLayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}