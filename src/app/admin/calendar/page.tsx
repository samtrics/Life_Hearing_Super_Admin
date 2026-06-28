import { createClient } from '@/utils/supabase/server'
import CalendarClient from './CalendarClient'

export const metadata = {
  title: 'Calendar - Admin Secure',
}

export default async function CalendarPage() {
  const supabase = await createClient()

  // Fetch all appointments for the calendar
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')

  if (error) {
    console.error('Error fetching appointments for calendar:', error.message)
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">
        <h2 className="text-xl font-bold mb-2">Error Loading Calendar</h2>
        <p>Could not fetch appointments from the database.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clinic Calendar</h1>
        <p className="text-muted-foreground mt-2">Manage appointments through the monthly and daily schedule view.</p>
        
        {/* Legend */}
        <div className="flex gap-4 mt-4 text-sm font-medium">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Confirmed</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Pending</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Rescheduled</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-500"></span> Completed</div>
        </div>
      </div>
      
      <CalendarClient appointments={appointments || []} />
    </div>
  )
}
