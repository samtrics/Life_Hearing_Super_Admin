import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, CheckCircle2, ListTodo } from 'lucide-react'
import { isToday } from 'date-fns'

export const revalidate = 60  // revalidate at most every 60 seconds (ISR)

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all appointments
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (error) {
    console.error("Error fetching appointments:", error)
  }

  const allAppts = appointments || []

  // Calculate Statistics
  const todayAppts = allAppts.filter(a => isToday(new Date(a.appointment_date)))
  const pendingAppts = allAppts.filter(a => a.status.toLowerCase() === 'pending')
  const confirmedAppts = allAppts.filter(a => a.status.toLowerCase() === 'confirmed')
  const totalAppts = allAppts.length

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome back. Here's a quick summary of your clinic's status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Today's Appointments</CardTitle>
            <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <div className="text-4xl font-extrabold tracking-tight">{todayAppts.length}</div>
            <p className="text-sm font-medium text-emerald-600 mt-2 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pending Review</CardTitle>
            <div className="p-3 bg-amber-500/10 rounded-2xl group-hover:bg-amber-500/20 transition-colors">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <div className="text-4xl font-extrabold tracking-tight">{pendingAppts.length}</div>
            <p className="text-sm font-medium text-amber-600 mt-2">
              Require confirmation
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Confirmed</CardTitle>
            <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <div className="text-4xl font-extrabold tracking-tight">{confirmedAppts.length}</div>
            <p className="text-sm font-medium text-emerald-600 mt-2">
              Total confirmed bookings
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Appointments</CardTitle>
            <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
              <ListTodo className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <div className="text-4xl font-extrabold tracking-tight">{totalAppts}</div>
            <p className="text-sm font-medium text-muted-foreground mt-2">
              All-time appointments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule List */}
      <Card className="col-span-4 glass-card p-2">
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No appointments today</p>
              <p className="text-sm text-muted-foreground">Enjoy your free time!</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {todayAppts.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-5 border border-border/50 rounded-2xl bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:scale-105 transition-transform">
                      {(appt.patient_name || appt.first_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-lg text-foreground">{appt.patient_name || `${appt.first_name || ''} ${appt.last_name || ''}`.trim()}</span>
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <span className="capitalize">{appt.service || appt.reason}</span>
                        <span className="h-1 w-1 rounded-full bg-border"></span>
                        <span>{appt.phone}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-extrabold text-foreground">{appt.appointment_time}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${
                      appt.status.toLowerCase() === 'confirmed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      appt.status.toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-secondary/20 text-secondary-foreground'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
