"use client"

import { 
  Home,
  CreditCard,
  Users,
  Shield,
  UserCog,
  DollarSign,
  FileText
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
import Link from "next/link"
import { title } from "process"

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
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Auth",
    url: "/auth",
    icon: Shield,
  },
  {
    title: "Manage user",
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
  }
]

export function AppSidebar() {
  return (
    <Sidebar variant="inset" className="bg-gray-100">
      <SidebarHeader className="border-b rounded-t-lg">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Credilife</span>
            <span className="truncate text-xs text-muted-foreground">Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="rounded-b-lg">
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
      <SidebarFooter>
        <div className="p-2 text-xs text-muted-foreground">
          © 2024 LoanFlow
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}