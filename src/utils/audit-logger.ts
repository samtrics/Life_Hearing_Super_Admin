import { createClient } from './supabase/server'
import { headers } from 'next/headers'

export async function logAuditAction(action: string, details: any = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const headersList = await headers()
  const ip_address = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

  await supabase.from('audit_logs').insert({
    admin_id: user.id,
    action,
    details,
    ip_address
  })
}
