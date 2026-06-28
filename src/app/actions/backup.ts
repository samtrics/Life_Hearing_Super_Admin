'use server'

import { createAdminClient } from '@/utils/supabase/admin'

export async function fetchBackupData() {
  const supabase = createAdminClient()
  
  const [
    { data: appointments },
    { data: patients },
    { data: feedbacks },
    { data: subscribers },
  ] = await Promise.all([
    supabase.from('appointments').select('*').order('appointment_date', { ascending: false }),
    supabase.from('appointments').select('phone, first_name, last_name, email, age, gender').order('created_at', { ascending: false }),
    supabase.from('patient_feedback').select('*').order('created_at', { ascending: false }),
    supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false }),
  ])

  return {
    appointments,
    patients,
    feedbacks,
    subscribers
  }
}

export async function fetchBackupStats() {
  const supabase = createAdminClient()
  
  const [{ count: apptCount }, { count: feedbackCount }] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('patient_feedback').select('*', { count: 'exact', head: true }),
  ])
  
  return {
    appointments: apptCount || 0,
    feedbacks: feedbackCount || 0
  }
}
