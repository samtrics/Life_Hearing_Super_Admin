import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BellRing, ShieldCheck } from "lucide-react"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-background to-emerald-50/50 dark:from-blue-950/20 dark:via-background dark:to-emerald-950/20">
        <AppSidebar />
        <SidebarInset className="bg-transparent flex flex-col flex-1">
          <header className="sticky top-0 z-50 flex h-20 shrink-0 items-center gap-2 border-b border-border/40 bg-background/60 backdrop-blur-xl px-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] transition-all">
            <SidebarTrigger className="-ml-2 hover:bg-primary/10 hover:text-primary transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-5 bg-border/50" />
            <div className="flex items-center gap-2 md:hidden">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-extrabold tracking-tight premium-gradient-text">Admin</h2>
            </div>
            
            <div className="ml-auto flex items-center gap-6">
              <button className="relative p-2 rounded-full hover:bg-primary/10 transition-colors group">
                <BellRing className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                </span>
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-border/40">
                <div className="text-right hidden sm:block">
                  <p className="font-bold text-sm leading-none mb-1 text-foreground">Dr. Administrator</p>
                  <p className="text-xs font-medium text-primary leading-none">Super Admin</p>
                </div>
                <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/40">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-500 text-white font-bold">DR</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="container p-4 md:p-8 lg:p-10 mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
