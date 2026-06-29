"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, ShieldCheck, Server, Globe, Cpu, LayoutDashboard, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SamtricsMonitorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Overview', path: '/admin/samtrics', icon: LayoutDashboard },
    { name: 'Performance', path: '/admin/samtrics/frontend', icon: Zap },
    { name: 'Backend Health', path: '/admin/samtrics/backend', icon: Server },
    { name: 'Network', path: '/admin/samtrics/network', icon: Globe },
    { name: 'Security', path: '/admin/samtrics/security', icon: ShieldCheck },
    { name: 'AI Analysis', path: '/admin/samtrics/ai', icon: Cpu },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      {/* Top Navigation Bar specific to the Monitor */}
      <div className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Samtrics Monitor
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
              <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest">All Systems Operational</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
            Export Report
          </button>
          <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            Configure Alerts
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sub-Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-black/20 hidden md:flex flex-col">
          <nav className="flex-1 p-4 space-y-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.path
              return (
                <Link key={tab.path} href={tab.path} className="block relative">
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-white/10 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                    <tab.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : ''}`} />
                    <span className="font-medium text-sm">{tab.name}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
          
          <div className="p-4 border-t border-white/10">
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Pro Feature</h4>
              <p className="text-xs text-zinc-400 mb-3">Unlock historical 90-day retention and automated PDF reporting.</p>
              <button className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors">
                Upgrade Engine
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
          {children}
        </main>
      </div>
    </div>
  )
}
