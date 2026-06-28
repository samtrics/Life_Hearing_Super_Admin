import { createClient } from './supabase/server'
import CryptoJS from 'crypto-js'

const SAMTRICS_WEBHOOK_URL = process.env.SAMTRICS_WEBHOOK_URL || 'https://samtrics.com/api/webhooks/life-hearing'
const SAMTRICS_API_KEY = process.env.SAMTRICS_API_KEY || 'samtrics-dev-key-123'

export async function sendSamtricsAlert(eventType: string, severity: 'INFO' | 'WARNING' | 'CRITICAL', details: any) {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      eventType,
      severity,
      details,
      source: 'life-hearing-care'
    }

    const payloadString = JSON.stringify(payload)

    // SECURITY 1: Cryptographic Signature (Prevents Man-In-The-Middle and Forgery)
    const signature = CryptoJS.HmacSHA256(payloadString, SAMTRICS_API_KEY).toString(CryptoJS.enc.Hex)

    // SECURITY 2: SSRF Domain Lock (Prevents Hackers from redirecting webhooks)
    if (!SAMTRICS_WEBHOOK_URL.startsWith('https://samtrics.com')) {
      console.error('CRITICAL SSRF BLOCKED: Attempted to send webhook to unauthorized domain.')
      return
    }

    await fetch(SAMTRICS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SAMTRICS_API_KEY}`,
        'x-samtrics-signature': signature
      },
      body: payloadString
    }).catch(() => {})
    
    // Also insert into the local database audit log
    // const supabase = await createClient()
    // await supabase.from('samtrics_audit_logs').insert([{
    //   event_type: eventType,
    //   severity: severity,
    //   details: payload.details,
    //   created_at: payload.timestamp
    // }])
  } catch (error) {
    console.error('Failed to send Samtrics alert', error)
  }
}
