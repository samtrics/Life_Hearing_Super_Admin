'use client'

import React, { useState, useTransition } from 'react'
import { Search, ChevronDown, ChevronUp, Calendar, Clock, Phone, Mail, FileText, CheckCircle, XCircle, Clock3 } from 'lucide-react'
import { updateAppointmentStatus } from '@/app/actions/appointments'

type Appointment = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  alt_phone: string | null
  appointment_date: string
  appointment_time: string
  reason: string
  notes: string | null
  status: string
  created_at: string
}

export default function AppointmentsClient({ initialData }: { initialData: Appointment[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Filter appointments
  const filteredAppointments = initialData.filter(app => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      app.first_name.toLowerCase().includes(query) ||
      app.last_name.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query) ||
      app.phone.includes(query) ||
      app.id.toLowerCase().includes(query)
    )
  })

  const toggleExpand = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null)
    } else {
      setExpandedRow(id)
    }
  }

  const handleStatusUpdate = (id: string, newStatus: string) => {
    startTransition(async () => {
      await updateAppointmentStatus(id, newStatus)
      // The page will automatically revalidate and fetch fresh data from server
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3"/> Confirmed</span>
      case 'Pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock3 className="w-3 h-3"/> Pending</span>
      case 'Completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3"/> Completed</span>
      case 'Declined':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3"/> Declined</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Appointments Management</h1>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="p-4 font-semibold">Patient Name</th>
                <th className="p-4 font-semibold">Date & Time</th>
                <th className="p-4 font-semibold">Contact Info</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <React.Fragment key={app.id}>
                    {/* Main Row */}
                    <tr className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <p className="font-semibold text-gray-900">{app.first_name} {app.last_name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">ID: {app.id.split('-')[0]}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <Calendar className="w-4 h-4 text-gray-400" /> {app.appointment_date}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                          <Clock className="w-4 h-4 text-gray-400" /> {app.appointment_time}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-900 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" /> {app.phone}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                          <Mail className="w-4 h-4 text-gray-400" /> {app.email}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => toggleExpand(app.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          {expandedRow === app.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {expandedRow === app.id && (
                      <tr className="bg-blue-50/50 border-t-0">
                        <td colSpan={5} className="p-6">
                          <div className="flex flex-col lg:flex-row gap-8">
                            
                            <div className="flex-1 space-y-4">
                              <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                  <FileText className="w-4 h-4" /> Medical Reason
                                </h4>
                                <p className="text-gray-900 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">{app.reason}</p>
                              </div>
                              {app.notes && (
                                <div>
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Additional Notes
                                  </h4>
                                  <p className="text-gray-700 text-sm bg-white p-3 rounded-lg border border-gray-100 shadow-sm italic">{app.notes}</p>
                                </div>
                              )}
                              {app.alt_phone && (
                                <div>
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Alternative Phone
                                  </h4>
                                  <p className="text-gray-900">{app.alt_phone}</p>
                                </div>
                              )}
                            </div>

                            <div className="w-full lg:w-64 flex flex-col gap-2">
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Update Status</h4>
                              
                              <button 
                                onClick={() => handleStatusUpdate(app.id, 'Confirmed')}
                                disabled={isPending || app.status === 'Confirmed'}
                                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                              >
                                Confirm Appointment
                              </button>
                              
                              <button 
                                onClick={() => handleStatusUpdate(app.id, 'Completed')}
                                disabled={isPending || app.status === 'Completed'}
                                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                              >
                                Mark Completed
                              </button>
                              
                              <button 
                                onClick={() => handleStatusUpdate(app.id, 'Declined')}
                                disabled={isPending || app.status === 'Declined'}
                                className="w-full py-2 px-4 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 text-sm font-bold rounded-lg transition-colors"
                              >
                                Decline / Cancel
                              </button>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No appointments found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
