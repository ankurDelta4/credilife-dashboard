"use client"

import { usePathname } from 'next/navigation'
import { RouteGuard } from '@/components/route-guard'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  
  // Don't protect the login page
  const isLoginPage = pathname === '/login'
  
  if (isLoginPage) {
    return <>{children}</>
  }
  
  // Protect all other routes
  return (
    <RouteGuard>
      {children}
    </RouteGuard>
  )
}