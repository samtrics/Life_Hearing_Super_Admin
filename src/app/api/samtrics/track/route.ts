import { NextResponse } from 'next/server'
import { sendSamtricsAlert } from '@/utils/samtrics'
import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

const window = new JSDOM('').window
const purify = DOMPurify(window)

// In-Memory Rate Limiter (Max 100 tracking events per IP per minute)
const rateLimitMap = new Map<string, { count: number, timestamp: number }>()

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    // SECURITY 1: DDOS Rate Limiting
    const record = rateLimitMap.get(ip)
    if (record && now - record.timestamp < 60000) {
      if (record.count >= 100) return NextResponse.json({ error: 'Rate Limited' }, { status: 429 })
      record.count++
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: now })
    }

    const data = await request.json()
    
    // SECURITY 2: Aggressive XSS Sterilization
    const sanitizedData = {
      path: purify.sanitize(data.path || ''),
      timestamp: purify.sanitize(data.timestamp || ''),
      userAgent: purify.sanitize(data.userAgent || '')
    }
    
    await sendSamtricsAlert('FRONTEND_TELEMETRY', 'INFO', sanitizedData)
    
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to track event' }, { status: 400 })
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.VITE_APP_URL || 'http://localhost:5173',
      'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Payload-Signature',
      'Access-Control-Allow-Credentials': 'true'
    },
  });
}
