'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAppointmentStatus(appointmentId: string, newStatus: string) {
  const supabase = await createClient()

  // Ensure user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized access' }
  }

  // Update status
  const { error } = await supabase
    .from('appointments')
    .update({ status: newStatus })
    .eq('id', appointmentId)

  if (error) {
    return { error: error.message }
  }

  // PHASE 5: Trigger Email/SMS Notifications
  console.log(`[NOTIFICATION SYSTEM] Simulated Email sent to Patient for Appointment ${appointmentId}: Status is now ${newStatus}`)
  if (newStatus === 'Confirmed') {
    console.log(`[NOTIFICATION SYSTEM] Simulated SMS sent: Your appointment is confirmed!`)
  }

  // Optionally log this action in audit_logs
  await supabase.from('audit_logs').insert({
    admin_id: user.id,
    action: 'UPDATE_APPOINTMENT_STATUS',
    details: { appointmentId, newStatus }
  })

  // Revalidate the appointments page so the data is fresh
  revalidatePath('/admin/appointments')
  revalidatePath('/admin/dashboard')
  
  return { success: true }
}

export async function rescheduleAppointment(appointmentId: string, newDate: string, newTime: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Unauthorized access' }

  const { error } = await supabase
    .from('appointments')
    .update({ 
      appointment_date: newDate, 
      appointment_time: newTime,
      status: 'Rescheduled' 
    })
    .eq('id', appointmentId)

  if (error) return { error: error.message }

  await supabase.from('audit_logs').insert({
    admin_id: user.id,
    action: 'RESCHEDULE_APPOINTMENT',
    details: { appointmentId, newDate, newTime }
  })

  revalidatePath('/admin/appointments')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deleteAppointment(appointmentId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Unauthorized access' }

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId)

  if (error) return { error: error.message }

  await supabase.from('audit_logs').insert({
    admin_id: user.id,
    action: 'DELETE_APPOINTMENT',
    details: { appointmentId }
  })

  revalidatePath('/admin/appointments')
  revalidatePath('/admin/dashboard')
  return { success: true }
}
