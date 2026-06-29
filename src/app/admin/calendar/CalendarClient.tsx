"use client"

import React, { useState, useMemo, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, Event, View, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { User, Phone, Mail, Calendar as CalendarIcon, Clock, Stethoscope, Hash } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { Appointment } from '../appointments/columns'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarClientProps {
  appointments: Appointment[]
}

export default function CalendarClient({ appointments }: CalendarClientProps) {
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState<Date>(new Date())

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate)
  }, [])

  const handleView = useCallback((newView: View) => {
    setView(newView)
  }, [])

  // Map database appointments to react-big-calendar Event objects
  const events: (Event & { resource: Appointment })[] = useMemo(() => {
    return appointments.map((appt) => {
      // Parse date and time into a single Date object
      const dateStr = appt.appointment_date // YYYY-MM-DD
      
      // Convert time like "morning", "afternoon", "evening" into an actual Date object
      let hour = 9 // Default morning 9 AM
      let duration = 3 // 3 hours block
      
      if (appt.appointment_time?.toLowerCase().includes('afternoon')) {
        hour = 13 // 1 PM
        duration = 3
      } else if (appt.appointment_time?.toLowerCase().includes('evening')) {
        hour = 16 // 4 PM
        duration = 2
      }

      const start = new Date(dateStr)
      start.setHours(hour, 0, 0, 0)
      
      const end = new Date(start)
      end.setHours(hour + duration, 0, 0, 0)

      const name = appt.patient_name || `${appt.first_name || ''} ${appt.last_name || ''}`.trim()
      const service = appt.service || appt.reason || 'Consultation'

      return {
        title: `${name} - ${service}`,
        start,
        end,
        resource: appt,
      }
    })
  }, [appointments])

  const handleSelectEvent = useCallback((event: Event & { resource: Appointment }) => {
    setSelectedAppt(event.resource)
    setIsDetailsOpen(true)
  }, [])

  const eventPropGetter = useCallback((event: Event & { resource: Appointment }) => {
    const status = event.resource.status.toLowerCase()
    let backgroundColor = '#3b82f6' // blue default

    if (status === 'confirmed') backgroundColor = '#10b981' // emerald
    if (status === 'pending' || status === 'under review') backgroundColor = '#f59e0b' // amber
    if (status === 'cancelled' || status === 'rejected') backgroundColor = '#ef4444' // red
    if (status === 'rescheduled') backgroundColor = '#f97316' // orange
    if (status === 'completed') backgroundColor = '#6366f1' // indigo

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }, [])

  return (
    <div className="h-[700px] w-full bg-card rounded-2xl shadow-sm border p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        views={['month', 'week', 'day']}
        view={view}
        date={date}
        onView={handleView}
        onNavigate={handleNavigate}
      />

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Appointment Details</SheetTitle>
            <SheetDescription>
              Full details for {selectedAppt?.patient_name || `${selectedAppt?.first_name} ${selectedAppt?.last_name}`}
            </SheetDescription>
          </SheetHeader>
          {selectedAppt && (
            <div className="mt-8 flex flex-col gap-6 pb-8">
              {/* Profile Header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
                <div className="h-16 w-16 min-w-[64px] rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary shadow-inner">
                  {(selectedAppt.patient_name || selectedAppt.first_name || "P").charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-xl font-bold text-foreground truncate">
                    {selectedAppt.patient_name || `${selectedAppt.first_name || ''} ${selectedAppt.last_name || ''}`.trim()}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-background border shadow-sm text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {selectedAppt.appointment_id || 'LEGACY'}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm capitalize border ${selectedAppt.status.toLowerCase() === 'confirmed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : selectedAppt.status.toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : selectedAppt.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-background text-muted-foreground'}`}>
                      {selectedAppt.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info Card */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ml-1">
                  <User className="w-4 h-4" /> Contact Details
                </h4>
                <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 min-w-[40px] rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">Phone Number</span>
                      <span className="font-semibold text-foreground text-base">{selectedAppt.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 min-w-[40px] rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs text-muted-foreground font-medium">Email Address</span>
                      <span className="font-semibold text-foreground truncate">{selectedAppt.email || "No email provided"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Info Card */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ml-1">
                  <CalendarIcon className="w-4 h-4" /> Schedule Information
                </h4>
                <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 min-w-[40px] rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">Appointment Date</span>
                      <span className="font-semibold text-foreground">{new Date(selectedAppt.appointment_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 min-w-[40px] rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">Time Block</span>
                      <span className="font-semibold text-foreground capitalize">{selectedAppt.appointment_time}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Info Card */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ml-1">
                  <Stethoscope className="w-4 h-4" /> Service Information
                </h4>
                <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 min-w-[40px] rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">Reason for Visit</span>
                      <span className="font-semibold text-foreground capitalize">{selectedAppt.service || selectedAppt.reason || "Consultation"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
