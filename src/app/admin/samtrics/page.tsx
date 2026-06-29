"use client"

import React, { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Activity, ShieldCheck, Zap, Globe, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock, Users, Database } from 'lucide-react'
import { motion } from 'framer-motion'

// Mock Data for Charts
const performanceData = [
  { time: '00:00', lcp: 1.2, fid: 12, cls: 0.01 },
  { time: '04:00', lcp: 1.4, fid: 15, cls: 0.02 },
  { time: '08:00', lcp: 2.1, fid: 28, cls: 0.05 }, // Morning spike
  { time: '12:00', lcp: 1.8, fid: 22, cls: 0.03 },
  { time: '16:00', lcp: 2.5, fid: 35, cls: 0.08 }, // Afternoon spike
  { time: '20:00', lcp: 1.5, fid: 18, cls: 0.02 },
  { time: '24:00', lcp: 1.1, fid: 10, cls: 0.01 },
]

const trafficData = [
  { day: 'Mon', requests: 45000, errors: 120 },
  { day: 'Tue', requests: 52000, errors: 150 },
  { day: 'Wed', requests: 48000, errors: 90 },
  { day: 'Thu', requests: 61000, errors: 210 },
  { day: 'Fri', requests: 59000, errors: 180 },
  { day: 'Sat', requests: 35000, errors: 50 },
  { day: 'Sun', requests: 31000, errors: 40 },
]

const recentAlerts = [
  { id: 1, type: 'critical', title: 'High Memory Usage', desc: 'Node.js process exceeded 85% memory threshold.', time: '10 mins ago' },
  { id: 2, type: 'warning', title: 'LCP Degradation', desc: 'Homepage Largest Contentful Paint increased by 450ms.', time: '1 hour ago' },
  { id: 3, type: 'info', title: 'Deployment Successful', desc: 'Production build #492 deployed.', time: '3 hours ago' },
]

export default function SamtricsDashboard() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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
        <MetricCard title="Avg Response Time" value="124ms" trend="up" trendValue="-12ms" icon={Clock} color="indigo" />
        <MetricCard title="Active Users" value="1,248" trend="down" trendValue="-5.4%" icon={Users} color="blue" />
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
              <AreaChart data={performanceData}>
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
                <Area type="monotone" dataKey="lcp" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLcp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Events Sidebar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Recent Alerts</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {recentAlerts.map(alert => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-xl bg-black/40 border border-white/5 flex gap-4"
              >
                <div className="mt-1">
                  {alert.type === 'critical' ? <AlertTriangle className="w-5 h-5 text-rose-500" /> :
                   alert.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-500" /> :
                   <Activity className="w-5 h-5 text-emerald-500" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{alert.desc}</p>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium uppercase tracking-wider">{alert.time}</p>
                </div>
              </motion.div>
            ))}
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
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
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

        {/* Server & DB Status */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">Infrastructure Health</h3>
          <div className="space-y-6">
            
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Database className="w-4 h-4 text-indigo-400" /> Database Connection
                </div>
                <span className="text-xs text-emerald-400 font-bold">12ms</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[15%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Globe className="w-4 h-4 text-blue-400" /> Vercel Edge Network
                </div>
                <span className="text-xs text-emerald-400 font-bold">Optimal</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[95%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Zap className="w-4 h-4 text-amber-400" /> API Rate Limits
                </div>
                <span className="text-xs text-amber-400 font-bold">68%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[68%] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
