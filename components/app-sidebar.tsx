"use client"

import { 
  Home,
  CreditCard,
  Users,
  UserCog,
  DollarSign,
  FileText,
  LogOut,
  User,
  Bell
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from '@/contexts/auth-context'

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Loan",
    url: "/loan",
    icon: CreditCard,
  },
  {
    title: "Customers",
    url: "/users",
    icon: Users,
  },
  {
    title: "Manage Staff",
    url: "/manage-user",
    icon: UserCog,
  },
  {
    title: "Receipts",
    url: "/receipts",
    icon: DollarSign,
  },
  {
    title: "Loan Applications",
    url: "/loan-applications",
    icon: FileText,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  }
]

export function AppSidebar() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <Sidebar variant="inset" className="bg-gray-100">
      <SidebarHeader className="border-b rounded-t-lg">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">CrediLife</span>
            <span className="truncate text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        {user && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.role}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
            >
              <LogOut className="h-3 w-3 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
        <div className="p-2 text-center text-xs text-muted-foreground">
          © 2025 CrediLife
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}