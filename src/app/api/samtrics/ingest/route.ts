import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, value, id, delta, path, userAgent } = data

    // Validate the incoming web vitals payload
    if (!name || typeof value !== 'number') {
      return NextResponse.json({ error: 'Invalid metrics payload' }, { status: 400, headers: corsHeaders })
    }

    const supabase = createAdminClient()

    // Store in samtrics_audit_logs using 'WEB_VITALS' as event_type
    const { error } = await supabase
      .from('samtrics_audit_logs')
      .insert([
        {
          event_type: 'WEB_VITALS',
          severity: 'INFO',
          details: {
            metric_name: name,
            metric_value: value,
            metric_delta: delta,
            metric_id: id,
            path: path || 'unknown',
            user_agent: userAgent || 'unknown',
            timestamp: new Date().toISOString()
          }
        }
      ])

    if (error) {
      console.error('Failed to log web vital:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (err: any) {
    console.error('Ingest API Error:', err.message)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: corsHeaders })
  }
}
