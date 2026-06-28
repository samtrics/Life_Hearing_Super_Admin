import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import os from 'os'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const SAMTRICS_API_KEY = process.env.SAMTRICS_API_KEY || 'samtrics-dev-key-123'

  if (authHeader !== `Bearer ${SAMTRICS_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized Samtrics Connection' }, { status: 401 })
  }

  const supabase = await createClient()
  
  // Test Database Connection and get recent logs
  const { data: logs, error: dbError } = await supabase
    .from('samtrics_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({
    status: 'online',
    system: {
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      cpu_load: os.loadavg(),
      platform: os.platform()
    },
    database: {
      status: dbError ? 'disconnected' : 'connected',
      error: dbError?.message || null
    },
    recent_events: logs || []
  })
}
