"use client"

import React, { useState, useEffect } from 'react'
import { Globe, Map, Activity, Wifi, Radio } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const latencyData = [
  { time: '10:00', us: 45, eu: 85, asia: 150 },
  { time: '12:00', us: 42, eu: 82, asia: 145 },
  { time: '14:00', us: 48, eu: 120, asia: 160 }, // EU latency spike
  { time: '16:00', us: 44, eu: 88, asia: 148 },
  { time: '18:00', us: 45, eu: 85, asia: 152 },
]

export default function NetworkMonitor() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-400" /> Global Network
        </h2>
        <p className="text-zinc-400 mt-1">CDN performance, regional latency, and DNS resolution health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Latency Map / Graph */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl md:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6">Regional Latency (ms)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="us" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="US East" />
                <Area type="monotone" dataKey="eu" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Europe" />
                <Area type="monotone" dataKey="asia" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Asia Pacific" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DNS Status */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-400" /> DNS Health
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-black/30 border border-white/5">
              <span className="text-sm text-zinc-300">Nameservers</span>
              <span className="text-sm font-bold text-emerald-400">Responding</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-black/30 border border-white/5">
              <span className="text-sm text-zinc-300">DNSSEC</span>
              <span className="text-sm font-bold text-emerald-400">Enabled</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-black/30 border border-white/5">
              <span className="text-sm text-zinc-300">Avg Resolution Time</span>
              <span className="text-sm font-bold text-white">14ms</span>
            </div>
          </div>
        </div>

        {/* CDN Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-pink-400" /> CDN Edge Network
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-black/30 border border-white/5">
              <span className="text-sm text-zinc-300">Provider</span>
              <span className="text-sm font-bold text-white">Vercel Edge</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-black/30 border border-white/5">
              <span className="text-sm text-zinc-300">Cache Hit Rate</span>
              <span className="text-sm font-bold text-emerald-400">92.4%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-black/30 border border-white/5">
              <span className="text-sm text-zinc-300">Bandwidth (24h)</span>
              <span className="text-sm font-bold text-white">42.8 GB</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
