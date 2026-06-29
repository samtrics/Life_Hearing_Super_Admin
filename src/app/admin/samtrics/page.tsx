"use client"

import React, { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Activity, ShieldCheck, Zap, Globe, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock, Users, Database, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://utgsrpwqrfnjdbeobndh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Fallback data if DB is empty
const fallbackTrafficData = [
  { time: '00:00', requests: 1200, errors: 5 },
  { time: '04:00', requests: 800, errors: 2 },
  { time: '08:00', requests: 3500, errors: 12 },
  { time: '12:00', requests: 5200, errors: 45 },
  { time: '16:00', requests: 4800, errors: 18 },
  { time: '20:00', requests: 2100, errors: 8 },
]

export default function SamtricsDashboard() {
  const [mounted, setMounted] = useState(false)
  const [trafficData, setTrafficData] = useState(fallbackTrafficData)
  const [avgLatency, setAvgLatency] = useState(124)
  const [cpuLoad, setCpuLoad] = useState(24)
  const [memUsage, setMemUsage] = useState(4.2)
  const [activeUsers, setActiveUsers] = useState(1240)

  useEffect(() => {
    setMounted(true)

    const fetchOverview = async () => {
      const { data } = await supabase
        .from('samtrics_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (data && data.length > 0) {
        // Find latest server health
        const latestHealth = data.find(d => d.event_type === 'SERVER_HEALTH')
        if (latestHealth) {
          setCpuLoad(latestHealth.details.cpu_percent || 24)
          setAvgLatency(latestHealth.details.db_latency_ms || 124)
          setMemUsage(parseFloat(((latestHealth.details.memory_used_mb || 4000) / 1024).toFixed(1)))
        }

        // We can synthesize traffic from web vitals volume for the demo if needed, 
        // but sticking to fallback traffic chart for the time-series area since we don't have historical traffic yet.
      }
    }
    
    fetchOverview()
    
    const interval = setInterval(fetchOverview, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null // Prevent hydration mismatch with Recharts

  const MetricCard = ({ title, value, trend, trendValue, icon: Icon, color }: any) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl hover:bg-white/[0.07] transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trendValue}
        </div>
      </div>
      <div>
        <h3 className="text-zinc-400 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">System Overview</h2>
        <p className="text-zinc-400 mt-1">Real-time health and performance metrics across all services.</p>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Health Score" value="98%" trend="up" trendValue="+2.1%" icon={Activity} color="emerald" />
        <MetricCard title="Avg Response Time" value={`${avgLatency}ms`} trend="down" trendValue="-12ms" icon={Clock} color="indigo" />
        <MetricCard title="Active Users" value={activeUsers.toLocaleString()} trend="down" trendValue="-5.4%" icon={Users} color="blue" />
        <MetricCard title="Security Score" value="A+" trend="up" trendValue="Stable" icon={ShieldCheck} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Core Web Vitals</h3>
              <p className="text-sm text-zinc-400">LCP, FID, and CLS over the last 24 hours</p>
            </div>
            <select className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-zinc-300 outline-none">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorLcp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLcp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Events Sidebar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Recent Alerts</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            <motion.div className="p-4 rounded-xl bg-black/40 border border-white/5 flex gap-4">
                <div className="mt-1"><AlertTriangle className="w-5 h-5 text-rose-500" /></div>
                <div>
                  <h4 className="text-sm font-bold text-white">High Memory Usage</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Node.js process exceeded 85% memory threshold.</p>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium uppercase tracking-wider">10 mins ago</p>
                </div>
            </motion.div>
          </div>
          <button className="w-full mt-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/10">
            View All Logs
          </button>
        </div>
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Traffic Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">Network Traffic & Errors</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="requests" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="errors" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Infrastructure Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">Live Infrastructure</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> API Server</p>
                <p className="text-xs text-zinc-500 mt-1">Uptime: 99.99%</p>
              </div>
              <span className="text-sm font-bold text-white bg-white/10 px-2 py-1 rounded">{cpuLoad}% CPU</span>
            </div>
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Database (Supabase)</p>
                <p className="text-xs text-zinc-500 mt-1">Uptime: 100%</p>
              </div>
              <span className="text-sm font-bold text-white bg-white/10 px-2 py-1 rounded">{avgLatency}ms</span>
            </div>
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Host Memory</p>
                <p className="text-xs text-zinc-500 mt-1">Usage High</p>
              </div>
              <span className="text-sm font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">{memUsage} GB</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
