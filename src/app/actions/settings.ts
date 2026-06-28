'use server'

import { createClient } from '@/utils/supabase/server'
import { logAuditAction } from '@/utils/audit-logger'
import { revalidatePath } from 'next/cache'

export async function updateClinicSettings(formData: FormData) {
  const clinicName = formData.get('clinicName') as string
  const supportEmail = formData.get('supportEmail') as string
  const contactPhone = formData.get('contactPhone') as string

  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('clinic_settings')
    .update({
      clinic_name: clinicName,
      support_email: supportEmail,
      contact_phone: contactPhone,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)

  if (error) {
    return { error: error.message }
  }

  await logAuditAction('UPDATE_SETTINGS', { clinicName, supportEmail, contactPhone })
  
  revalidatePath('/admin/settings')
  return { success: true }
}
