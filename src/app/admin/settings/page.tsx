import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateClinicSettings } from '@/app/actions/settings'

export const metadata = {
  title: 'Settings - Admin Secure',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const { data: settings } = await supabase
    .from('clinic_settings')
    .select('*')
    .eq('id', 1)
    .single()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your clinic preferences and master admin credentials.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-primary">Clinic Profile</CardTitle>
            <CardDescription>Update the master details for {settings?.clinic_name || 'Life Hearing Care'}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form key={settings?.updated_at?.toString() || "settings-form"} action={async (formData: FormData) => {
              "use server";
              await updateClinicSettings(formData);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Clinic Name</label>
                <Input name="clinicName" defaultValue={settings?.clinic_name || "Life Hearing Care"} className="bg-white/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Support Email</label>
                <Input name="supportEmail" defaultValue={settings?.support_email || "admin@lifehearingcare.com"} type="email" className="bg-white/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Contact Phone</label>
                <Input name="contactPhone" defaultValue={settings?.contact_phone || "+1 (555) 123-4567"} className="bg-white/50 border-border/50" />
              </div>
              <Button type="submit" className="w-full font-bold mt-2 shadow-md">Save Clinic Details</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
