"use client"

import React, { useState, useEffect } from 'react'
import { Cpu, Zap, ArrowRight, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const insights = [
  { 
    id: 1, 
    type: 'critical', 
    title: 'Homepage LCP Degradation', 
    description: 'Your homepage has become 18% slower compared to yesterday (LCP increased by 450ms).',
    recommendation: 'Optimize the hero image payload and defer loading of the Intercom chat widget script.',
    impact: 'High Impact on SEO and Conversions'
  },
  { 
    id: 2, 
    type: 'warning', 
    title: 'Bundle Size Increase', 
    description: 'Your JavaScript bundle increased by 1.3 MB in the last deployment.',
    recommendation: 'Check the import of "three.js" in the 3D viewer component and implement dynamic imports (React.lazy).',
    impact: 'Medium Impact on Mobile Devices'
  },
  { 
    id: 3, 
    type: 'info', 
    title: 'CSS Efficiency', 
    description: 'Your global CSS has 26% unused rules.',
    recommendation: 'Implement PurgeCSS in your Tailwind config to strip unused classes from production builds.',
    impact: 'Low Impact on Performance'
  },
  { 
    id: 4, 
    type: 'warning', 
    title: 'SSL Expiry approaching', 
    description: 'SSL expires in 17 days for api.samtrics.com.',
    recommendation: 'Ensure your Let\'s Encrypt auto-renewal cron job is running without errors.',
    impact: 'High Impact on Security'
  }
]

export default function AIAnalysisMonitor() {
  const [mounted, setMounted] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => setMounted(true), [])

  const runAnalysis = () => {
    setIsAnalyzing(true)
    setTimeout(() => setIsAnalyzing(false), 2000)
  }

  if (!mounted) return null

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-pink-400" /> AI Insights Engine
          </h2>
          <p className="text-zinc-400 mt-1">Machine-learning powered analysis of your performance and security data.</p>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(219,39,119,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
          ) : (
            <><Zap className="w-4 h-4" /> Generate New Insights</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {insights.map((insight, idx) => (
          <motion.div 
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.07] transition-all"
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${insight.type === 'critical' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,1)]' : insight.type === 'warning' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)]' : 'bg-blue-500'}`}></div>
            
            <div className="pl-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {insight.type === 'critical' ? <TrendingUp className="w-6 h-6 text-rose-500" /> : 
                   insight.type === 'warning' ? <AlertCircle className="w-6 h-6 text-amber-500" /> :
                   <TrendingDown className="w-6 h-6 text-blue-500" />}
                  <h3 className="text-lg font-bold text-white">{insight.title}</h3>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${insight.type === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : insight.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                  {insight.type} Priority
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">AI Observation</p>
                  <p className="text-zinc-300 text-sm leading-relaxed">{insight.description}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-2">Recommended Action</p>
                  <p className="text-white text-sm leading-relaxed">{insight.recommendation}</p>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">{insight.impact}</span>
                    <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                      Implement Fix <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  )
}
