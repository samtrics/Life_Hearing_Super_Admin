"use client"

import * as React from "react"
import { Download, User, Phone, Mail, Calendar, Clock, Stethoscope, Hash } from "lucide-react"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Appointment, columns } from "./columns"
import { rescheduleAppointment } from "@/app/actions/appointments"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataTableProps {
  data: Appointment[]
}

export function DataTable({ data }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  
  // Drawer/Modal State
  const [selectedAppt, setSelectedAppt] = React.useState<Appointment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = React.useState(false)
  
  // Reschedule Form State
  const [newDate, setNewDate] = React.useState("")
  const [newTime, setNewTime] = React.useState("")

  const openDetails = (appt: Appointment) => {
    setSelectedAppt(appt)
    setIsDetailsOpen(true)
  }

  const openReschedule = (appt: Appointment) => {
    setSelectedAppt(appt)
    setNewDate(appt.appointment_date)
    setNewTime(appt.appointment_time || "morning")
    setIsRescheduleOpen(true)
  }

  const tableColumns = React.useMemo(() => columns(openReschedule, openDetails), [])

  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppt) return
    const toastId = toast.loading("Rescheduling appointment...")
    const res = await rescheduleAppointment(selectedAppt.id, newDate, newTime)
    if (res.success) {
      toast.success("Appointment rescheduled successfully", { id: toastId })
      setIsRescheduleOpen(false)
    } else {
      toast.error(res.error || "Failed to reschedule", { id: toastId })
    }
  }
  const handleFilterStatus = (status: string) => {
    table.getColumn("status")?.setFilterValue(status === "All" ? "" : status)
  }

  // Export to CSV
  const handleExportCSV = () => {
    const rows = table.getFilteredRowModel().rows
    const headers = ['Patient Name', 'Phone', 'Service', 'Date', 'Time', 'Status']
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => {
        const appt = row.original
        const name = appt.patient_name || `${appt.first_name || ''} ${appt.last_name || ''}`.trim()
        const date = new Date(appt.appointment_date).toLocaleDateString()
        return `"${name}","${appt.phone}","${appt.service || appt.reason}","${date}","${appt.appointment_time}","${appt.status}"`
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `appointments_export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex w-full max-w-sm gap-2">
          <Input
            placeholder="Filter by patient name..."
            value={(table.getColumn("patient_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("patient_name")?.setFilterValue(event.target.value)
            }
            className="bg-background"
          />
          <Button variant="outline" onClick={handleExportCSV} title="Export to CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
          {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(status => (
            <Button 
              key={status} 
              variant={table.getColumn("status")?.getFilterValue() === (status === 'All' ? "" : status) ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterStatus(status)}
              className={`rounded-full shadow-sm transition-all duration-300 ${table.getColumn("status")?.getFilterValue() === (status === 'All' ? "" : status) ? 'bg-gradient-to-r from-primary to-emerald-500 text-white border-none' : 'bg-white/50 backdrop-blur-md hover:bg-white'}`}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/40 shadow-lg">
        <Table>
          <TableHeader className="bg-primary/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-primary/5 transition-colors duration-200"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} appointments.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Drawer: View Details */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
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
                  <Calendar className="w-4 h-4" /> Schedule Information
                </h4>
                <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 min-w-[40px] rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <Calendar className="w-5 h-5" />
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

      {/* Modal: Reschedule */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time block. The patient will be notified automatically once implemented.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRescheduleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Date</label>
              <Input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Time Block</label>
              <Select value={newTime} onValueChange={(val) => setNewTime(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time block" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm-4pm)</SelectItem>
                  <SelectItem value="evening">Late Afternoon (4pm-6pm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 flex justify-end">
              <Button type="submit">Confirm Reschedule</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
