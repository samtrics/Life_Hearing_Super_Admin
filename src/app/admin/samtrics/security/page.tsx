"use client"

import React, { useState, useEffect } from 'react'
import { ShieldCheck, Lock, Unlock, AlertTriangle, Fingerprint, EyeOff, Code2 } from 'lucide-react'
import { motion } from 'framer-motion'

const securityChecks = [
  { name: 'SSL/TLS Certificate', status: 'Passed', detail: 'Valid wildcard cert (Expires in 89 days)', icon: Lock },
  { name: 'Strict-Transport-Security', status: 'Passed', detail: 'max-age=31536000; includeSubDomains', icon: ShieldCheck },
  { name: 'Content-Security-Policy', status: 'Warning', detail: 'Missing directive: default-src', icon: AlertTriangle },
  { name: 'X-Frame-Options', status: 'Passed', detail: 'DENY', icon: EyeOff },
  { name: 'X-XSS-Protection', status: 'Passed', detail: '1; mode=block', icon: Code2 },
  { name: 'Directory Listing', status: 'Passed', detail: 'Disabled across all known routes', icon: Lock },
  { name: '.git Folder Exposure', status: 'Passed', detail: 'Not accessible', icon: Fingerprint },
  { name: '.env File Exposure', status: 'Passed', detail: 'Not accessible', icon: Lock },
]

export default function SecurityMonitor() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-400" /> Security Center
        </h2>
        <p className="text-zinc-400 mt-1">Passive vulnerability scanning, header analysis, and SSL monitoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl md:col-span-1">
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"></div>
              <div className="w-32 h-32 rounded-full border-8 border-emerald-500/20 flex items-center justify-center relative">
                <span className="text-4xl font-bold text-emerald-400">A+</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Security Score</h3>
              <p className="text-xs text-zinc-400 mt-1 px-4">Your application meets 95% of industry standard security practices.</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl md:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6">SSL Certificate Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Issuer</p>
                <p className="text-sm font-medium text-white mt-1">Let's Encrypt Authority X3</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Valid Until</p>
                <p className="text-sm font-medium text-white mt-1">Sept 28, 2026</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Protocol</p>
                <p className="text-sm font-medium text-white mt-1">TLS 1.3</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Cipher Suite</p>
                <p className="text-sm font-medium text-white mt-1 font-mono text-[10px]">TLS_AES_256_GCM_SHA384</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h3 className="text-lg font-bold text-white">Passive Scanner Results</h3>
          <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors">
            Run Scan Now
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {securityChecks.map((check, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${check.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  <check.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{check.name}</p>
                  <p className="text-xs text-zinc-500 mt-1 font-mono">{check.detail}</p>
                </div>
              </div>
              <div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${check.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                  {check.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  )
}
