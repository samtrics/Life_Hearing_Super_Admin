"use client"

import * as React from "react"
import {
  Calendar,
  LayoutDashboard,
  Database,
  Users,
  Bell,
  ShieldCheck,
  LogOut,
  Activity,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { logout } from "@/app/actions/auth"

const navItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Appointments",
    url: "/admin/appointments",
    icon: Calendar,
  },
  {
    title: "Calendar",
    url: "/admin/calendar",
    icon: Calendar,
  },
  {
    title: "Patients",
    url: "/admin/patients",
    icon: Users,
  },
  {
    title: "Backup",
    url: "/admin/backup",
    icon: Database,
  },
  {
    title: "Samtrics Monitor",
    url: "/admin/samtrics",
    icon: Activity,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" className="glass-panel border-none shadow-none bg-transparent" {...props}>
      <SidebarHeader className="flex flex-row items-center gap-3 p-6 pt-8 text-primary">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-500 text-white shadow-lg shadow-primary/20 glow-effect group-hover:scale-105 transition-transform">
          <ShieldCheck className="h-7 w-7 animate-pulse" />
        </div>
        <div className="flex flex-col gap-0.5 leading-none">
          <span className="font-extrabold text-2xl tracking-tight premium-gradient-text">Secure</span>
          <span className="text-sm font-medium text-muted-foreground/80">Life Hearing</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 mt-6">
        <SidebarMenu className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  render={<Link href={item.url} />}
                  isActive={isActive}
                  tooltip={item.title}
                  className={`px-4 py-6 rounded-2xl transition-all duration-300 font-bold ${
                    isActive 
                    ? 'bg-gradient-to-r from-primary/10 to-transparent text-primary shadow-[inset_4px_0_0_0] shadow-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.02]'
                  }`}
                >
                  <item.icon className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-base">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-6 pb-8">
        <form action={logout}>
          <SidebarMenuButton 
            type="submit" 
            className="w-full px-4 py-6 rounded-2xl text-destructive font-bold hover:text-white hover:bg-destructive shadow-sm transition-all duration-300 hover:shadow-destructive/25 hover:-translate-y-1"
          >
            <LogOut className="h-6 w-6" />
            <span className="text-base">Secure Logout</span>
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  )
}
