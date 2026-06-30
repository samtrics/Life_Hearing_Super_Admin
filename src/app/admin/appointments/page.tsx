import { createAdminClient } from '@/utils/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Clock, User, Phone, Search, FileText } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { DataTable } from './data-table'

export const metadata = {
  title: 'Appointments Management - Admin Secure',
}

export const dynamic = 'force-dynamic'

export default async function AppointmentsPage() {
  const supabase = createAdminClient()

  // Fetch all appointments, sorted by most recent date and time
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false })

  if (error) {
    console.error('Error fetching appointments:', error.message)
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">
        <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
        <p>Could not fetch appointments from the database. Please check your Supabase connection.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appointments Management</h1>
        <p className="text-muted-foreground mt-2">View, filter, and manage patient bookings.</p>
      </div>
      <DataTable data={appointments || []} />
    </div>
  )
}
