import { createAdminClient } from '@/utils/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Phone, Mail, Calendar, Activity, Search, ArrowRight, UserPlus } from 'lucide-react'
import { PatientSearch } from './PatientSearch'
import { Suspense } from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Patient Directory - Admin Secure',
}

export const dynamic = 'force-dynamic'

export default async function PatientsPage(props: any) {
  const searchParams = await props.searchParams
  const q = searchParams?.q?.toLowerCase() || ''

  const supabase = createAdminClient()

  // Fetch all unique patients by email/phone from appointments table
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('first_name, last_name, email, phone, age, gender, appointment_date, appointment_time, reason, service, status')
    .order('created_at', { ascending: false })

  let patients: any[] = []
  
  if (appointments) {
    const patientMap = new Map()
    
    appointments.forEach(appt => {
      const identifier = appt.email || appt.phone
      const visit = {
        date: appt.appointment_date,
        time: appt.appointment_time,
        service: appt.service || appt.reason,
        status: appt.status
      }

      if (!patientMap.has(identifier)) {
        patientMap.set(identifier, {
          ...appt,
          appointment_count: 1,
          last_visit: appt.appointment_date,
          visits: [visit]
        })
      } else {
        const existing = patientMap.get(identifier)
        existing.appointment_count += 1
        existing.visits.push(visit)
        
        // Compare dates to find the most recent visit
        if (appt.appointment_date && (!existing.last_visit || new Date(appt.appointment_date) > new Date(existing.last_visit))) {
          existing.last_visit = appt.appointment_date
        }
      }
    })
    
    // Sort visits by date descending for each patient
    patients = Array.from(patientMap.values()).map(patient => {
      patient.visits.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      return patient
    })

    // Filter patients by search query
    if (q) {
      patients = patients.filter(p => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
        const mobile = p.phone || ''
        return fullName.includes(q) || mobile.includes(q)
      })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Directory</h1>
          <p className="text-muted-foreground mt-2">Manage your clinic's patient database and history.</p>
        </div>
        <Suspense fallback={<div className="h-10 w-full sm:w-[350px] bg-surface-container-lowest animate-pulse rounded-md"></div>}>
          <PatientSearch />
        </Suspense>
      </div>

      {patients.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No patients found</p>
            <p className="text-sm text-muted-foreground">Patients will appear here once they book an appointment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient, i) => {
            const name = patient.patient_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
            return (
              <Card key={i} className="glass-card group hover:-translate-y-2 hover:shadow-xl transition-all duration-500 overflow-hidden border-border/50">
                <CardHeader className="pb-4 border-b border-border/20 bg-gradient-to-br from-primary/5 to-transparent relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users className="h-16 w-16" />
                  </div>
                  <CardTitle className="text-xl font-extrabold flex items-center justify-between relative z-10">
                    <span className="text-foreground">{name}</span>
                    <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary/70" />
                    <span>{patient.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary/70" />
                    <span>{patient.email || 'No email'}</span>
                  </div>
                  <div className="pt-3 flex gap-2 border-t border-border/40 mt-3 flex-wrap">
                    <span className="text-xs font-semibold bg-surface-container-low px-2 py-1 rounded-md border border-border/50">
                      Age: {patient.age || 'N/A'}
                    </span>
                    <span className="text-xs font-semibold bg-surface-container-low px-2 py-1 rounded-md border border-border/50 capitalize">
                      {patient.gender || 'N/A'}
                    </span>
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="text-xs font-semibold bg-secondary/10 text-secondary px-2 py-1 rounded-md border border-secondary/20 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {patient.appointment_count} {patient.appointment_count === 1 ? 'Visit' : 'Visits'}
                    </span>
                  </div>

                  {patient.visits && patient.visits.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visit History</h4>
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                        {patient.visits.map((v: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-md bg-surface-container-lowest border border-border/30">
                            <div>
                              <p className="font-medium text-foreground line-clamp-1">{v.service || 'General Checkup'}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" /> {v.date ? new Date(v.date).toLocaleDateString() : 'Unknown'} at {v.time}
                              </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${v.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : v.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                              {v.status || 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
