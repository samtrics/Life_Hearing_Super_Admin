import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import os from 'os'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // Measure Supabase Latency
    const start = performance.now()
    await supabase.from('samtrics_audit_logs').select('id').limit(1)
    const dbLatencyMs = Math.round(performance.now() - start)

    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMemMb = Math.round((totalMem - freeMem) / 1024 / 1024)
    
    const cpus = os.cpus()
    // Very naive CPU load calculation for demonstration
    const cpuLoad = Math.round(cpus[0].times.user / (cpus[0].times.user + cpus[0].times.idle) * 100) || 5

    const { error } = await supabase
      .from('samtrics_audit_logs')
      .insert([
        {
          event_type: 'SERVER_HEALTH',
          severity: 'INFO',
          details: {
            memory_used_mb: usedMemMb,
            cpu_percent: cpuLoad,
            db_latency_ms: dbLatencyMs,
            uptime_hours: Math.floor(os.uptime() / 3600),
            timestamp: new Date().toISOString()
          }
        }
      ])

    if (error) {
      console.error('Failed to log server health:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      metrics: { usedMemMb, cpuLoad, dbLatencyMs } 
    })
  } catch (err: any) {
    console.error('Health API Error:', err.message)
    return NextResponse.json({ error: 'Failed to retrieve metrics' }, { status: 500 })
  }
}
