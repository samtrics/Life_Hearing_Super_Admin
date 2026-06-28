"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateAppointmentStatus, deleteAppointment } from "@/app/actions/appointments"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export type Appointment = {
  id: string
  appointment_id: string
  patient_name: string
  first_name?: string
  last_name?: string
  phone: string
  email: string
  service: string
  reason: string
  appointment_date: string
  appointment_time: string
  status: string
  created_at: string
}

export const columns = (onReschedule: (appt: Appointment) => void, onViewDetails: (appt: Appointment) => void): ColumnDef<Appointment>[] => [
  {
    accessorKey: "patient_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Patient Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.original.patient_name || `${row.original.first_name || ''} ${row.original.last_name || ''}`.trim()
      return <div className="font-medium ml-4">{name}</div>
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "service",
    header: "Service",
    cell: ({ row }) => {
      return <div className="capitalize">{row.original.service || row.original.reason || "Consultation"}</div>
    }
  },
  {
    accessorKey: "appointment_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.original.appointment_date)
      return <div className="ml-4">{date.toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "appointment_time",
    header: "Time",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status.toLowerCase()
      
      let badgeClasses = "capitalize font-bold rounded-full px-3 py-1 shadow-sm border-0 "
      if (status === 'confirmed') badgeClasses += 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-emerald-500/20'
      else if (status === 'pending' || status === 'under review') badgeClasses += 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-amber-500/20'
      else if (status === 'cancelled' || status === 'rejected') badgeClasses += 'bg-gradient-to-r from-red-400 to-red-600 text-white shadow-red-500/20'
      else if (status === 'completed') badgeClasses += 'bg-gradient-to-r from-indigo-400 to-indigo-600 text-white shadow-indigo-500/20'
      else badgeClasses += 'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
      
      return <Badge className={badgeClasses}>{row.original.status}</Badge>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const appt = row.original

      const handleStatusUpdate = async (newStatus: string) => {
        const toastId = toast.loading(`Updating to ${newStatus}...`)
        const res = await updateAppointmentStatus(appt.id, newStatus)
        if (res.success) {
          toast.success(`Appointment ${newStatus}`, { id: toastId })
        } else {
          toast.error(res.error || "Failed to update", { id: toastId })
        }
      }

      const handleDelete = async () => {
        if (!confirm("Are you sure you want to permanently delete this appointment?")) return
        const toastId = toast.loading("Deleting appointment...")
        const res = await deleteAppointment(appt.id)
        if (res.success) {
          toast.success("Appointment deleted", { id: toastId })
        } else {
          toast.error(res.error || "Failed to delete", { id: toastId })
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          } />
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetails(appt)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStatusUpdate('Confirmed')} className="text-emerald-600 font-medium">
              Approve Appointment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate('Completed')} className="text-blue-600 font-medium">
              Mark as Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReschedule(appt)}>
              Reschedule
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate('Cancelled')} className="text-amber-600 font-medium">
              Cancel Appointment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive font-medium">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
