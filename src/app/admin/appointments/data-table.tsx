"use client"

import * as React from "react"
import { Download } from "lucide-react"
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
