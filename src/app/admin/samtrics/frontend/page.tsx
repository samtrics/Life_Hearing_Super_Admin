"use client"

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { MonitorPlay, LayoutTemplate, Type, Image as ImageIcon, Code, Box, AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://utgsrpwqrfnjdbeobndh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Default baseline data in case DB is empty yet
const fallbackVitalsData = [
  { time: '10:00', lcp: 1.1, fid: 12, cls: 0.01, ttfb: 45 },
  { time: '12:00', lcp: 1.3, fid: 14, cls: 0.02, ttfb: 50 },
  { time: '14:00', lcp: 2.4, fid: 28, cls: 0.08, ttfb: 120 },
  { time: '16:00', lcp: 1.5, fid: 18, cls: 0.03, ttfb: 65 },
  { time: '18:00', lcp: 1.2, fid: 15, cls: 0.01, ttfb: 48 },
]

const resourceData = [
  { name: 'JavaScript', value: 850, color: '#f59e0b' },
  { name: 'Images', value: 1200, color: '#3b82f6' },
  { name: 'CSS', value: 150, color: '#ec4899' },
  { name: 'Fonts', value: 320, color: '#8b5cf6' },
  { name: 'HTML', value: 45, color: '#10b981' },
]

const issues = [
  { type: 'error', message: 'React Hydration Error on /appointments', count: 12, resolved: false },
  { type: 'warning', message: 'Render-blocking CSS detected in <head>', count: 1, resolved: false },
  { type: 'warning', message: 'Unoptimized images on /about-us', count: 4, resolved: false },
  { type: 'success', message: 'Unused JavaScript removed automatically', count: 1, resolved: true },
]

export default function FrontendMonitor() {
  const [mounted, setMounted] = useState(false)
  const [vitalsData, setVitalsData] = useState(fallbackVitalsData)

  useEffect(() => {
    setMounted(true)
    
    // Fetch live web vitals
    const fetchVitals = async () => {
      const { data } = await supabase
        .from('samtrics_audit_logs')
        .select('*')
        .eq('event_type', 'WEB_VITALS')
        .order('created_at', { ascending: false })
        .limit(50)

      if (data && data.length > 0) {
        // Group by hour and average for the chart
        // For simplicity in this demo, we'll map the raw events if there's enough data
        if (data.length > 5) {
           const mapped = data.reverse().map(d => ({
             time: new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
             lcp: d.details.metric_name === 'LCP' ? (d.details.metric_value / 1000).toFixed(2) : 1.2,
             fid: d.details.metric_name === 'FID' ? d.details.metric_value : 12,
             cls: d.details.metric_name === 'CLS' ? d.details.metric_value : 0.01,
             ttfb: d.details.metric_name === 'TTFB' ? d.details.metric_value : 45
           }))
           setVitalsData(mapped)
        }
      }
    }
    fetchVitals()

  }, [])

  if (!mounted) return null

  const VitalCard = ({ title, value, status, metric, desc }: any) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl hover:bg-white/[0.07] transition-all">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider">{title}</h3>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${status === 'good' ? 'bg-emerald-500/10 text-emerald-400' : status === 'needs-improvement' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {status}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="text-sm font-medium text-zinc-500">{metric}</span>
      </div>
      <p className="text-xs text-zinc-500 mt-2">{desc}</p>
    </div>
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <MonitorPlay className="w-6 h-6 text-indigo-400" /> Frontend & Performance
        </h2>
        <p className="text-zinc-400 mt-1">Real-user monitoring (RUM) and Core Web Vitals analysis.</p>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <VitalCard title="LCP" value="1.2" metric="s" status="good" desc="Largest Contentful Paint" />
        <VitalCard title="FID" value="15" metric="ms" status="good" desc="First Input Delay" />
        <VitalCard title="CLS" value="0.02" metric="score" status="good" desc="Cumulative Layout Shift" />
        <VitalCard title="TTFB" value="85" metric="ms" status="needs-improvement" desc="Time to First Byte" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Vitals Trend Chart */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">Vitals Trend Timeline</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vitalsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                />
                <Line type="monotone" dataKey="lcp" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="ttfb" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Weight Analysis */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Page Weight Breakdown</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {resourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-2xl font-bold text-white">2.56</span>
              <span className="text-xs text-zinc-500 font-bold uppercase">Total MB</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {resourceData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-zinc-300">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{(item.value / 1000).toFixed(2)} MB</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Frontend Issues Log */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h3 className="text-lg font-bold text-white">Frontend Error Tracking</h3>
          <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors">
            Clear Logs
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {issues.map((issue, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                {issue.type === 'error' && <AlertOctagon className="w-5 h-5 text-rose-500" />}
                {issue.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {issue.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                
                <div>
                  <p className="text-sm font-bold text-white">{issue.message}</p>
                  <p className="text-xs text-zinc-500 mt-1">Occurred {issue.count} times in the last hour</p>
                </div>
              </div>
              <div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${issue.resolved ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                  {issue.resolved ? 'Resolved' : 'Active'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  )
}
