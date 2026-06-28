"use client"

import React, { useState, useMemo, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, Event, View, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'

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
            <div className="mt-6 space-y-6">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Patient Information</h4>
                <p className="font-semibold">{selectedAppt.patient_name || `${selectedAppt.first_name} ${selectedAppt.last_name}`}</p>
                <p className="text-sm">{selectedAppt.phone}</p>
                <p className="text-sm">{selectedAppt.email}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Schedule</h4>
                <p className="font-semibold">{new Date(selectedAppt.appointment_date).toLocaleDateString()}</p>
                <p className="text-sm">{selectedAppt.appointment_time}</p>
                <p className="text-sm mt-2"><span className="font-medium text-muted-foreground">Status:</span> {selectedAppt.status}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Service details</h4>
                <p className="font-semibold capitalize">{selectedAppt.service || selectedAppt.reason}</p>
                <p className="text-sm mt-2"><span className="font-medium text-muted-foreground">Booking ID:</span> {selectedAppt.appointment_id}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
