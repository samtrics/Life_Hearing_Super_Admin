"use client"

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Server, Database, Zap, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const serverMemoryData = [
  { time: '10:00', memory: 450, cpu: 12 },
  { time: '12:00', memory: 480, cpu: 15 },
  { time: '14:00', memory: 850, cpu: 45 }, // Peak
  { time: '16:00', memory: 520, cpu: 18 },
  { time: '18:00', memory: 490, cpu: 14 },
]

const endpoints = [
  { path: '/api/appointments', method: 'GET', status: 'Healthy', latency: 45, uptime: '99.99%' },
  { path: '/api/auth/verify', method: 'POST', status: 'Healthy', latency: 120, uptime: '99.95%' },
  { path: '/api/webhook/stripe', method: 'POST', status: 'Degraded', latency: 850, uptime: '98.50%' },
  { path: '/api/users/profile', method: 'GET', status: 'Healthy', latency: 65, uptime: '99.99%' },
]

export default function BackendMonitor() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Server className="w-6 h-6 text-indigo-400" /> Backend Health
        </h2>
        <p className="text-zinc-400 mt-1">Monitor server resources, database queries, and API latency.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Memory & CPU Graph */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">Server Load (Node.js)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serverMemoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="memory" name="Memory (MB)" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="cpu" name="CPU (%)" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Database Overview */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" /> Supabase Connection
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 rounded-xl bg-black/40 border border-white/5">
              <div>
                <p className="text-sm font-bold text-zinc-300">Connection Pool</p>
                <p className="text-xs text-zinc-500 mt-1">Active connections</p>
              </div>
              <p className="text-2xl font-bold text-white">24 <span className="text-sm font-medium text-zinc-500">/ 100</span></p>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-black/40 border border-white/5">
              <div>
                <p className="text-sm font-bold text-zinc-300">Average Query Time</p>
                <p className="text-xs text-zinc-500 mt-1">Read / Write</p>
              </div>
              <p className="text-2xl font-bold text-emerald-400">12ms</p>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-black/40 border border-white/5">
              <div>
                <p className="text-sm font-bold text-zinc-300">Cache Hit Ratio</p>
                <p className="text-xs text-zinc-500 mt-1">Postgres shared buffers</p>
              </div>
              <p className="text-2xl font-bold text-blue-400">99.4%</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoint Monitoring */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h3 className="text-lg font-bold text-white">API Endpoints Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Endpoint</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Method</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Latency</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {endpoints.map((ep, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-sm font-mono text-zinc-300">{ep.path}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${ep.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {ep.status === 'Healthy' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-amber-500" />}
                      <span className={`text-sm font-bold ${ep.status === 'Healthy' ? 'text-emerald-500' : 'text-amber-500'}`}>{ep.status}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-bold text-white">{ep.latency}ms</td>
                  <td className="p-4 text-sm font-medium text-zinc-400">{ep.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
